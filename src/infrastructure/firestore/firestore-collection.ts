import { CollectionReference } from 'firebase-admin/firestore';

export type FirestoreCollection<T> = {
  collectionName: string;
  getReference: () => CollectionReference<T>;
  // parser: FirestoreDocumentParser<T>;
  // parse: (data: FirebaseFirestore.DocumentData) => T;
};

export interface FirestoreDocumentParser<T> {
  parse(data: FirebaseFirestore.DocumentData): T;
}
