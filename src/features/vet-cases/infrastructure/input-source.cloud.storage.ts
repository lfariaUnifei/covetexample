import { getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../../infrastructure';
import { CaseInputSource } from '../domain/entities/case-input';
import { StoredInputSource } from '../domain/entities/storage-input-source';
import { InputSourceStorage } from '../domain/input-source.service';

const collectionName = 'inputSource';
const collection: FirestoreCollection<CaseInputSource> = {
  collectionName,
  getReference: () => {
    const converter = {
      toFirestore(
        modelObject: WithFieldValue<CaseInputSource>,
      ): CaseInputSource {
        return modelObject as CaseInputSource;
      },
      fromFirestore(
        snapshot: FirebaseFirestore.QueryDocumentSnapshot,
      ): CaseInputSource {
        return snapshot.data() as CaseInputSource;
      },
    };
    return getFirestore().collection(collectionName).withConverter(converter);
  },
};

export class InputSourceCloudStorage implements InputSourceStorage {
  upload(toUpload: StoredInputSource): Promise<StoredInputSource> {
    throw new Error('Method not implemented.');
  }
}
