import { TranscribedInputSource } from './entities/case-input';
import {
  ContentRequest,
  ProcessedContentRequest,
} from './entities/content-request';

export interface ContentRequestProcessor {
  process(
    request: ContentRequest,
    input: TranscribedInputSource,
  ): Promise<ProcessedContentRequest>;
}
