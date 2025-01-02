import {
  ContentRequest,
  ProcessedContentRequest,
} from './entities/content-request';

export interface ContentRequestProcessor {
  process(request: ContentRequest): Promise<ProcessedContentRequest>;
}
