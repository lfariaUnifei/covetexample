import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';
import { FirestoreEventAnalyzer } from '../../src/infrastructure';

function mockFirestoreEvent<T>(
  beforeData: T | undefined,
  afterData: T | undefined,
  eventId = 'testEventId',
  eventTime = '2021-10-01T00:00:00.000Z',
): FirestoreEvent<Change<DocumentSnapshot> | undefined> {
  // Create mock DocumentSnapshots
  const beforeSnap = {
    data: () => beforeData,
  } as unknown as DocumentSnapshot;

  const afterSnap = {
    data: () => afterData,
  } as unknown as DocumentSnapshot;

  // Return a FirestoreEvent
  return {
    id: eventId,
    time: eventTime,
    data:
      beforeData || afterData
        ? { before: beforeSnap, after: afterSnap }
        : undefined,
  } as FirestoreEvent<Change<DocumentSnapshot> | undefined>;
}

describe('FirestoreEventAnalyzer', () => {
  describe('getChanges', () => {
    it('should detect document addition (before is undefined, after is defined)', () => {
      const beforeData = undefined;
      const afterData = { name: 'Alice', age: 25 };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof afterData>(
        'docId',
        event,
      );

      expect(changes.type).toBe('addition');
      expect(changes.documentId).toBe('docId');
      expect(changes.eventId).toBe('testEventId');
      expect(changes.madeAt.toISOString()).toBe('2021-10-01T00:00:00.000Z');
      expect(changes.changedFields).toMatchObject({
        name: {
          fieldName: 'name',
          fieldOldValue: undefined,
          fieldNewValue: 'Alice',
          changeType: 'addition',
        },
        age: {
          fieldName: 'age',
          fieldOldValue: undefined,
          fieldNewValue: 25,
          changeType: 'addition',
        },
      });
    });

    it('should detect document deletion (before is defined, after is undefined)', () => {
      const beforeData = { name: 'Bob', age: 30 };
      const afterData = undefined;
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );

      expect(changes.type).toBe('deletion');
      expect(changes.changedFields).toMatchObject({
        name: {
          fieldName: 'name',
          fieldOldValue: 'Bob',
          fieldNewValue: undefined,
          changeType: 'deletion',
        },
        age: {
          fieldName: 'age',
          fieldOldValue: 30,
          fieldNewValue: undefined,
          changeType: 'deletion',
        },
      });
    });

    it('should detect document update (before and after defined)', () => {
      const beforeData = { name: 'Charlie', age: 20, city: 'NYC' };
      const afterData = { name: 'Charlie', age: 21, city: 'LA' };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );

      expect(changes.type).toBe('update');
      // Only age and city should be updated
      expect(changes.changedFields).toMatchObject({
        age: {
          fieldName: 'age',
          fieldOldValue: 20,
          fieldNewValue: 21,
          changeType: 'update',
        },
        city: {
          fieldName: 'city',
          fieldOldValue: 'NYC',
          fieldNewValue: 'LA',
          changeType: 'update',
        },
      });

      // Ensure name is not listed as changed
      expect(changes.changedFields).not.toHaveProperty('name');
    });
  });

  describe('Nested objects', () => {
    it('should detect nested object changes', () => {
      const beforeData = {
        user: {
          firstName: 'Dave',
          lastName: 'Doe',
        },
      };
      const afterData = {
        user: {
          firstName: 'Dave',
          lastName: 'Smith', // changed
        },
      };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );
      const changedFields = changes.changedFields.user?.changedFields;

      expect(changes.type).toBe('update');
      expect(changedFields).toBeDefined();
      expect(changedFields).toMatchObject({
        lastName: {
          fieldName: 'lastName',
          fieldOldValue: 'Doe',
          fieldNewValue: 'Smith',
          changeType: 'update',
        },
      });
    });
  });

  describe('Arrays of primitives', () => {
    it('should detect changes in arrays of primitives', () => {
      const beforeData = { tags: ['red', 'blue'] };
      const afterData = { tags: ['red', 'blue', 'green'] };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );

      expect(changes.type).toBe('update');
      // We expect tags to have changed
      expect(changes.changedFields).toMatchObject({
        tags: {
          fieldName: 'tags',
          fieldOldValue: ['red', 'blue'],
          fieldNewValue: ['red', 'blue', 'green'],
          changeType: 'update',
        },
      });
    });

    it('should not detect changes if arrays of primitives are identical', () => {
      const beforeData = { tags: ['red', 'blue'] };
      const afterData = { tags: ['red', 'blue'] };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );

      // No changes should be reported
      expect(changes.changedFields).toEqual({});
    });
  });

  describe('Arrays of objects', () => {
    it('should detect item addition within arrays of objects', () => {
      const beforeData = {
        items: [{ name: 'Item1' }, { name: 'Item2' }],
      };
      const afterData = {
        items: [{ name: 'Item1' }, { name: 'Item2' }, { name: 'Item3' }],
      };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );
      const itemChanges = changes.changedFields.items as any[];

      expect(changes.type).toBe('update');
      expect(itemChanges).toHaveLength(3);

      // Third item should show as an addition
      expect(itemChanges[2]).toMatchObject({
        changeType: 'addition',
        changedFields: {
          name: {
            fieldName: 'name',
            fieldOldValue: undefined,
            fieldNewValue: 'Item3',
            changeType: 'addition',
          },
        },
      });
    });

    it('should detect item deletion within arrays of objects', () => {
      const beforeData = {
        items: [{ name: 'ItemA' }, { name: 'ItemB' }, { name: 'ItemC' }],
      };
      const afterData = {
        items: [{ name: 'ItemA' }, { name: 'ItemB' }],
      };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );
      const itemChanges = changes.changedFields.items as any[];

      expect(changes.type).toBe('update');
      expect(itemChanges).toHaveLength(3); // Because we compare up to max length

      // Third item should show as a deletion
      expect(itemChanges[2]).toMatchObject({
        changeType: 'deletion',
        changedFields: {
          name: {
            fieldName: 'name',
            fieldOldValue: 'ItemC',
            fieldNewValue: undefined,
            changeType: 'deletion',
          },
        },
      });
    });

    it('should detect item update within arrays of objects', () => {
      const beforeData = {
        items: [
          { name: 'Item1', qty: 1 },
          { name: 'Item2', qty: 5 },
        ],
      };
      const afterData = {
        items: [
          { name: 'Item1', qty: 1 },
          { name: 'Item2', qty: 10 }, // changed from 5 to 10
        ],
      };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );
      const itemChanges = changes.changedFields.items as any[];

      expect(changes.type).toBe('update');
      expect(itemChanges).toHaveLength(2);

      // Second item should show an update
      expect(itemChanges[1]).toMatchObject({
        changeType: 'update',
        changedFields: {
          qty: {
            fieldName: 'qty',
            fieldOldValue: 5,
            fieldNewValue: 10,
            changeType: 'update',
          },
        },
      });
    });
  });
});
