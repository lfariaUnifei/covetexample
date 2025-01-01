import { ContentRequestProcessor } from '../../domain/content-request.service';
import { SoapContentRequest } from '../../domain/entities/content-request';

export class SoapContentRequestLocalProcessor
  implements ContentRequestProcessor
{
  constructor(private readonly request: SoapContentRequest) {}
  async process(): Promise<SoapContentRequest> {
    return {
      ...this.request,
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
