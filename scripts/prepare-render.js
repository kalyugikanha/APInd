/**
 * Prepare Render Build script
 * 1. Checks DATABASE_URL to detect PostgreSQL vs SQLite
 * 2. Updates prisma/schema.prisma datasource provider accordingly
 * 3. Runs prisma generate, prisma db push, and seeds initial data if needed
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.RENDER === 'true';

console.log('--------------------------------------------------');
console.log('🚀 Preparing Colladome for deployment...');
console.log(`Detected DB Mode: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
console.log('--------------------------------------------------');

if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Updated prisma/schema.prisma provider to "postgresql"');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Updated prisma/schema.prisma provider to "sqlite"');
}

console.log('📦 Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('🔄 Syncing Database Schema (db push)...');
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

console.log('🌱 Seeding initial platform data (Admins, APIs, Providers)...');
try {
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
} catch (e) {
  console.log('ℹ️ Seed notice:', e.message || 'Seed already applied or skipped.');
}

console.log('✨ Database preparation complete!');
