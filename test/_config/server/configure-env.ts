import dotenv from 'dotenv';

dotenv.config({ path: '.env.test', multiline: true });

export function configureEnv(
  mongoUrl: string,
  eventStoreEndpoint: string,
): void {
  process.env = {
    ...process.env,
    APP_MONGO_URL: mongoUrl,
    APP_EVENT_STORE_ENDPOINT: eventStoreEndpoint,
  };
}
