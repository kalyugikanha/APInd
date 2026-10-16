/**
 * Startup script for Render and Production environments
 * Runs db push and seed on boot for either PostgreSQL or SQLite, then launches next start
 */
const { execSync, spawn } = require('child_process');

console.log('--------------------------------------------------');
console.log('🚀 Starting Colladome API Platform...');
console.log('--------------------------------------------------');

const rawDbUrl = process.env.DATABASE_URL || '';
const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');

// Ensure DATABASE_URL is always present in process.env before Next.js boots
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

if (isPostgres) {
  console.log('🔄 Checking production PostgreSQL database schema and initial seed...');
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit', env: process.env });
    console.log('🌱 Ensuring initial platform seed data is in place...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env });
    console.log('✅ Production PostgreSQL database is ready and in sync.');
  } catch (err) {
    console.warn('⚠️ Notice during runtime PostgreSQL check:', err.message || err);
  }
} else {
  console.log('📁 Verifying SQLite database status...');
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit', env: process.env });
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env });
    console.log('✅ SQLite database is ready and in sync.');
  } catch (err) {
    console.warn('⚠️ Notice during SQLite setup:', err.message || err);
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
