import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/firestore';
import {
  FirestoreEventAnalyzer,
  ObjectChanges,
} from '../../src/infrastructure';

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
  describe('getChanges - Document-level', () => {
    it('should detect document addition', () => {
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
          fieldOldValue: undefined,
          fieldNewValue: 'Alice',
          changeType: 'addition',
        },
        age: {
          fieldOldValue: undefined,
          fieldNewValue: 25,
          changeType: 'addition',
        },
      });
    });

    it('should detect document deletion', () => {
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
          fieldOldValue: 'Bob',
          fieldNewValue: undefined,
          changeType: 'deletion',
        },
        age: {
          fieldOldValue: 30,
          fieldNewValue: undefined,
          changeType: 'deletion',
        },
      });
    });

    it('should detect document update', () => {
      const beforeData = { name: 'Charlie', age: 20, city: 'NYC' };
      const afterData = { name: 'Charlie', age: 21, city: 'LA' };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );

      expect(changes.type).toBe('update');
      // Check changed fields
      expect(changes.changedFields).toMatchObject({
        name: {
          fieldOldValue: 'Charlie',
          fieldNewValue: 'Charlie',
          changeType: 'unchanged',
        },
        age: {
          fieldOldValue: 20,
          fieldNewValue: 21,
          changeType: 'update',
        },
        city: {
          fieldOldValue: 'NYC',
          fieldNewValue: 'LA',
          changeType: 'update',
        },
      });
    });

    it('should detect document unchanged if both before and after are undefined', () => {
      // Edge case: no data at all
      const event = mockFirestoreEvent(undefined, undefined);
      const changes = FirestoreEventAnalyzer.getChanges<Record<string, any>>(
        'docId',
        event,
      );

      expect(changes.type).toBe('unchanged');
      expect(changes.changedFields).toEqual({});
    });
  });

  describe('Nested objects', () => {
    it('should detect unchanged nested object', () => {
      const beforeData = { user: { firstName: 'Dave', lastName: 'Doe' } };
      const afterData = { user: { firstName: 'Dave', lastName: 'Doe' } };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );
      const userChanges = changes.changedFields.user;

      expect(changes.type).toBe('unchanged');
      expect(userChanges).toMatchObject({
        changeType: 'unchanged',
      });
      expect(userChanges?.changedFields).toMatchObject({
        firstName: {
          fieldOldValue: 'Dave',
          fieldNewValue: 'Dave',
          changeType: 'unchanged',
        },
        lastName: {
          fieldOldValue: 'Doe',
          fieldNewValue: 'Doe',
          changeType: 'unchanged',
        },
      });
    });

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
      const userChanges = changes.changedFields.user;

      expect(changes.type).toBe('update');
      // user object is updated or unchanged?
      expect(userChanges?.changeType).toBe('update');
      // inside user
      expect(userChanges?.changedFields).toMatchObject({
        firstName: {
          fieldOldValue: 'Dave',
          fieldNewValue: 'Dave',
          changeType: 'unchanged',
        },
        lastName: {
          fieldOldValue: 'Doe',
          fieldNewValue: 'Smith',
          changeType: 'update',
        },
      });
    });
  });

  describe('Arrays of primitives', () => {
    it('should detect unchanged arrays of primitives', () => {
      const beforeData = { tags: ['red', 'blue'] };
      const afterData = { tags: ['red', 'blue'] };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );

      // The document is 'update' at top-level because before and after exist
      expect(changes.type).toBe('unchanged');
      // But the tags field should be 'unchanged'
      expect(changes.changedFields).toMatchObject({
        tags: {
          fieldOldValue: ['red', 'blue'],
          fieldNewValue: ['red', 'blue'],
          changeType: 'unchanged',
        },
      });
    });

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
          fieldOldValue: ['red', 'blue'],
          fieldNewValue: ['red', 'blue', 'green'],
          changeType: 'update',
        },
      });
    });
  });

  describe('Arrays of objects', () => {
    it('should mark entire array as unchanged if elements are identical', () => {
      const beforeData = {
        items: [{ name: 'Item1' }, { name: 'Item2' }],
      };
      const afterData = {
        items: [{ name: 'Item1' }, { name: 'Item2' }],
      };
      const event = mockFirestoreEvent(beforeData, afterData);

      const changes = FirestoreEventAnalyzer.getChanges<typeof beforeData>(
        'docId',
        event,
      );
      const itemsField = changes.changedFields.items;

      expect(changes.type).toBe('unchanged');
      expect(itemsField.changeType).toBe('unchanged');
      itemsField.elements.forEach((item, index) => {
        expect(item.changeType).toEqual('unchanged');
        expect(item.changedFields.name).toMatchObject({
          fieldOldValue: beforeData.items[index].name,
          fieldNewValue: beforeData.items[index].name,
          changeType: 'unchanged',
        });
      });
    });

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
      const itemsChanges = changes.changedFields.items.elements;

      expect(changes.type).toBe('update');
      // Because the array is not identical, we have an array of changes
      expect(itemsChanges).toHaveLength(3);

      // The first item should be unchanged
      expect(itemsChanges[0]).toMatchObject({
        changeType: 'unchanged',
      });

      // The second item should be unchanged
      expect(itemsChanges[1]).toMatchObject({
        changeType: 'unchanged',
      });

      // The third item should be an addition
      expect(itemsChanges[2]).toMatchObject({
        changeType: 'addition',
        changedFields: {
          name: {
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
      const itemsChanges = changes.changedFields.items.elements;

      expect(changes.type).toBe('update');
      expect(itemsChanges).toHaveLength(3);

      // First item: unchanged
      expect(itemsChanges[0]).toMatchObject({
        changeType: 'unchanged',
      });

      // Second item: unchanged
      expect(itemsChanges[1]).toMatchObject({
        changeType: 'unchanged',
      });

      // Third item: deletion
      expect(itemsChanges[2]).toMatchObject({
        changeType: 'deletion',
        changedFields: {
          name: {
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
      const itemsChanges = changes.changedFields.items.elements;

      expect(changes.type).toBe('update');
      expect(itemsChanges).toHaveLength(2);

      // First item: unchanged
      expect(itemsChanges[0]).toMatchObject<
        ObjectChanges<{
          name: string;
          qty: number;
        }>
      >({
        changeType: 'unchanged',
        changedFields: {
          name: {
            fieldOldValue: 'Item1',
            fieldNewValue: 'Item1',
            changeType: 'unchanged',
          },
          qty: {
            fieldOldValue: 1,
            fieldNewValue: 1,
            changeType: 'unchanged',
          },
        },
      });

      // Second item: update
      expect(itemsChanges[1]).toMatchObject({
        changeType: 'update',
        changedFields: {
          name: {
            changeType: 'unchanged',
            fieldOldValue: 'Item2',
            fieldNewValue: 'Item2',
          },
          qty: {
            changeType: 'update',
            fieldOldValue: 5,
            fieldNewValue: 10,
          },
        },
      });
    });
  });
});
