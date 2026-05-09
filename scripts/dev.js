const { spawn } = require('child_process');

/**
 * Cross-platform script to run all services (API, Worker, Web) in parallel.
 * This script works on Windows, macOS, and Linux.
 */

const services = [
  { name: 'API   ', command: 'pnpm', args: ['--filter', '@mailer/api', 'dev'], color: 32 }, // Green
  { name: 'Worker', command: 'pnpm', args: ['--filter', '@mailer/worker', 'dev'], color: 34 }, // Blue
  { name: 'Web   ', command: 'pnpm', args: ['--filter', 'web', 'dev'], color: 36 }, // Cyan
];

console.log('\x1b[1m\x1b[35m🚀 Starting Mailer Platform Services...\x1b[0m\n');

const children = services.map(service => {
  const env = { ...process.env };
  if (service.name.includes('Web')) {
    env.PORT = '3001';
    env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api/v1';
  }

  const child = spawn(service.command, service.args, {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    env
  });

  const prefix = `\x1b[${service.color}m[${service.name}]\x1b[0m `;

  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(output.split('\n').map(line => prefix + line).join('\n'));
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(output.split('\n').map(line => prefix + line).join('\n'));
    }
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}\x1b[31mExited with code ${code}\x1b[0m`);
    }
  });

  return child;
});

const cleanup = () => {
  console.log('\n\x1b[1m\x1b[31m🛑 Shutting down all services...\x1b[0m');
  children.forEach(child => {
    if (!child.killed) {
      // In some environments, child.kill() might not kill the process tree
      // but for dev servers it usually works.
      child.kill();
    }
  });
  process.exit();
};

// Handle termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
