/**
 * Prepare Render Build script
 * 1. Checks DATABASE_URL to detect PostgreSQL vs SQLite
 * 2. Updates prisma/schema.prisma datasource provider accordingly
 * 3. Safely handles missing DATABASE_URL during initial build
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const rawDbUrl = process.env.DATABASE_URL || '';
const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://') || process.env.RENDER === 'true';

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
}

// If DATABASE_URL is not provided, supply a placeholder so `prisma generate` doesn't fail
if (!process.env.DATABASE_URL) {
  console.log('⚠️ DATABASE_URL is not yet set in environment. Using fallback for client generation.');
  process.env.DATABASE_URL = isPostgres 
    ? 'postgresql://postgres:postgres@localhost:5432/colladome?schema=public'
    : 'file:./dev.db';
}

console.log('📦 Generating Prisma Client...');
execSync('npx prisma generate', { 
  stdio: 'inherit',
  env: process.env 
});

// Only attempt DB push and seed if an actual DATABASE_URL was supplied
if (rawDbUrl && rawDbUrl.trim().length > 0) {
  console.log('🔄 Syncing Database Schema (db push)...');
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
  } catch (err) {
    console.warn('⚠️ Notice during DB push/seed:', err.message || err);
    console.log('ℹ️ Build will continue. Database can also be initialized at runtime.');
  }
} else {
  console.log('--------------------------------------------------');
  console.log('⚠️  DATABASE_URL environment variable is missing on Render!');
  console.log('👉 To connect your database:');
  console.log('   1. Go to Render Dashboard -> Your Web Service -> Environment');
  console.log('   2. Add Key: DATABASE_URL');
  console.log('   3. Add Value: <Your Internal Database URL from Render PostgreSQL>');
  console.log('ℹ️  Skipping DB push during this build. Next.js will now compile.');
  console.log('--------------------------------------------------');
}

console.log('✨ Build preparation complete! Proceeding to next build...');
