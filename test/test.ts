import { initializeApp } from 'firebase-admin/app';
import { VetCaseData } from '../src/features/vet-cases/domain/entities/vet-case';
import { VetCaseFirestoreCollection } from '../src/features/vet-cases/infrastructure/vet-case.firestore.repository';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

async function main(): Promise<void> {
  initializeApp({ projectId: 'covetexample' });
  const caseId = '01ef4364-479b-45b5-859b-826d1059cfb1';
  const ownerId = '19bbca30-e42c-43c2-8e97-4e499ebc5144';
  const caseData: VetCaseData = {
    caseId,
    ownerId,
    contents: [],
    inputs: [
      {
        id: 'aeb7852f-7f57-4176-87e7-d8df7ea490cb',
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

  const result = await VetCaseFirestoreCollection.getReference()
    .doc(caseId)
    .set(caseData);
  console.log(result);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
