/**
 * Startup script for Render and Production environments
 * Runs db push and seed on boot if DATABASE_URL is present, then launches next start
 */
const { execSync, spawn } = require('child_process');

console.log('--------------------------------------------------');
console.log('🚀 Starting Colladome API Platform...');
console.log('--------------------------------------------------');

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
  console.log('🔄 Checking production database schema and initial seed...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    console.log('🌱 Ensuring initial platform seed data is in place...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env });
    console.log('✅ Production database is ready and in sync.');
  } catch (err) {
    console.warn('⚠️ Notice during runtime DB check:', err.message || err);
  }
}

// Start Next.js server
console.log('🌐 Launching Next.js server on port', process.env.PORT || 3000, '...');
const child = spawn('npx', ['next', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
