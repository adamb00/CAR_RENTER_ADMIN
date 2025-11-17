#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function syncPrismaClient() {
  let clientDir;
  try {
    clientDir = path.dirname(require.resolve('@prisma/client/package.json'));
  } catch (error) {
    console.error('[prisma-sync] Unable to resolve @prisma/client. Did you install dependencies?');
    process.exit(1);
  }

  const sourceDir = path.resolve(clientDir, '../../.prisma');
  if (!fs.existsSync(sourceDir)) {
    console.warn(`[prisma-sync] No generated Prisma client found at ${sourceDir}. Run "pnpm prisma generate" first.`);
    return;
  }

  const targetDirs = [
    path.resolve(process.cwd(), 'node_modules/.prisma'),
    path.resolve(process.cwd(), 'node_modules/@prisma/client/.prisma'),
  ];

  for (const targetDir of targetDirs) {
    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(targetDir), { recursive: true });
      fs.cpSync(sourceDir, targetDir, { recursive: true });
      console.log(`[prisma-sync] Synced Prisma client to ${targetDir}`);
    } catch (error) {
      console.error('[prisma-sync] Failed to sync Prisma client', error);
      process.exit(1);
    }
  }
}

syncPrismaClient();
