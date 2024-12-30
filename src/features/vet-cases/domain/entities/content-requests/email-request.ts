import { BaseContentRequest } from './content-request';

export type EmailContentRequest = BaseContentRequest<
  'Email',
  {
    body: string;
  }
>;
