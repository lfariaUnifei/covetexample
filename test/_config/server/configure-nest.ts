import { AppModule } from '@/main/serverless/app-module';
import { configureApp } from '@/main/serverless/serverless-app';
import { createApp } from '@/main/standalone/standalone-app';
import { NestEventSourcingApplication } from '@eduq/nest-event-sourcing';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { v4 } from 'uuid';

export type ServerInitializeType = 'serverless' | 'standalone' | 'both';

export async function initializeNestApp(
  type: ServerInitializeType,
): Promise<void> {
  if (type === 'serverless' || type === 'both') {
    await initializeServerless();
  }
  if (type === 'standalone' || type === 'both') {
    await initializeStandalone();
  }
}

export let serverlessApp: INestApplication | undefined;
export const MOCK_EXAM_ID = v4();

async function initializeServerless(): Promise<void> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  serverlessApp = moduleRef.createNestApplication();
  configureApp(serverlessApp);
  await serverlessApp.init();
}

export let standaloneApp: INestApplication | undefined;
export let evsApp: NestEventSourcingApplication | undefined;
async function initializeStandalone(): Promise<void> {
  evsApp = createApp();
  standaloneApp = await evsApp.initialize();
}

export async function tearDownNestApp(): Promise<void> {
  await evsApp?.stop();
  await serverlessApp?.close();
  await standaloneApp?.close();
}
