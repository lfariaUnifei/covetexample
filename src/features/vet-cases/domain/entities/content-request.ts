export type RequestStatus = 'processing' | 'waiting_review';
export type ContentTemplateName = 'SOAP' | 'Email';

type BaseContentRequest<T extends ContentTemplateName = ContentTemplateName> = {
  requestId: string;
  templateName: T;
  instructions: string;
};

export type ProcessingContentRequest<
  T extends ContentTemplateName = ContentTemplateName,
> = BaseContentRequest<T> & {
  status: 'processing';
};

export type ProcessedContentRequest<
  T extends ContentTemplateName = ContentTemplateName,
  R = any,
> = BaseContentRequest<T> & {
  result: R;
  status: 'waiting_review';
};

export type ProcessedSoapContentRequest = ProcessedContentRequest<
  'SOAP',
  {
    objective: string;
    subjective: string;
    assesment: string;
    plan: string;
  }
>;

export type SoapContentRequest =
  | ProcessingContentRequest<'SOAP'>
  | ProcessedSoapContentRequest;

export type ProcessedEmailContentRequest = ProcessedContentRequest<
  'Email',
  { body: string }
>;
export type EmailContentRequest =
  | ProcessingContentRequest<'Email'>
  | ProcessedEmailContentRequest;

export type ContentRequest = SoapContentRequest | EmailContentRequest;
