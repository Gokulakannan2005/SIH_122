import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

console.log('========================================================');
console.log('🚀 Starting DATUM System (Backend SQLite + Frontend Vite)');
console.log('========================================================\n');

// 1. Start Backend Server
const backend = spawn('node', ['--experimental-strip-types', 'src/server.ts'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (d) => {
  process.stdout.write(`[BACKEND] ${d.toString()}`);
});

backend.stderr.on('data', (d) => {
  process.stderr.write(`[BACKEND ERR] ${d.toString()}`);
});

// 2. Start Frontend Dev Server
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'pipe',
  shell: true,
});

frontend.stdout.on('data', (d) => {
  process.stdout.write(`[FRONTEND] ${d.toString()}`);
});

frontend.stderr.on('data', (d) => {
  process.stderr.write(`[FRONTEND ERR] ${d.toString()}`);
});

// Clean exit on termination
function cleanup() {
  console.log('\nStopping DATUM servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
