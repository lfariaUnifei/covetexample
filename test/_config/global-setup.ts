// import { startTestMessageStore } from '@eduq/event-sourcing';
import { configureEnv } from '../_config/server/configure-env';
import { TEST_EVENT_STORE_PORT } from './config';

export default async (): Promise<void> => {
  console.log('Starting message store');
  // await startTestMessageStore(TEST_EVENT_STORE_PORT);
  configureEnv('url', 'localhost:' + TEST_EVENT_STORE_PORT);
  console.log('Started');
};
