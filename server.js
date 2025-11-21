const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

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

app.use(express.static(path.join(__dirname)));
app.use(express.json());

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Lumo OS static server running at http://localhost:${port}`);
});
