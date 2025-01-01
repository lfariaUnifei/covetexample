import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';

/**
 * -----------------------------
 *  Types
 * -----------------------------
 */
export type FirestoreChangeType =
  | 'addition'
  | 'update'
  | 'deletion'
  | 'unchanged';

export type ChangedField<T> = {
  fieldNewValue: T;
  fieldOldValue: T;
  changeType: FirestoreChangeType;
};

export type ObjectChanges<T> = {
  changeType: FirestoreChangeType;
  changedFields: FirestoreChangedFields<T>;
  oldObject?: T;
  newObject?: T;
};

export type ArrayChanges<T> = {
  changeType: FirestoreChangeType;
  elements: ArrayElementChange<T>[];
};

/**
 * Key mapping utility for a Firestore object:
 *   - If a property is an array -> ArrayChanges
 *   - If a property is an object -> ObjectChanges
 *   - Otherwise -> ChangedField
 */
type FirestoreFieldChanges<T> = T extends any[]
  ? ArrayChanges<T[number]>
  : T extends Record<string, unknown>
  ? ObjectChanges<T>
  : ChangedField<T>;

type ArrayElementChange<T> = FirestoreFieldChanges<T>;

/**
 * Optional vs. required keys
 */
type OptionalKeys<T> = {
  [K in keyof T]-?: T extends Record<K, T[K]> ? never : K;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

/**
 * The main shape for changed fields in an object
 */
export type FirestoreChangedFields<T> = {
  [K in RequiredKeys<T>]: FirestoreFieldChanges<T[K]>;
} & {
  [K in OptionalKeys<T>]?: FirestoreFieldChanges<T[K]>;
};

export type FirestoreChanges<T> = {
  changedFields: FirestoreChangedFields<T>;
  documentId: string;
  eventId: string;
  madeAt: Date;
  type: FirestoreChangeType; // High-level change for the entire document
};

/**
 * -----------------------------
 *  The FirestoreEventAnalyzer
 * -----------------------------
 */
export class FirestoreEventAnalyzer {
  static getChanges<T extends Record<string, any>>(
    documentId: string,
    event: FirestoreEvent<Change<DocumentSnapshot> | undefined>,
  ): FirestoreChanges<T> {
    const before = event.data?.before?.data() as T | undefined;
    const after = event.data?.after?.data() as T | undefined;

    // High-level "doc" change type
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
   * Collect changed fields for an object, returning a FirestoreChangedFields<T>.
   */
  private static collectChangedFields<T extends Record<string, any>>(
    before?: T,
    after?: T,
  ): FirestoreChangedFields<T> {
    const changedFields = {} as FirestoreChangedFields<T>;

    if (!before && !after) return changedFields;

    // Gather all field names
    const allFields = new Set([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ]);

    for (const fieldName of allFields) {
      const beforeValue = before?.[fieldName];
      const afterValue = after?.[fieldName];

      const analyzedChange = this.analyzeValueChange(beforeValue, afterValue);
      (changedFields as any)[fieldName] = analyzedChange;
    }

    return changedFields;
  }

  /**
   * If either is undefined, treat it as an empty array,
   * then compare them item-by-item.
   */
  private static analyzeValueChange(
    beforeValue: any,
    afterValue: any,
  ): FirestoreFieldChanges<any> {
    const fieldChangeType = this.determineChangeType(beforeValue, afterValue);

    // --------------------
    // CASE A: Array logic
    // --------------------
    const beforeIsArrayOrUndefined =
      Array.isArray(beforeValue) || beforeValue === undefined;
    const afterIsArrayOrUndefined =
      Array.isArray(afterValue) || afterValue === undefined;

    // If we want to treat "undefined" as empty array when the other side is an array:
    if (beforeIsArrayOrUndefined && afterIsArrayOrUndefined) {
      const beforeArr = Array.isArray(beforeValue) ? beforeValue : [];
      const afterArr = Array.isArray(afterValue) ? afterValue : [];

      // Now do array-level comparison
      if (beforeArr || afterArr) {
        const items = this.getArrayChanges(beforeArr, afterArr);

        // If all items are unchanged at the element level, mark the entire array as unchanged
        const allUnchanged =
          fieldChangeType === 'unchanged' &&
          items.every((it) => it.changeType === 'unchanged');

        return {
          changeType: allUnchanged ? 'unchanged' : fieldChangeType,
          elements: items,
        } as ArrayChanges<any>;
      }
    }

    // --------------------
    // CASE B: Object logic
    // --------------------
    // If both (or either undefined) are objects => treat `undefined` as {}
    const beforeIsObjectOrUndef =
      beforeValue === undefined || this.isObject(beforeValue);
    const afterIsObjectOrUndef =
      afterValue === undefined || this.isObject(afterValue);

    if (beforeIsObjectOrUndef && afterIsObjectOrUndef) {
      const beforeObj = beforeValue ?? {};
      const afterObj = afterValue ?? {};
      const changedFields = this.collectChangedFields(beforeObj, afterObj);
      const allUnchanged =
        fieldChangeType === 'unchanged' ||
        Object.values(changedFields).every(
          (ch) => ch?.changeType === 'unchanged',
        );

      return {
        changeType: allUnchanged ? 'unchanged' : fieldChangeType,
        changedFields,
        oldObject: beforeValue,
        newObject: afterValue,
      } as ObjectChanges<any>;
    }

    // --------------------
    // CASE C: Fallback -> ChangedField
    // --------------------
    return {
      fieldOldValue: beforeValue,
      fieldNewValue: afterValue,
      changeType: fieldChangeType,
    } as ChangedField<any>;
  }

  /**
   * Compare two arrays item-by-item. Each item can be a primitive, object, or nested array.
   */
  private static getArrayChanges<T>(
    beforeArr: T[] = [],
    afterArr: T[] = [],
  ): ArrayElementChange<T>[] {
    const changes: ArrayElementChange<T>[] = [];
    const maxLen = Math.max(beforeArr.length, afterArr.length);

    for (let i = 0; i < maxLen; i++) {
      // Recursively analyze the item
      const itemChange = this.analyzeValueChange(
        beforeArr[i],
        afterArr[i],
      ) as ArrayElementChange<T>;
      changes.push(itemChange);
    }

    return changes;
  }

  /**
   * Basic "determine change type" logic.
   */
  private static determineChangeType(
    before: any,
    after: any,
  ): FirestoreChangeType {
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
   * Check if value is a plain object
   */
  private static isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Deep equality check for primitives, arrays, or plain objects
   */
  private static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.deepEqual(val, b[idx]));
    }

    // Objects
    if (this.isObject(a) && this.isObject(b)) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((k) => this.deepEqual(a[k], b[k]));
    }

    // Otherwise (primitive, mismatch, etc.)
    return false;
  }
}
