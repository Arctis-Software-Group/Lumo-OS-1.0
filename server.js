const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

// Load .env manually since dotenv is not installed
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
} catch (e) {
  console.error('Error loading .env:', e);
}

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 100 * 1024 * 1024 // 100MB max file size
});

// LumoDrop - Device and Connection Management
const lumoDropDevices = new Map(); // deviceId -> { socket, name, platform, publicKey, lastSeen }
const lumoDropRooms = new Map(); // roomCode -> { devices: Set, createdAt, encrypted }
const pendingTransfers = new Map(); // transferId -> { from, to, fileName, fileSize, chunks, status }

// Generate room code
function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Generate device ID
function generateDeviceId() {
  return 'LD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Socket.IO Connection Handler for LumoDrop
io.on('connection', (socket) => {
  console.log('[LumoDrop] Client connected:', socket.id);
  
  let deviceInfo = null;
  let currentRoom = null;

  // Device Registration
  socket.on('lumoDrop:register', (data, callback) => {
    const deviceId = data.deviceId || generateDeviceId();
    deviceInfo = {
      id: deviceId,
      socketId: socket.id,
      name: data.name || 'Unknown Device',
      platform: data.platform || 'unknown',
      publicKey: data.publicKey || null,
      lastSeen: Date.now(),
      avatar: data.avatar || 'fa-solid fa-laptop'
    };
    
    lumoDropDevices.set(deviceId, { socket, ...deviceInfo });
    console.log(`[LumoDrop] Device registered: ${deviceInfo.name} (${deviceId})`);
    
    if (callback) callback({ success: true, deviceId });
  });

  // Create Room
  socket.on('lumoDrop:createRoom', (data, callback) => {
    if (!deviceInfo) {
      if (callback) callback({ success: false, error: 'Device not registered' });
      return;
    }

    const roomCode = generateRoomCode();
    lumoDropRooms.set(roomCode, {
      host: deviceInfo.id,
      devices: new Set([deviceInfo.id]),
      createdAt: Date.now(),
      encrypted: data.encrypted !== false
    });

    currentRoom = roomCode;
    socket.join(roomCode);
    
    console.log(`[LumoDrop] Room created: ${roomCode} by ${deviceInfo.name}`);
    if (callback) callback({ success: true, roomCode });
  });

  // Join Room
  socket.on('lumoDrop:joinRoom', (data, callback) => {
    if (!deviceInfo) {
      if (callback) callback({ success: false, error: 'Device not registered' });
      return;
    }

    const { roomCode } = data;
    const room = lumoDropRooms.get(roomCode);

    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    room.devices.add(deviceInfo.id);
    currentRoom = roomCode;
    socket.join(roomCode);

    // Notify other devices in room
    const devices = Array.from(room.devices).map(id => {
      const dev = lumoDropDevices.get(id);
      return dev ? { id: dev.id, name: dev.name, platform: dev.platform, avatar: dev.avatar } : null;
    }).filter(Boolean);

    socket.to(roomCode).emit('lumoDrop:deviceJoined', {
      device: { id: deviceInfo.id, name: deviceInfo.name, platform: deviceInfo.platform, avatar: deviceInfo.avatar }
    });

    console.log(`[LumoDrop] ${deviceInfo.name} joined room: ${roomCode}`);
    if (callback) callback({ success: true, devices, roomCode });
  });

  // Leave Room
  socket.on('lumoDrop:leaveRoom', (callback) => {
    if (currentRoom && deviceInfo) {
      const room = lumoDropRooms.get(currentRoom);
      if (room) {
        room.devices.delete(deviceInfo.id);
        socket.to(currentRoom).emit('lumoDrop:deviceLeft', { deviceId: deviceInfo.id });
        
        // Delete room if empty
        if (room.devices.size === 0) {
          lumoDropRooms.delete(currentRoom);
          console.log(`[LumoDrop] Room deleted: ${currentRoom}`);
        }
      }
      socket.leave(currentRoom);
      currentRoom = null;
    }
    if (callback) callback({ success: true });
  });

  // Get Room Devices
  socket.on('lumoDrop:getRoomDevices', (callback) => {
    if (!currentRoom) {
      if (callback) callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = lumoDropRooms.get(currentRoom);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    const devices = Array.from(room.devices).map(id => {
      const dev = lumoDropDevices.get(id);
      return dev ? { id: dev.id, name: dev.name, platform: dev.platform, avatar: dev.avatar } : null;
    }).filter(d => d && d.id !== deviceInfo?.id);

    if (callback) callback({ success: true, devices });
  });

  // Chat Message
  socket.on('lumoDrop:chatMessage', (data) => {
    if (!currentRoom || !deviceInfo) return;

    const message = {
      id: crypto.randomBytes(8).toString('hex'),
      from: { id: deviceInfo.id, name: deviceInfo.name, avatar: deviceInfo.avatar },
      content: data.content,
      encrypted: data.encrypted || false,
      timestamp: Date.now()
    };

    io.to(currentRoom).emit('lumoDrop:chatMessage', message);
    console.log(`[LumoDrop] Chat in ${currentRoom}: ${deviceInfo.name}: ${data.content.substring(0, 50)}...`);
  });

  // File Transfer - Initiate
  socket.on('lumoDrop:fileTransferInit', (data, callback) => {
    if (!currentRoom || !deviceInfo) {
      if (callback) callback({ success: false, error: 'Not in a room' });
      return;
    }

    const transferId = crypto.randomBytes(8).toString('hex');
    const transfer = {
      id: transferId,
      from: deviceInfo.id,
      to: data.to || 'all', // 'all' for broadcast
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      encrypted: data.encrypted || false,
      iv: data.iv, // IV for AES encryption
      chunks: [],
      totalChunks: data.totalChunks,
      receivedChunks: 0,
      status: 'pending',
      timestamp: Date.now()
    };

    pendingTransfers.set(transferId, transfer);

    // Notify recipient(s)
    const notification = {
      transferId,
      from: { id: deviceInfo.id, name: deviceInfo.name },
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      encrypted: data.encrypted
    };

    if (data.to === 'all') {
      socket.to(currentRoom).emit('lumoDrop:fileTransferRequest', notification);
    } else {
      const targetDevice = lumoDropDevices.get(data.to);
      if (targetDevice) {
        targetDevice.socket.emit('lumoDrop:fileTransferRequest', notification);
      }
    }

    console.log(`[LumoDrop] File transfer initiated: ${data.fileName} (${transferId})`);
    if (callback) callback({ success: true, transferId });
  });

  // File Transfer - Accept
  socket.on('lumoDrop:fileTransferAccept', (data) => {
    const transfer = pendingTransfers.get(data.transferId);
    if (transfer) {
      transfer.status = 'accepted';
      const senderDevice = lumoDropDevices.get(transfer.from);
      if (senderDevice) {
        senderDevice.socket.emit('lumoDrop:fileTransferAccepted', {
          transferId: data.transferId,
          by: deviceInfo?.id
        });
      }
    }
  });

  // File Transfer - Reject
  socket.on('lumoDrop:fileTransferReject', (data) => {
    const transfer = pendingTransfers.get(data.transferId);
    if (transfer) {
      transfer.status = 'rejected';
      const senderDevice = lumoDropDevices.get(transfer.from);
      if (senderDevice) {
        senderDevice.socket.emit('lumoDrop:fileTransferRejected', {
          transferId: data.transferId,
          by: deviceInfo?.id
        });
      }
      pendingTransfers.delete(data.transferId);
    }
  });

  // File Transfer - Send Chunk
  socket.on('lumoDrop:fileChunk', (data) => {
    const transfer = pendingTransfers.get(data.transferId);
    if (!transfer || transfer.status !== 'accepted') return;

    // Forward chunk to recipient(s)
    if (transfer.to === 'all') {
      socket.to(currentRoom).emit('lumoDrop:fileChunk', data);
    } else {
      const targetDevice = lumoDropDevices.get(transfer.to);
      if (targetDevice) {
        targetDevice.socket.emit('lumoDrop:fileChunk', data);
      }
    }
  });

  // File Transfer - Complete
  socket.on('lumoDrop:fileTransferComplete', (data) => {
    const transfer = pendingTransfers.get(data.transferId);
    if (transfer) {
      transfer.status = 'completed';
      
      // Notify all parties
      if (transfer.to === 'all') {
        io.to(currentRoom).emit('lumoDrop:fileTransferComplete', {
          transferId: data.transferId,
          success: true
        });
      } else {
        const senderDevice = lumoDropDevices.get(transfer.from);
        const receiverDevice = lumoDropDevices.get(transfer.to);
        if (senderDevice) senderDevice.socket.emit('lumoDrop:fileTransferComplete', { transferId: data.transferId, success: true });
        if (receiverDevice) receiverDevice.socket.emit('lumoDrop:fileTransferComplete', { transferId: data.transferId, success: true });
      }

      console.log(`[LumoDrop] File transfer completed: ${transfer.fileName}`);
      pendingTransfers.delete(data.transferId);
    }
  });

  // Key Exchange for E2E Encryption
  socket.on('lumoDrop:keyExchange', (data) => {
    if (!currentRoom) return;
    
    // Broadcast public key to room
    socket.to(currentRoom).emit('lumoDrop:keyExchange', {
      from: deviceInfo?.id,
      publicKey: data.publicKey
    });
  });

  // Typing Indicator
  socket.on('lumoDrop:typing', (data) => {
    if (!currentRoom || !deviceInfo) return;
    socket.to(currentRoom).emit('lumoDrop:typing', {
      deviceId: deviceInfo.id,
      name: deviceInfo.name,
      isTyping: data.isTyping
    });
  });

  // Ping/Heartbeat
  socket.on('lumoDrop:ping', (callback) => {
    if (deviceInfo) {
      deviceInfo.lastSeen = Date.now();
      const dev = lumoDropDevices.get(deviceInfo.id);
      if (dev) dev.lastSeen = Date.now();
    }
    if (callback) callback({ pong: true, time: Date.now() });
  });

  // Disconnect Handler
  socket.on('disconnect', () => {
    if (deviceInfo) {
      console.log(`[LumoDrop] Device disconnected: ${deviceInfo.name} (${deviceInfo.id})`);
      
      // Leave current room
      if (currentRoom) {
        const room = lumoDropRooms.get(currentRoom);
        if (room) {
          room.devices.delete(deviceInfo.id);
          socket.to(currentRoom).emit('lumoDrop:deviceLeft', { deviceId: deviceInfo.id });
          
          if (room.devices.size === 0) {
            lumoDropRooms.delete(currentRoom);
          }
        }
      }
      
      // Remove from devices
      lumoDropDevices.delete(deviceInfo.id);
    }
  });
});

// Cleanup stale devices periodically
setInterval(() => {
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  
  for (const [deviceId, device] of lumoDropDevices.entries()) {
    if (now - device.lastSeen > staleThreshold) {
      console.log(`[LumoDrop] Removing stale device: ${device.name}`);
      lumoDropDevices.delete(deviceId);
    }
  }
}, 60000);

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '100mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// API Endpoints
app.post('/api/lumora/verify', (req, res) => {
  const { code } = req.body;
  if (code === process.env.LUMORA_ACCESS_KEY) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid access code' });
  }
});

app.post('/api/lumora/chat', async (req, res) => {
  const { messages, model, accessKey } = req.body;

  // Verify Access Key again
  if (accessKey !== process.env.LUMORA_ACCESS_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Access Key' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'Server Configuration Error: Missing API Key' });
  }

  try {
    const reqBody = JSON.stringify({
      model: model,
      messages: messages
    });

    // Use the incoming request's origin/referer or default to Lumo OS
    const siteUrl = req.get('Origin') || req.get('Referer') || 'https://lumo-os.com';
    const siteName = 'Lumo OS';

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
        'Content-Length': Buffer.byteLength(reqBody)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => { data += chunk; });
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          res.json(json);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse upstream response' });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error(e);
      res.status(500).json({ error: 'Upstream connection error' });
    });

    apiReq.write(reqBody);
    apiReq.end();

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// LumoDrop API Endpoints
app.get('/api/lumoDrop/status', (req, res) => {
  res.json({
    active: true,
    devices: lumoDropDevices.size,
    rooms: lumoDropRooms.size
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(port, () => {
  console.log(`Lumo OS server running at http://localhost:${port}`);
  console.log(`LumoDrop WebSocket server active on same port`);
});
