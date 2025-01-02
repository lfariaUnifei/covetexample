import { ContentRequest } from './entities/content-request';

export interface ContentRequestProcessor {
  process(request: ContentRequest): Promise<ContentRequest>;
}
