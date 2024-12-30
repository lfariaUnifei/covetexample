import { EmailContentRequest } from './email-request';
import { SoapContentRequest } from './soap-request';

export type RequestStatus = 'processing' | 'waiting_review';
export type ContentTemplateName = 'SOAP' | 'Email';
export type BaseContentRequest<
  T extends ContentTemplateName = ContentTemplateName,
  R = any,
> = {
  requestId: string;
  templateName: T;
  instructions: string;
  result:
    | {
        status: 'processing';
      }
    | {
        status: 'waiting_review';
        data: R;
      };
};

export type ContentRequest = SoapContentRequest | EmailContentRequest;
