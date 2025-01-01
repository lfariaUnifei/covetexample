import { onDocumentWritten } from 'firebase-functions/firestore';
import { FirestoreEventAnalyzer } from '../../../infrastructure';
import { VetCaseData } from '../domain/entities/vet-case';
import {
  ProcessContentRequestUsecaseFactory,
  ProcessInputSourceUsecaseFactory,
} from '../factories/usecases';
import { VetCaseFirestoreCollection } from '../infrastructure/vet-case.firestore.repository';
import { VetCaseChangesAnalyzer } from './vetcase-changes-analyzer';

export const firestoreTriggerVetCaseChanged = onDocumentWritten(
  `${VetCaseFirestoreCollection.collectionName}/{vetCaseId}`,
  async (event) => {
    const changeAnalyzer = new VetCaseChangesAnalyzer(
      FirestoreEventAnalyzer.getChanges<VetCaseData>(
        event.params.vetCaseId,
        event,
      ),
    );
    const changes = changeAnalyzer.getChanges();
    for (const change of changes) {
      switch (change.name) {
        case 'InputSourceAdded': {
          const usecase = ProcessInputSourceUsecaseFactory.default();
          await Promise.all(
            change.inputsIds.map(async (inputSourceId) =>
              usecase.execute({
                caseId: change.caseId,
                inputSourceId,
              }),
            ),
          );
          break;
        }
        case 'ContentRequestUpdated': {
          const usecase = ProcessContentRequestUsecaseFactory.default();
          await Promise.all(
            change.requests.map(async (request) =>
              usecase.execute({
                caseId: request.caseId,
                contentId: request.contentId,
                requestId: request.requestId,
              }),
            ),
          );
          break;
        }
        default:
          break;
      }
    }
  },
);
