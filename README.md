# Lumo OS — Project

This repo contains a lightweight mock of a desktop UI called *Lumo OS* and is intentionally built using only HTML, CSS and JavaScript. The project includes a small Node.js Express server for local testing.

Setup

1. Install dependencies

```bash
npm install
```

2. Start the server

```bash
npm start
```

Then open http://localhost:3000 in your browser.

Development

Use `npm run dev` to start the server with `nodemon` for hot reloads on file changes.

Project structure

- `index.html` — main HTML page (routes to `src/` assets)
- `src/styles.css` — all styles
- `src/app.js` — JavaScript logic
- `server.js` — static server for local development

Notes

- This is intentionally written as a static frontend-like project; the Node server only serves static files.
- Tailwind and Font Awesome are included via CDN in `index.html`.

Cmd commands

- Open the `Cmd` app from the dock to interact with the command shell.
- Available commands: `help`, `date`, `time`, `uptime`, `apps`, `open <app>`, `close <app>`, `ls <folder>`, `lang <code>`, `whoami`, `calc <expr>`, `clear`, `echo`, `reboot`, `about`.
- Examples:
	- `apps` — lists installed and system apps
	- `open notes` — opens the Notes app
	- `ls system` — lists files in the System folder
	- `calc 12*(3+4)` — evaluate a simple arithmetic expression
