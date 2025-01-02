import { ContentLocationServiceFactory } from '../../../infrastructure/factories';
import { ContentRequestProcessor } from '../domain/content-request.service';
import {
  ContentRequest,
  ProcessedContentRequest,
} from '../domain/entities/content-request';
import { InputSourceTranscriber } from '../domain/input-source.service';
import { SoapContentRequestLocalProcessor } from '../infrastructure/content-request-processor/soap-content-request.local.processor';
import { InputSourceLocalTranscriber } from '../infrastructure/input-source.local.transcriber';

export class InputSourceTranscriberFactory {
  static default(): InputSourceTranscriber {
    return new InputSourceLocalTranscriber(
      ContentLocationServiceFactory.default(),
    );
  }
}

export class ContentRequestProcessorFactoryAdapter
  implements ContentRequestProcessor
{
  async process(request: ContentRequest): Promise<ProcessedContentRequest> {
    switch (request.templateName) {
      case 'SOAP':
        return new SoapContentRequestLocalProcessor().process(request);
      case 'Email':
      default:
        throw new Error('Not implemented');
    }
  }
}
