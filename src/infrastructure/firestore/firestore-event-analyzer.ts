import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';
import { Keyof } from '../../shared/types';

export type ChangeType = 'addition' | 'update' | 'deletion';

export class FirestoreEventAnalyzer {
  static getChanges<T extends Record<string, any>>(
    documentId: string,
    event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
  ): FirestoreChanges<T> {
    const before = event.data?.before.data() as T | undefined;
    const after = event.data?.after.data() as T | undefined;

    return {
      changedFields: this.collectChangedFields(before, after),
      documentId,
      eventId: event.id,
      madeAt: new Date(event.time),
      type: !before ? 'addition' : !after ? 'deletion' : 'update',
    };
  }
  private static collectChangedFields<T extends Record<string, any>>(
    before?: T,
    after?: T,
  ): ChangedField<T>[] {
    const changedFields: ChangedField<T>[] = [];
    const allFields = new Set([
      ...(before ? Object.keys(before) : []),
      ...(after ? Object.keys(after) : []),
    ]);

    allFields.forEach((fieldName) => {
      const beforeValue = before?.[fieldName];
      const afterValue = after?.[fieldName];

      if (Array.isArray(beforeValue) || Array.isArray(afterValue)) {
        // Handle array comparison
        const arrayChanges = this.getArrayChanges(
          beforeValue as unknown[],
          afterValue as unknown[],
        );
        if (arrayChanges.length > 0) {
          changedFields.push({
            fieldName,
            fieldNewValue: afterValue,
            fieldOldValue: beforeValue,
            changeType: 'update', // Arrays are always "updated" when items change
          });
        }
      } else if (
        typeof beforeValue === 'object' &&
        typeof afterValue === 'object' &&
        beforeValue &&
        afterValue
      ) {
        // Handle nested object comparison
        const nestedChanges = this.collectChangedFields(
          beforeValue,
          afterValue,
        );
        nestedChanges.forEach((nestedChange) => {
          changedFields.push({
            ...nestedChange,
            fieldName: `${fieldName}.${String(
              nestedChange.fieldName,
            )}` as Keyof<T>,
          });
        });
      } else if (beforeValue !== afterValue) {
        // Handle primitive comparison
        changedFields.push({
          fieldName,
          fieldNewValue: afterValue,
          fieldOldValue: beforeValue,
          changeType: !beforeValue
            ? 'addition'
            : !afterValue
            ? 'deletion'
            : 'update',
        });
      }
    });

    return changedFields;
  }

  private static getArrayChanges(
    before?: unknown[],
    after?: unknown[],
  ): Array<{ changeType: ChangeType; value: unknown }> {
    const changes: Array<{ changeType: ChangeType; value: unknown }> = [];
    const beforeSet = new Set(before || []);
    const afterSet = new Set(after || []);

    // Detect additions
    afterSet.forEach((item) => {
      if (!beforeSet.has(item)) {
        changes.push({ changeType: 'addition', value: item });
      }
    });

    // Detect deletions
    beforeSet.forEach((item) => {
      if (!afterSet.has(item)) {
        changes.push({ changeType: 'deletion', value: item });
      }
    });

    // No direct way to detect updates unless you have a unique identifier in array items
    return changes;
  }
}

export type ChangedField<T> = {
  fieldName: Keyof<T>;
  fieldNewValue?: T[Keyof<T>];
  fieldOldValue?: T[Keyof<T>];
  changeType: ChangeType;
};

export type FirestoreChanges<T> = {
  changedFields: ChangedField<T>[];
  documentId: string;
  eventId: string;
  madeAt: Date;
  type: ChangeType;
};
