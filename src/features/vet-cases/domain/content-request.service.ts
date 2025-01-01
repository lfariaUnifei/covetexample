import { ContentRequest } from './entities/content-request';

export interface ContentRequestProcessor {
  process(): Promise<ContentRequest>;
}

export interface ContentRequestProcessorFactory {
  create(request: ContentRequest): Promise<ContentRequestProcessor>;
}
