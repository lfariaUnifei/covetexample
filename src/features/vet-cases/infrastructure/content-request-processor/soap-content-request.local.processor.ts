import { ContentRequestProcessor } from '../../domain/content-request.service';
import { SoapContentRequest } from '../../domain/entities/content-request';

export class SoapContentRequestLocalProcessor
  implements ContentRequestProcessor
{
  async process(request: SoapContentRequest): Promise<SoapContentRequest> {
    return {
      ...request,
      result: {
        status: 'waiting_review',
        data: {
          objective: 'SOAP objective',
          subjective: 'SOAP subjective',
          assesment: 'SOAP assesment',
          plan: 'SOAP plan',
        },
      },
    };
  }
}
