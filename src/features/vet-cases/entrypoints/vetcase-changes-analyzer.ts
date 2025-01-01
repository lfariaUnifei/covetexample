import { FirestoreChanges, FirestoreChangeType } from '../../../infrastructure';
import { VetCaseData } from '../domain/entities/vet-case';

export class VetCaseChangesAnalyzer {
  constructor(private readonly changes: FirestoreChanges<VetCaseData>) {}
  getChanges(): VetcaseCollectionChanges[] {
    const changes: Array<VetcaseCollectionChanges | undefined> = [
      this.collectInputSourceAdded(),
      this.collectContentRequestUpdated(),
    ];
    return changes.filter((change): change is VetcaseCollectionChanges =>
      Boolean(change),
    );
  }

  private collectInputSourceAdded(): InputSourceAdded | undefined {
    const inputChanges = this.changes.changedFields.inputs;
    if (inputChanges.changeType !== 'addition') {
      return undefined;
    }
    const addedInputs = inputChanges.elements.filter(
      (item) => item.changeType === 'addition',
    );
    if (addedInputs.length === 0) {
      return undefined;
    }
    return {
      name: 'InputSourceAdded',
      caseId: this.changes.documentId,
      inputsIds: addedInputs.map(
        (input) => input.changedFields.id.fieldNewValue,
      ),
    };
  }

  private collectContentRequestUpdated(): ContentRequestUpdated | undefined {
    const contentChanges = this.changes.changedFields.contents;
    const ignoreChanges: FirestoreChangeType[] = ['deletion', 'unchanged'];
    if (ignoreChanges.includes(contentChanges.changeType)) {
      return undefined;
    }
    const updatedContents = contentChanges.elements.filter(
      (item) => !ignoreChanges.includes(item.changeType),
    );
    const updatedRequests = updatedContents
      .map((content) => {
        const requests = content.changedFields.requests.elements.filter(
          (item) => !ignoreChanges.includes(item.changeType),
        );
        return requests.map((item) => ({
          caseId: this.changes.documentId,
          contentId: content.changedFields.contentId.fieldNewValue,
          requestId: item.changedFields.requestId.fieldNewValue,
        }));
      })
      .flat();
    if (updatedRequests.length === 0) {
      return undefined;
    }
    return {
      name: 'ContentRequestUpdated',
      requests: updatedRequests,
    };
  }
}

type InputSourceAdded = {
  name: 'InputSourceAdded';
  caseId: string;
  inputsIds: string[];
};
type ContentRequestUpdated = {
  name: 'ContentRequestUpdated';
  requests: {
    caseId: string;
    contentId: string;
    requestId: string;
  }[];
};
export type VetcaseCollectionChanges = InputSourceAdded | ContentRequestUpdated;
