import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';
import { Keyof } from '../../shared/types';

type ChangeType = 'addition' | 'update' | 'deletion';

type ChangedField<T> = {
  fieldName: Keyof<T>;
  fieldNewValue?: T[Keyof<T>];
  fieldOldValue?: T[Keyof<T>];
  changeType: ChangeType;
};

type FirestoreChanges<T> = {
  changedFields: FirestoreChangedFields<T>;
  documentId: string;
  eventId: string;
  madeAt: Date;
  type: ChangeType;
};

type FirestoreChangedFields<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? Array<Record<Keyof<U>, ChangedField<U> | undefined>>
      : ChangedField<T[K]>
    : T[K] extends Record<string, any>
    ? FirestoreChangedFields<T[K]>
    : ChangedField<T[K]>;
};

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
  ): FirestoreChangedFields<T> {
    const changedFields = {} as FirestoreChangedFields<T>;
    const allFields = new Set([
      ...(before ? Object.keys(before) : []),
      ...(after ? Object.keys(after) : []),
    ]);

    allFields.forEach((fieldName) => {
      const beforeValue = before?.[fieldName];
      const afterValue = after?.[fieldName];

      if (Array.isArray(beforeValue) || Array.isArray(afterValue)) {
        // Handle array of objects comparison
        const arrayChanges = this.getArrayChanges(
          beforeValue as any[],
          afterValue as any[],
        );
        if (arrayChanges.length > 0) {
          changedFields[fieldName as Keyof<T>] = arrayChanges as any;
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
        changedFields[fieldName as Keyof<T>] = nestedChanges as any;
      } else if (beforeValue !== afterValue) {
        // Handle primitive comparison
        changedFields[fieldName as Keyof<T>] = {
          fieldName,
          fieldNewValue: afterValue,
          fieldOldValue: beforeValue,
          changeType: !beforeValue
            ? 'addition'
            : !afterValue
            ? 'deletion'
            : 'update',
        } as any;
      }
    });

    return changedFields;
  }

  private static getArrayChanges<T extends Record<string, any>>(
    before: T[] = [],
    after: T[] = [],
  ): Array<Record<Keyof<T>, ChangedField<T> | undefined>> {
    const changes: Array<Record<Keyof<T>, ChangedField<T> | undefined>> = [];

    const maxLength = Math.max(before.length, after.length);

    for (let i = 0; i < maxLength; i++) {
      const beforeItem = before[i];
      const afterItem = after[i];

      if (beforeItem && afterItem) {
        // Compare fields in the array item
        const itemChanges = this.collectChangedFields(beforeItem, afterItem);
        changes.push(
          itemChanges as Record<Keyof<T>, ChangedField<T> | undefined>,
        );
      } else if (!beforeItem && afterItem) {
        // Entire item added
        const addedItemChanges = {} as Record<Keyof<T>, ChangedField<T>>;
        Object.keys(afterItem).forEach((key) => {
          addedItemChanges[key as Keyof<T>] = {
            fieldName: key as Keyof<T>,
            fieldNewValue: afterItem[key],
            fieldOldValue: undefined,
            changeType: 'addition',
          };
        });
        changes.push(addedItemChanges);
      } else if (beforeItem && !afterItem) {
        // Entire item removed
        const removedItemChanges = {} as Record<Keyof<T>, ChangedField<T>>;
        Object.keys(beforeItem).forEach((key) => {
          removedItemChanges[key as Keyof<T>] = {
            fieldName: key as Keyof<T>,
            fieldNewValue: undefined,
            fieldOldValue: beforeItem[key],
            changeType: 'deletion',
          };
        });
        changes.push(removedItemChanges);
      }
    }

    return changes;
  }
}
