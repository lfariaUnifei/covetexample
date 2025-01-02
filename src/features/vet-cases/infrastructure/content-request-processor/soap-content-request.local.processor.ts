import { ContentRequestProcessor } from '../../domain/content-request.service';
import {
  ProcessedSoapContentRequest,
  SoapContentRequest,
} from '../../domain/entities/content-request';

export class SoapContentRequestLocalProcessor
  implements ContentRequestProcessor
{
  async process(
    request: SoapContentRequest,
  ): Promise<ProcessedSoapContentRequest> {
    return {
      ...request,
      status: 'waiting_review',
      result: {
        objective: 'SOAP objective',
        subjective: 'SOAP subjective',
        assesment: 'SOAP assesment',
        plan: 'SOAP plan',
      },
    };
  }
}
