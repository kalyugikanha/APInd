/**
 * Prepare Render Build script
 * 1. Checks DATABASE_URL to detect PostgreSQL vs SQLite
 * 2. Updates prisma/schema.prisma datasource provider accordingly
 * 3. Safely initializes either PostgreSQL or SQLite with push & seed
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const rawDbUrl = process.env.DATABASE_URL || '';
const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');

console.log('--------------------------------------------------');
console.log('🚀 Preparing Colladome for deployment...');
console.log(`Detected Environment: ${process.env.RENDER === 'true' ? 'Render Cloud' : 'Local/Self-hosted'}`);
console.log(`Target Database Provider: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
console.log('--------------------------------------------------');

if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Updated prisma/schema.prisma provider to "postgresql"');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Updated prisma/schema.prisma provider to "sqlite"');
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

console.log('📦 Generating Prisma Client...');
execSync('npx prisma generate', { 
  stdio: 'inherit',
  env: process.env 
});

if (isPostgres && rawDbUrl.trim().length > 0) {
  console.log('🔄 Syncing PostgreSQL Database Schema (db push)...');
  try {
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: process.env 
    });
    
    console.log('🌱 Seeding initial platform data (Admins, APIs, Providers)...');
    execSync('npx tsx prisma/seed.ts', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('✅ PostgreSQL database ready.');
  } catch (err) {
    console.warn('⚠️ Notice during DB push/seed:', err.message || err);
    console.log('ℹ️ Build will continue. Database can also be initialized at runtime.');
  }
} else {
  console.log('🔄 Syncing SQLite Database Schema (db push)...');
  try {
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('🌱 Seeding SQLite database...');
    execSync('npx tsx prisma/seed.ts', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('✅ SQLite database initialized and seeded.');
  } catch (err) {
    console.warn('⚠️ Notice during SQLite push/seed:', err.message || err);
  }
}

console.log('✨ Build preparation complete! Proceeding to next build...');
