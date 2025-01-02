import { ContentLocationServiceFactory } from '../../../infrastructure/factories';
import { ContentRequestProcessor } from '../domain/content-request.service';
import { TranscribedInputSource } from '../domain/entities/case-input';
import {
  ContentRequest,
  ProcessedContentRequest,
} from '../domain/entities/content-request';
import { InputSourceTranscriber } from '../domain/input-source.service';
import { ChatGptApi } from '../infrastructure/chat-gpt.api';
import { SoapContentRequestGPTProcessor } from '../infrastructure/content-request-processor/soap-content-request.gpt.processor';
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
  async process(
    request: ContentRequest,
    input: TranscribedInputSource,
  ): Promise<ProcessedContentRequest> {
    switch (request.templateName) {
      case 'SOAP':
        return new SoapContentRequestGPTProcessor(
          new ChatGptApi({
            apiKey: process.env['APP_CHATGPT_API_KEY'] ?? '',
            model: 'gpt-4o',
          }),
        ).process(request, input);
      case 'Email':
      default:
        throw new Error('Not implemented');
    }
  }
}
