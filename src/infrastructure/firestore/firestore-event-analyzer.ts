import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';

type ChangeType = 'addition' | 'update' | 'deletion' | 'unchanged';

type ChangedField<T> = {
  fieldNewValue?: T;
  fieldOldValue?: T;
  changeType: ChangeType;
};

export type ObjectChanges<T> = {
  changeType: ChangeType;
  changedFields: FirestoreChangedFields<T>;
};

type ArrayChanges<T> = {
  changeType: ChangeType;
  elements: ObjectChanges<T>[];
};

type FirestoreChanges<T> = {
  changedFields: FirestoreChangedFields<T>;
  documentId: string;
  eventId: string;
  madeAt: Date;
  type: ChangeType; // High-level change for the document as a whole
};

/**
 * ----------------------------------------
 *  1) Utilities to detect optional vs. required keys
 * ----------------------------------------
 */
type OptionalKeys<T> = {
  // K is optional if "T extends Record<K, T[K]>" fails
  [K in keyof T]-?: T extends Record<K, T[K]> ? never : K;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

/**
 * -------------------------------------------------------
 *  2) Updated mapped type to preserve optional properties
 * -------------------------------------------------------
 */
type FirestoreChangedFields<T> =
  // 2.1) Required keys: must exist, i.e. no `?`
  {
    [K in RequiredKeys<T>]: T[K] extends Array<infer U>
      ? U extends Record<string, any>
        ? // Array of objects
          ArrayChanges<U>
        : // Array of primitives
          ChangedField<T[K]>
      : T[K] extends Record<string, any>
      ? // Nested object
        ObjectChanges<T[K]>
      : // Primitive or any other type
        ChangedField<T[K]>;
  } & {
    // 2.2) Optional keys: must be marked `?`
    [K in OptionalKeys<T>]?: T[K] extends Array<infer U>
      ? U extends Record<string, any>
        ? // Array of objects
          ArrayChanges<U>
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

    // Determine overall document change
    const docChangeType = this.determineChangeType(before, after);

    return {
      changedFields: this.collectChangedFields(before, after),
      documentId,
      eventId: event.id,
      madeAt: new Date(event.time),
      type: docChangeType,
    };
  }

  /**
   * --------------------------------------------------
   *  1) Top-level: collect changed fields for an object
   * --------------------------------------------------
   */
  private static collectChangedFields<T extends Record<string, any>>(
    before?: T,
    after?: T,
  ): FirestoreChangedFields<T> {
    const changedFields = {} as FirestoreChangedFields<T>;

    if (!before && !after) return changedFields; // No data at all => nothing to collect

    // Collect all field names from "before" and "after"
    const allFields = new Set([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ]);

    for (const fieldName of allFields) {
      const beforeValue = before?.[fieldName];
      const afterValue = after?.[fieldName];

      // Analyze the change for this particular field
      const analyzedChange = this.analyzeValueChange(beforeValue, afterValue);

      // Only store if there's a real structure to keep (e.g. changedFields, items, or changed field).
      (changedFields as any)[fieldName] = analyzedChange;
    }

    return changedFields;
  }

  /**
   * ---------------------------------------------------------------------
   *  2) Single function that decides how to represent the field's change
   * ---------------------------------------------------------------------
   */
  private static analyzeValueChange(
    beforeValue: any,
    afterValue: any,
  ): ChangedField<any> | ObjectChanges<any> | ArrayChanges<any> {
    // High-level change for this field
    const fieldChangeType = this.determineChangeType(beforeValue, afterValue);

    // Case A: One is array, the other is not => treat as a simple ChangedField
    if (Array.isArray(beforeValue) !== Array.isArray(afterValue)) {
      return {
        fieldOldValue: beforeValue,
        fieldNewValue: afterValue,
        changeType: fieldChangeType,
      };
    }

    // Case B: Both are arrays
    if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
      // Are these arrays of primitives or arrays of objects?
      const arraysOfPrimitives =
        this.isArrayOfPrimitives(beforeValue) &&
        this.isArrayOfPrimitives(afterValue);

      if (arraysOfPrimitives) {
        // Arrays of primitives => treat as a single ChangedField
        return {
          fieldOldValue: beforeValue,
          fieldNewValue: afterValue,
          changeType: fieldChangeType,
        };
      } else {
        // Arrays of objects => produce ArrayChanges
        const items = this.getArrayChanges(
          beforeValue as Record<string, any>[],
          afterValue as Record<string, any>[],
        );
        // If the entire array is effectively unchanged at the item level, mark as unchanged
        const allUnchanged =
          fieldChangeType === 'unchanged' &&
          items.every((i) => i.changeType === 'unchanged');

        return {
          changeType: allUnchanged ? 'unchanged' : fieldChangeType,
          elements: items,
        };
      }
    }

    // Case C: Both values are plain objects
    if (this.isObject(beforeValue) && this.isObject(afterValue)) {
      // Compare fields recursively
      const changedFields = this.collectChangedFields(beforeValue, afterValue);
      // If all nested fields are unchanged, override the changeType to 'unchanged'
      const allUnchanged =
        fieldChangeType === 'unchanged' ||
        Object.values(changedFields).every(
          (val: any) => val.changeType === 'unchanged',
        );

      return {
        changeType: allUnchanged ? 'unchanged' : fieldChangeType,
        changedFields,
      };
    }

    // Case D: Primitives (or differing types) => store as ChangedField
    return {
      fieldOldValue: beforeValue,
      fieldNewValue: afterValue,
      changeType: fieldChangeType,
    };
  }

  /**
   * --------------------------------------------
   *  3) Compare arrays of objects item-by-item
   * --------------------------------------------
   */
  private static getArrayChanges<T extends Record<string, any>>(
    before: T[] = [],
    after: T[] = [],
  ): ObjectChanges<T>[] {
    const changes: ObjectChanges<T>[] = [];
    const maxLen = Math.max(before.length, after.length);

    for (let i = 0; i < maxLen; i++) {
      const beforeItem = before[i];
      const afterItem = after[i];
      const itemChangeType = this.determineChangeType(beforeItem, afterItem);

      if (itemChangeType === 'addition') {
        changes.push({
          changeType: 'addition',
          changedFields: this.collectChangedFields(undefined, afterItem),
        });
      } else if (itemChangeType === 'deletion') {
        changes.push({
          changeType: 'deletion',
          changedFields: this.collectChangedFields(beforeItem, undefined),
        });
      } else if (itemChangeType === 'update') {
        // Compare fields inside each item
        const changedFields = this.collectChangedFields(beforeItem, afterItem);
        // If everything within is unchanged, treat item as unchanged
        const allUnchanged = Object.values(changedFields).every(
          (val: any) => val.changeType === 'unchanged',
        );
        changes.push({
          changeType: allUnchanged ? 'unchanged' : 'update',
          changedFields,
        });
      } else {
        // 'unchanged'
        changes.push({
          changeType: 'unchanged',
          changedFields: this.collectChangedFields(beforeItem, afterItem),
        });
      }
    }

    return changes;
  }

  /**
   * -----------------------------------------------------------------
   *  4) Helper to figure out "addition", "deletion", "update", etc.
   * -----------------------------------------------------------------
   */
  private static determineChangeType(before: any, after: any): ChangeType {
    if (before === undefined && after !== undefined) return 'addition';
    if (before !== undefined && after === undefined) return 'deletion';
    if (
      before !== undefined &&
      after !== undefined &&
      !this.deepEqual(before, after)
    ) {
      return 'update';
    }
    return 'unchanged';
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
   */
  private static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;

    // Compare arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => this.deepEqual(val, b[i]));
    }

    // Compare objects
    if (this.isObject(a) && this.isObject(b)) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) => this.deepEqual(a[key], b[key]));
    }

    // Fallback: compare primitive values
    return false;
  }
}
