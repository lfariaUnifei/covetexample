import { initializeApp } from 'firebase-admin/app';
import { firestoreTriggerVetCaseChanged } from './features/vet-cases/functions';

initializeApp();

export { firestoreTriggerVetCaseChanged };
