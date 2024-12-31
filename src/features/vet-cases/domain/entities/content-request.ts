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

export type SoapContentRequest = BaseContentRequest<
  'SOAP',
  {
    objective: string;
    subjective: string;
    assesment: string;
    plan: string;
  }
>;

export type EmailContentRequest = BaseContentRequest<
  'Email',
  {
    body: string;
  }
>;

export type ContentRequest = SoapContentRequest | EmailContentRequest;
