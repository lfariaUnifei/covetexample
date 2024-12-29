import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

initializeApp();

type ChangesMade = {
  changedFields: {
    fieldName: string;
    fieldNewValue: string;
    fieldOldValue: string;
  }[];
  collectionName: string;
  documentId: string;
  madeAt: Date;
};

function extractChanges(
  before: FirebaseFirestore.DocumentData,
  after: FirebaseFirestore.DocumentData,
  collectionName: string,
  documentId: string,
): ChangesMade {
  const changedFields = Object.keys(after)
    .filter((fieldName) => before[fieldName] !== after[fieldName])
    .map((fieldName) => {
      return {
        fieldName,
        fieldNewValue: after[fieldName],
        fieldOldValue: before[fieldName],
      };
    });

  return {
    changedFields,
    collectionName,
    documentId,
    madeAt: new Date(),
  };
}

const collection = getFirestore().collection('changesmade');

export const onTestChanged = onDocumentWritten(
  'testchanges/{changeId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const collectionName = event.document.split('/').slice(-2)[0];
    if (beforeData && afterData) {
      const changes = extractChanges(
        beforeData,
        afterData,
        collectionName,
        event.params.changeId,
      );
      collection.doc(event.id).set(changes);
    }
  },
);
