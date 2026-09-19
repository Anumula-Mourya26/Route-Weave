const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  red: '\x1b[31m',
};

console.log(`
${C.bright}${C.cyan}╔═══════════════════════════════════════════════════════════════════════════════╗
║   🚀  SH-205 SYSTEM DEMO RUNNER — UNIFIED SERVICES ORCHESTRATOR             ║
║   Node.js Gateway  •  Python OR-Tools Engine  •  React Presentation UI        ║
╚═══════════════════════════════════════════════════════════════════════════════╝${C.reset}
`);

// Helper to check if a service is responsive on a port
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startOrchestrator() {
  const children = [];

  // 1. Python FastAPI Engine (Port 8000)
  const isPythonUp = await checkPort(8000);
  if (isPythonUp) {
    console.log(`  ${C.green}✔ Python OR-Tools Engine already active on http://localhost:8000${C.reset}`);
  } else {
    console.log(`  ${C.yellow}⚡ Starting Python OR-Tools Engine on port 8000...${C.reset}`);
    const venvPython = process.platform === 'win32'
      ? path.join(__dirname, 'python-engine', 'venv', 'Scripts', 'python.exe')
      : path.join(__dirname, 'python-engine', 'venv', 'bin', 'python');

    const pyProcess = spawn(venvPython, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], {
      cwd: path.join(__dirname, 'python-engine'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    pyProcess.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${C.dim}${C.cyan}[PYTHON]${C.reset} ${line}`);
    });
    pyProcess.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${C.dim}${C.cyan}[PYTHON]${C.reset} ${line}`);
    });

    children.push(pyProcess);
  }

  // 2. Node.js Backend Gateway (Port 3000)
  const isNodeUp = await checkPort(3000);
  if (isNodeUp) {
    console.log(`  ${C.green}✔ Node.js Backend Gateway already active on http://localhost:3000${C.reset}`);
  } else {
    console.log(`  ${C.yellow}⚡ Starting Node.js Backend Gateway on port 3000...${C.reset}`);
    const nodeProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'backend'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    nodeProcess.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${C.dim}${C.green}[BACKEND]${C.reset} ${line}`);
    });
    nodeProcess.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${C.dim}${C.green}[BACKEND]${C.reset} ${line}`);
    });

    children.push(nodeProcess);
  }

  // 3. React Frontend (Port 5173)
  const isViteUp = await checkPort(5173);
  if (isViteUp) {
    console.log(`  ${C.green}✔ React Presentation UI already active on http://localhost:5173${C.reset}`);
  } else {
    console.log(`  ${C.yellow}⚡ Starting React Frontend on port 5173...${C.reset}`);
    const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
      cwd: path.join(__dirname, 'frontend'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    viteProcess.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${C.dim}${C.magenta}[FRONTEND]${C.reset} ${line}`);
    });
    viteProcess.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${C.dim}${C.magenta}[FRONTEND]${C.reset} ${line}`);
    });

    children.push(viteProcess);
  }

  console.log(`
${C.bright}${C.green}═══════════════════════════════════════════════════════════════════════════════
🎉  DEMO ENVIRONMENT READY IN PRESENTATION MODE!
═══════════════════════════════════════════════════════════════════════════════${C.reset}

  ${C.bright}👉 Integrated Pitch Deck:${C.reset}  ${C.cyan}http://localhost:5173/?view=presentation${C.reset}
  ${C.bright}👉 Live Operations Map :${C.reset}  ${C.cyan}http://localhost:5173/?view=map${C.reset}
  ${C.bright}👉 Node.js API Gateway :${C.reset}  ${C.dim}http://localhost:3000/api/shipments${C.reset}
  ${C.bright}👉 Python Docs & Models:${C.reset}  ${C.dim}http://localhost:8000/docs${C.reset}

  ${C.yellow}Press [Ctrl + C] to terminate all unified processes.${C.reset}
`);

  // Keep event loop alive if all services were already active (unless --check passed)
  if (children.length === 0 && !process.argv.includes('--check')) {
    setInterval(() => {}, 60000);
  }

  // Clean exit handler
  const cleanup = () => {
    console.log(`\n${C.yellow}Shutting down demo services...${C.reset}`);
    children.forEach((c) => {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', c.pid, '/f', '/t']);
        } else {
          c.kill('SIGTERM');
        }
      } catch (e) {}
    });
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startOrchestrator();
