import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from './config/env';
import { createApp } from './app';
import { prisma } from './lib/prisma';

async function bootstrap() {
  const config = getConfig();
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(
      `[Ruchiloka API] Running on ${config.backendUrl} (env=${config.nodeEnv}, timezone=Asia/Kolkata)`
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`[Ruchiloka API] Received ${signal}. Shutting down cleanly...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Ruchiloka API] Fatal startup error:', err);
  process.exit(1);
});
