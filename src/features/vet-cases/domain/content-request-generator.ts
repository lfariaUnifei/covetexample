import { CaseInputSourceRef } from './entities/case-input';
import {
  ContentRequest,
  ContentTemplateName,
} from './entities/content-request';

export interface ContentRequestProcessor {
  process(): Promise<ContentRequest>;
}

export type ContentGeneratorParams = {
  templateName: ContentTemplateName;
  input: CaseInputSourceRef;
  contentId: string;
};

export interface ContentRequestProcessorFactory {
  create(request: ContentRequest): Promise<ContentRequestProcessor>;
}

// class SoapProcessor implements ContentRequestProcessor {
//   async process(): Promise<SoapContentRequest> {
//     return {
//       templateName: 'SOAP',
//       instructions: 'SOAP instructions',
//       requestId: v4(),
//       result: {
//         status: 'waiting_review',
//         data: {
//           objective: 'SOAP objective',
//           subjective: 'SOAP subjective',
//           assesment: 'SOAP assesment',
//           plan: 'SOAP plan',
//         },
//       },
//     };
//   }
// }
