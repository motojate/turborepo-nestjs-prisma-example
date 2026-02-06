import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  app.enableShutdownHooks();

  setInterval(() => {
    console.log(1);
  }, 1000);
  logger.log('🚀 Data Collector Client Started');
}
bootstrap().catch((err) => {
  logger.error(
    'Bootstrap failed',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
