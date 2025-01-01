import { getStorage } from 'firebase-admin/storage';
import {
  ContentLocation,
  ContentLocationService,
  StoredContentLocation,
  TransientContentLocation,
} from '../domain';

export class GCloudContentLocationService implements ContentLocationService {
  async getBuffer(content: ContentLocation): Promise<Buffer> {
    if (content.status === 'transient') {
      return content.value;
    }
    const storage = getStorage();
    const file = storage.bucket().file(content.path);
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File does not exist');
    }
    const [buffer] = await file.download();
    return buffer;
  }

  async store(
    content: TransientContentLocation,
  ): Promise<StoredContentLocation> {
    const storage = getStorage();
    const file = storage.bucket().file(content.contentId);
    await file.delete({ ignoreNotFound: true });
    await file.save(content.value, { contentType: content.contentType });
    return {
      ...content,
      status: 'stored',
      cloudProvider: 'gcloud',
      path: content.contentId,
    };
  }
}
