import { tearDownTestMessageStore } from '@eduq/event-sourcing';

export default async (): Promise<void> => {
  await tearDownTestMessageStore();
};
