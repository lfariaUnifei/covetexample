import { initializeApp } from 'firebase-admin/app';
import { v4 } from 'uuid';
import { VetCaseData } from '../src/features/vet-cases/domain/entities/vet-case';
import { VetCaseFirestoreCollection } from '../src/features/vet-cases/infrastructure/vet-case.firestore.repository';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

async function main(): Promise<void> {
  initializeApp({ projectId: 'covetexample' });
  const caseId = '01ef4364-479b-45b5-859b-826d1059cfb1';
  const ownerId = '19bbca30-e42c-43c2-8e97-4e499ebc5144';
  const inputId = 'aeb7852f-7f57-4176-87e7-d8df7ea490cb';
  const caseData: VetCaseData = {
    caseId,
    ownerId,
    contents: [],
    inputs: [
      {
        id: inputId,
        name: 'text',
        status: 'transcribing',
        content: {
          status: 'transient',
          contentId: 'ec7360d4-0c6a-49ad-95e0-016cb0c0ab75',
          contentType: 'plain/text',
          value: Buffer.from('Oi amigo'),
        },
      },
    ],
    name: 'Test',
  };
  const promise = new Promise((resolve) => {
    VetCaseFirestoreCollection.getReference().onSnapshot(async (snapshot) => {
      const doc = snapshot.docs.find((item) => item.id === caseId);
      if (!doc) {
        return;
      }
      const { inputs, contents } = doc.data();
      const input = inputs.find((item) => item.id === inputId);
      if (!input) {
        return;
      }
      if (contents.length > 0) {
        return;
      }
      await VetCaseFirestoreCollection.getReference()
        .doc(caseId)
        .set({
          ...caseData,
          contents: [
            {
              contentId: v4(),
              customName: 'Test',
              requests: [
                {
                  inputId: inputId,
                  instructions: '',
                  requestId: v4(),
                  status: 'processing',
                  templateName: 'SOAP',
                },
              ],
            },
          ],
        });
      resolve(undefined);
    });
  });
  const result = VetCaseFirestoreCollection.getReference()
    .doc(caseId)
    .set(caseData);
  await Promise.all([promise, result]);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
