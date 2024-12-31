import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';

type ChangeType = 'addition' | 'update' | 'deletion';

type Keyof<T> = T extends Array<any> ? string : keyof T;

type ChangedField<T> = {
  fieldName: Keyof<T>;
  fieldNewValue?: T;
  fieldOldValue?: T;
  changeType: ChangeType;
};

type ObjectChanges<T> = {
  changeType: ChangeType;
  changedFields?: FirestoreChangedFields<T>;
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
      ? Array<ObjectChanges<U>>
      : ChangedField<T[K]> // If array of primitives, T[K] is the entire array
    : T[K] extends Record<string, any>
    ? ObjectChanges<T[K]>
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
        if (
          beforeValue?.every((item: unknown) => typeof item !== 'object') &&
          afterValue?.every((item: unknown) => typeof item !== 'object')
        ) {
          // Handle array of primitives comparison
          if (beforeValue?.toString() !== afterValue?.toString()) {
            changedFields[fieldName as Keyof<T>] = {
              fieldName: fieldName as Keyof<T>,
              fieldNewValue: afterValue,
              fieldOldValue: beforeValue,
              changeType: !beforeValue
                ? 'addition'
                : !afterValue
                ? 'deletion'
                : 'update',
            } as any;
          }
        } else {
          // Handle array of objects comparison
          const arrayChanges = this.getArrayChanges(
            beforeValue as any[],
            afterValue as any[],
          );
          if (arrayChanges.length > 0) {
            changedFields[fieldName as Keyof<T>] = arrayChanges as any;
          }
        }
      } else if (
        typeof beforeValue === 'object' &&
        typeof afterValue === 'object' &&
        beforeValue &&
        afterValue
      ) {
        // Handle nested object comparison
        const nestedChanges = this.getObjectChanges(beforeValue, afterValue);
        changedFields[fieldName as Keyof<T>] = nestedChanges as any;
      } else if (beforeValue !== afterValue) {
        // Handle primitive comparison
        changedFields[fieldName as Keyof<T>] = {
          fieldName: fieldName as Keyof<T>,
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
  ): Array<ObjectChanges<T>> {
    const changes: Array<ObjectChanges<T>> = [];

    const maxLength = Math.max(before.length, after.length);

    for (let i = 0; i < maxLength; i++) {
      const beforeItem = before[i];
      const afterItem = after[i];

      if (beforeItem && afterItem) {
        // Compare fields in the array item
        const itemChanges = this.collectChangedFields(beforeItem, afterItem);
        changes.push({
          changeType: 'update',
          changedFields: itemChanges,
        });
      } else if (!beforeItem && afterItem) {
        // Entire item added
        changes.push({
          changeType: 'addition',
          changedFields: this.collectChangedFields(undefined, afterItem),
        });
      } else if (beforeItem && !afterItem) {
        // Entire item removed
        changes.push({
          changeType: 'deletion',
          changedFields: this.collectChangedFields(beforeItem, undefined),
        });
      }
    }

    return changes;
  }

  private static getObjectChanges<T extends Record<string, any>>(
    before?: T,
    after?: T,
  ): ObjectChanges<T> {
    const changedFields = this.collectChangedFields(before, after);
    let changeType: ChangeType = 'update';

    if (!before) {
      changeType = 'addition';
    } else if (!after) {
      changeType = 'deletion';
    }

    return {
      changeType,
      changedFields,
    };
  }
}
