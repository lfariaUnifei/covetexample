import { ContentLocation } from './content-location';

export interface ContentLocationService {
  getBuffer(content: ContentLocation): Promise<Buffer>;
  store(content: ContentLocation): Promise<ContentLocation>;
}
