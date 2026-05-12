const { spawn, spawnSync } = require('child_process');

/**
 * Cross-platform script to run all services (API, Worker, Web) in parallel.
 * This script works on Windows, macOS, and Linux.
 */

const useShell = process.platform === 'win32';

const services = [
  { name: 'API   ', command: 'pnpm', args: ['--filter', '@mailer/api', 'dev'], color: 32 }, // Green
  { name: 'Worker', command: 'pnpm', args: ['--filter', '@mailer/worker', 'dev'], color: 34 }, // Blue
  { name: 'Web   ', command: 'pnpm', args: ['--filter', 'web', 'dev'], color: 36 }, // Cyan
];

const buildSteps = [
  { name: 'Shared', command: 'pnpm', args: ['--filter', '@mailer/shared', 'build'] },
  { name: 'Database', command: 'pnpm', args: ['--filter', '@mailer/database', 'build'] },
];

for (const step of buildSteps) {
  console.log(`\x1b[1m\x1b[35mBuilding ${step.name} package...\x1b[0m`);

  const result = spawnSync(step.command, step.args, {
    shell: useShell,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`\x1b[31mFailed to build ${step.name}: ${result.error.message}\x1b[0m`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\x1b[1m\x1b[35m🚀 Starting Mailer Platform Services...\x1b[0m\n');

const children = services.map(service => {
  const env = { ...process.env };
  if (service.name.includes('Web')) {
    env.PORT = '3001';
    env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api/v1';
  }

  const child = spawn(service.command, service.args, {
    shell: useShell,
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

let shuttingDown = false;

const cleanup = () => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
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
process.once('SIGINT', cleanup);
process.once('SIGTERM', cleanup);
