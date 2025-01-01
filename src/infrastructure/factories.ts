import { ContentLocationService } from '../domain';
import { GCloudContentLocationService } from './content-location.service';

export class ContentLocationServiceFactory {
  static default(): ContentLocationService {
    return new GCloudContentLocationService();
  }
}
