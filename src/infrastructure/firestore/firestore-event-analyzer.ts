import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';

type ChangeType = 'addition' | 'update' | 'deletion' | 'unchanged';

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
  type: ChangeType; // High-level change for the document as a whole
};

type FirestoreChangedFields<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U extends Record<string, any>
      ? // Array of objects
        Array<ObjectChanges<U>> | ChangedField<T[K]> // If array of objects is entirely unchanged
      : // Array of primitives
        ChangedField<T[K]>
    : T[K] extends Record<string, any>
    ? // Nested object
      ObjectChanges<T[K]>
    : // Primitive or any other type
      ChangedField<T[K]>;
};

export class FirestoreEventAnalyzer {
  static getChanges<T extends Record<string, any>>(
    documentId: string,
    event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
  ): FirestoreChanges<T> {
    const before = event.data?.before?.data() as T | undefined;
    const after = event.data?.after?.data() as T | undefined;

    let docChangeType: ChangeType = 'update';
    if (!before && after) docChangeType = 'addition';
    else if (before && !after) docChangeType = 'deletion';
    else if (before && after) docChangeType = 'update';
    else if (!before && !after) docChangeType = 'unchanged'; // This is a weird edge case but let's handle it.

    return {
      changedFields: this.collectChangedFields(before, after),
      documentId,
      eventId: event.id,
      madeAt: new Date(event.time),
      type: docChangeType,
    };
  }

