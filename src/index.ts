import { onDocumentWritten } from 'firebase-functions/v2/firestore';

export const onTestChanged = onDocumentWritten(
  'testchanges/{changeId}',
  (event) => {
    console.log('Document written:', event.params.changeId);
    console.log('Document before:', event.data?.before.data());
    console.log('Document after:', event.data?.after.data());
  },
);
