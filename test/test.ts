import { credential } from 'firebase-admin';
import { initializeApp, ServiceAccount } from 'firebase-admin/app';
import credentials from '../firebase-service-account.json';
import { VetCaseFirestoreCollection } from '../src/features/vet-cases/infrastructure/vet-case.firestore.repository';

async function main(): Promise<void> {
  initializeApp({
    credential: credential.cert(credentials as ServiceAccount),
  });
  const caseId = '01ef4364-479b-45b5-859b-826d1059cfb1';
  const ownerId = '19bbca30-e42c-43c2-8e97-4e499ebc5144';
  const result = await VetCaseFirestoreCollection.getReference()
    .doc(caseId)
    .set(
      {
        inputs: [
          {
            id: 'abce',
            name: 'audio',
            status: 'transcribing',
          },
        ],
      },
      { merge: true },
    );
  console.log(JSON.stringify(result, undefined, 2));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