  private static collectChangedFields<T extends Record<string, any>>(
    before?: T,
    after?: T,
  ): FirestoreChangedFields<T> {
    const changedFields = {} as FirestoreChangedFields<T>;

    // If both undefined, there's no data, so no fields
    if (!before && !after) {
      return changedFields;
    }

    const allFields = new Set([
      ...(before ? Object.keys(before) : []),
      ...(after ? Object.keys(after) : []),
    ]);

    allFields.forEach((fieldName) => {
      const beforeValue = before?.[fieldName];
      const afterValue = after?.[fieldName];

      // Decide the top-level change type for this field
      let fieldChangeType: ChangeType = 'unchanged'; // assume unchanged by default

      if (beforeValue === undefined && afterValue !== undefined) {
        fieldChangeType = 'addition';
      } else if (beforeValue !== undefined && afterValue === undefined) {
        fieldChangeType = 'deletion';
      } else if (
        beforeValue !== undefined &&
        afterValue !== undefined &&
        !this.deepEqual(beforeValue, afterValue)
      ) {
        // We'll refine it further below for arrays/objects
        fieldChangeType = 'update';
      }

      // 1) Array of primitives or objects
      if (Array.isArray(beforeValue) || Array.isArray(afterValue)) {
        // If either is not an array, or if one array is missing => it's an update, addition, or deletion
        if (!Array.isArray(beforeValue) || !Array.isArray(afterValue)) {
          changedFields[fieldName as Keyof<T>] = {
            fieldName: fieldName as Keyof<T>,
            fieldOldValue: beforeValue,
            fieldNewValue: afterValue,
            changeType: fieldChangeType,
          } as any;
        } else {
          // Both are arrays
          // Check if array is of primitives
          if (
            this.isArrayOfPrimitives(beforeValue) &&
            this.isArrayOfPrimitives(afterValue)
          ) {
            // If they're the same => unchanged
            if (this.deepEqual(beforeValue, afterValue)) {
              changedFields[fieldName as Keyof<T>] = {
                fieldName: fieldName as Keyof<T>,
                fieldOldValue: beforeValue,
                fieldNewValue: afterValue,
                changeType: 'unchanged',
              } as any;
            } else {
              // There's a difference => update
              changedFields[fieldName as Keyof<T>] = {
                fieldName: fieldName as Keyof<T>,
                fieldOldValue: beforeValue,
                fieldNewValue: afterValue,
                changeType: fieldChangeType,
              } as any;
            }
          } else {
            // Array of objects
            const arrayChanges = this.getArrayChanges(
              beforeValue as any[],
              afterValue as any[],
            );

            // If all items are unchanged & arrays are the same length => the entire array is unchanged
            if (
              arrayChanges.every((c) => c.changeType === 'unchanged') &&
              beforeValue.length === afterValue.length
            ) {
              // store a single "unchanged" node for the field
              changedFields[fieldName as Keyof<T>] = {
                fieldName: fieldName as Keyof<T>,
                fieldOldValue: beforeValue,
                fieldNewValue: afterValue,
                changeType: 'unchanged',
              } as any;
            } else {
              // otherwise, store the array of object-changes
              changedFields[fieldName as Keyof<T>] = arrayChanges as any;
            }
          }
        }
      }
      // 2) Nested object
      else if (
        this.isObject(beforeValue) &&
        this.isObject(afterValue) &&
        beforeValue &&
        afterValue
      ) {
        // Get nested object changes
        const nestedChanges = this.getObjectChanges(beforeValue, afterValue);

        // If all fields inside the object are unchanged => entire object is unchanged
        if (
          nestedChanges.changeType === 'update' &&
          nestedChanges.changedFields &&
          Object.keys(nestedChanges.changedFields).every((f) => {
            const field = (nestedChanges.changedFields as any)[f];
            return field.changeType === 'unchanged';
          })
        ) {
          nestedChanges.changeType = 'unchanged';
        }

        changedFields[fieldName as Keyof<T>] = nestedChanges as any;
      }
      // 3) Primitives
      else {
        // Store field
        changedFields[fieldName as Keyof<T>] = {
          fieldName: fieldName as Keyof<T>,
          fieldOldValue: beforeValue,
          fieldNewValue: afterValue,
          changeType: fieldChangeType,
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

      if (beforeItem === undefined && afterItem !== undefined) {
        // Entire item added
        changes.push({
          changeType: 'addition',
          changedFields: this.collectChangedFields(undefined, afterItem),
        });
      } else if (beforeItem !== undefined && afterItem === undefined) {
        // Entire item removed
        changes.push({
          changeType: 'deletion',
          changedFields: this.collectChangedFields(beforeItem, undefined),
        });
      } else if (beforeItem !== undefined && afterItem !== undefined) {
        // Compare fields in the array item
        const itemChanges = this.collectChangedFields(beforeItem, afterItem);

        // If every field in itemChanges is unchanged => item is unchanged
        if (
          Object.keys(itemChanges).every((k) => {
            const field = (itemChanges as any)[k];
            return field.changeType === 'unchanged';
          })
        ) {
          changes.push({
            changeType: 'unchanged',
            changedFields: itemChanges,
          });
        } else {
          changes.push({
            changeType: 'update',
            changedFields: itemChanges,
          });
        }
      }
    }

    return changes;
  }

  private static getObjectChanges<T extends Record<string, any>>(
    before?: T,
    after?: T,
  ): ObjectChanges<T> {
    if (!before && !after) {
      return {
        changeType: 'unchanged',
      };
    }
    if (!before && after) {
      return {
        changeType: 'addition',
        changedFields: this.collectChangedFields(before, after),
      };
    }
    if (before && !after) {
      return {
        changeType: 'deletion',
        changedFields: this.collectChangedFields(before, after),
      };
    }

    // Both exist
    const changedFields = this.collectChangedFields(before, after);
    // If everything is unchanged, let's mark it as unchanged
    const allUnchanged =
      Object.keys(changedFields).length > 0 &&
      Object.keys(changedFields).every((k) => {
        const field = (changedFields as any)[k];
        return field.changeType === 'unchanged';
      });

    return {
      changeType: allUnchanged ? 'unchanged' : 'update',
      changedFields,
    };
  }

  /**
   * Utility: Check if value is a plain object
   */
  private static isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Utility: Check if an array is an array of primitives
   */
  private static isArrayOfPrimitives(arr: any[]): boolean {
    return arr.every((item) => !this.isObject(item));
  }

  /**
   * Utility: Deep equality check for primitives, arrays, or plain objects
   * You can replace this with something more robust (like lodash.isEqual) if desired
   */
  private static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => this.deepEqual(val, b[index]));
    } else if (this.isObject(a) && this.isObject(b)) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) => this.deepEqual(a[key], b[key]));
    }

    return false;
  }
}
