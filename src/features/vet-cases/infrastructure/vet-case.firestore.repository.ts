import { getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import { FirestoreCollection } from '../../../infrastructure';
import { VetCase, VetCaseData } from '../domain/entities/vet-case';
import { VetCaseRepository } from '../domain/vet-case.repository';

const collectionName = 'vetCases';
export const VetCaseFirestoreCollection: FirestoreCollection<VetCaseData> = {
  collectionName,
  getReference: () => {
    const converter = {
      toFirestore(modelObject: WithFieldValue<VetCaseData>): VetCaseData {
        return modelObject as VetCaseData;
      },
      fromFirestore(
        snapshot: FirebaseFirestore.QueryDocumentSnapshot,
      ): VetCaseData {
        return snapshot.data() as VetCaseData;
      },
    };
    return getFirestore().collection(collectionName).withConverter(converter);
  },
};

export class VetCaseFirestoreRepository implements VetCaseRepository {
  async ofId(caseId: string): Promise<VetCase | undefined> {
    const document = await VetCaseFirestoreCollection.getReference()
      .doc(caseId)
      .get();
    const data = document.data();
    return data ? new VetCase(data) : undefined;
  }

  async save(vetCase: VetCase): Promise<void> {
    const data = vetCase.toData();
    await VetCaseFirestoreCollection.getReference().doc(data.caseId).set(data);
  }
}
