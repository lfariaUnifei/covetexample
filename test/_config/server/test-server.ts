import { TEST_EVENT_STORE_PORT } from '@/test/_config/config';
import { configureEnv } from '@/test/_config/server/configure-env';
import {
  initializeNestApp,
  ServerInitializeType,
  serverlessApp,
  tearDownNestApp,
} from '@/test/_config/server/configure-nest';
import { TestHttpClient } from '@/test/_config/test-http-client';

import { configureTestEventStoreDefaultPort } from '@eduq/event-sourcing';
import { startMemoryMongo, tearDownMemoryMongo } from '@eduq/mongoose';

export let testHttpClient: TestHttpClient;

export async function initializeTestServer(
  severType: ServerInitializeType,
): Promise<void> {
  const memoryMongo = await startMemoryMongo();
  configureEnv(memoryMongo.uri, 'localhost:' + TEST_EVENT_STORE_PORT);
  await initializeNestApp(severType);
  configureTestEventStoreDefaultPort(TEST_EVENT_STORE_PORT);
  testHttpClient = new TestHttpClient(serverlessApp?.getHttpServer());
}

export async function tearDownTestServer(): Promise<void> {
  await tearDownNestApp();
  await tearDownMemoryMongo();
}
