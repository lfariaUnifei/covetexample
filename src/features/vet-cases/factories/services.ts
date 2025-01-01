import {
  ContentRequestProcessor,
  ContentRequestProcessorFactory,
} from '../domain/content-request.service';
import { ContentRequest } from '../domain/entities/content-request';
import {
  InputSourceProcessor,
  InputSourceStorage,
  InputSourceTranscriber,
} from '../domain/input-source.service';
import { SoapContentRequestLocalProcessor } from '../infrastructure/content-request-processor/soap-content-request.local.processor';
import { InputSourceCloudStorage } from '../infrastructure/input-source.cloud.storage';
import { InputSourceLocalProcessor } from '../infrastructure/input-source.local.processor';
import { InputSourceLocalTranscriber } from '../infrastructure/input-source.local.transcriber';

export class InputSourceProcessorFactory {
  static default(): InputSourceProcessor {
    return new InputSourceLocalProcessor();
  }
}

export class InputSourceTranscriberFactory {
  static default(): InputSourceTranscriber {
    return new InputSourceLocalTranscriber();
  }
}

export class InputSourceStorageFactory {
  static default(): InputSourceStorage {
    return new InputSourceCloudStorage();
  }
}

export class ContentRequestProcessorFactoryAdapter
  implements ContentRequestProcessorFactory
{
  async create(request: ContentRequest): Promise<ContentRequestProcessor> {
    switch (request.templateName) {
      case 'SOAP':
        return new SoapContentRequestLocalProcessor(request);
      case 'Email':
      default:
        throw new Error('Not implemented');
    }
  }
}
