import { BaseContentRequest } from './content-request';

export type SoapContentRequest = BaseContentRequest<
  'SOAP',
  {
    objective: string;
    subjective: string;
    assesment: string;
    plan: string;
  }
>;
