import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { firestoreTriggerVetCaseChanged } from './features/vet-cases/functions';

dotenv.config();
console.log(process.env['APP_CHATGPT_API_KEY']);
initializeApp();

export { firestoreTriggerVetCaseChanged };
