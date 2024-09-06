import { IRecordIdSync } from 'lib/aleo/db/types';
import * as Repo from 'lib/aleo/repo';

import {
  RecordSyncStep,
  chunkRecordSyncStep,
  combineMatchingSyncSteps,
  createSingleSyncPlan,
  saveRecordSync
} from './sync-plan';

// mock the fetch call used by createSingleSyncPlan
jest.mock('lib/aleo-chain', () => ({
  getEarliestRecordIdForBlock: jest.fn(() => 0)
}));

describe('sync-plan', () => {
  describe('createSingleSyncPlan', () => {
    it('sets sync plan from genesis to head when no record syncs present', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentHeight = Math.round(Math.random() * 100) + 1;
      const expectedSyncStep = new RecordSyncStep(0, currentHeight + 1, [address]);

      const result = await createSingleSyncPlan(address, currentHeight);

      expect(result.length).toBe(1);
      expect(result[0]).toStrictEqual(expectedSyncStep);
    });

    it('disregards sync plan from other addresses', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentId = Math.round(Math.random() * 100) + 1;
      const wrongRS: IRecordIdSync = {
        address: 'testy boi',
        startId: 0,
        endId: currentId
      };
      await Repo.recordIdSyncs.add(wrongRS);

      const expectedSyncStep = new RecordSyncStep(0, currentId + 1, [address]);

      const result = await createSingleSyncPlan(address, currentId);

      expect(result.length).toBe(1);
      expect(result[0]).toStrictEqual(expectedSyncStep);
    });

    it('disregards sync plans from other chains', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentHeight = Math.round(Math.random() * 100) + 1;
      const wrongRS: IRecordIdSync = {
        address: address,
        startId: 0,
        endId: currentHeight
      };
      await Repo.recordIdSyncs.add(wrongRS);

      const expectedSyncStep = new RecordSyncStep(0, currentHeight + 1, [address]);

      const result = await createSingleSyncPlan(address, currentHeight);

      expect(result.length).toBe(1);
      expect(result[0]).toStrictEqual(expectedSyncStep);
    });

    it('sets sync plan between record syncs', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentHeight = 207;
      const rs1End = 5;
      const rs1: IRecordIdSync = {
        address: address,
        startId: 0,
        endId: rs1End
      };
      const rs2Start = 90;
      const rs2End = 97;
      const rs2: IRecordIdSync = {
        address: address,
        startId: rs2Start,
        endId: rs2End
      };
      await Repo.recordIdSyncs.bulkAdd([rs1, rs2]);

      const expectedSyncStep = new RecordSyncStep(rs1End, rs2Start, [address]);

      const result = await createSingleSyncPlan(address, currentHeight);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContainEqual(expectedSyncStep);
    });

    it('does not set sync plan between record syncs when those syncs are directly adjacent', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentHeight = 207;
      const rs1End = 5;
      const rs1: IRecordIdSync = {
        address: address,
        startId: 0,
        endId: rs1End
      };
      const rs2: IRecordIdSync = {
        address: address,
        startId: rs1End,
        endId: currentHeight + 1
      };
      await Repo.recordIdSyncs.bulkAdd([rs1, rs2]);

      const result = await createSingleSyncPlan(address, currentHeight);

      expect(result.length).toBe(0);
    });

    it('sets sync plan from genesis to earliest sync plan', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentHeight = Math.round(Math.random() * 100) + 10;
      const rs1Start = 10;
      const rs1: IRecordIdSync = {
        address: address,
        startId: rs1Start,
        endId: currentHeight + 1
      };

      await Repo.recordIdSyncs.add(rs1);

      const expectedSyncStep = new RecordSyncStep(0, rs1Start, [address]);

      const result = await createSingleSyncPlan(address, currentHeight);

      expect(result.length).toBe(1);
      expect(result[0]).toStrictEqual(expectedSyncStep);
    });

    it('sets sync plan from latest sync plan to head', async () => {
      const chainId = 'test';
      const address = 'test';
      const currentHeight = Math.round(Math.random() * 100) + 10;
      const rs1End = 5;
      const rs1: IRecordIdSync = {
        address: address,
        startId: 0,
        endId: rs1End
      };

      await Repo.recordIdSyncs.add(rs1);

      const expectedSyncStep = new RecordSyncStep(rs1End, currentHeight + 1, [address]);

      const result = await createSingleSyncPlan(address, currentHeight);

      expect(result.length).toBe(1);
      expect(result[0]).toStrictEqual(expectedSyncStep);
    });
  });

  describe('chunkRecordSyncStep', () => {
    it.each([9, 10])(
      'does not chunk a record sync step that is smaller or equal than the chunk size',
      (recordSyncMagnitude: number) => {
        const chunkSize = 10;
        const recordSyncStep = new RecordSyncStep(0, recordSyncMagnitude, ['test']);
        const result = chunkRecordSyncStep(recordSyncStep, chunkSize);
        expect(result.length).toBe(1);
        expect(result[0]).toStrictEqual(recordSyncStep);
      }
    );

    it('chunks a record sync step at each chunk segment', () => {
      const chunkSize = 10;
      const start = 7;
      const end = 23;
      const recordSyncStep = new RecordSyncStep(start, end, ['test']);
      const expectedRecordSyncSteps = [
        new RecordSyncStep(start, 10, ['test']),
        new RecordSyncStep(10, 20, ['test']),
        new RecordSyncStep(20, 23, ['test'])
      ];
      const result = chunkRecordSyncStep(recordSyncStep, chunkSize);
      expect(result.length).toBe(3);
      expectedRecordSyncSteps.forEach(expectedRSS => expect(result).toContainEqual(expectedRSS));
    });
  });

  describe('combineMatchingSyncSteps', () => {
    it('returns empty input', () => {
      const result = combineMatchingSyncSteps([]);
      expect(result.length).toBe(0);
    });

    it('returns input when no sync steps match start and end exactly', () => {
      const testAddress1 = 'test1';
      const testAddress2 = 'test2';
      const recordSyncStepsInput = [
        new RecordSyncStep(0, 7, [testAddress1]),
        new RecordSyncStep(1, 5, [testAddress2]),
        new RecordSyncStep(9, 12, [testAddress1]),
        new RecordSyncStep(10, 11, [testAddress2])
      ];

      const result = combineMatchingSyncSteps(recordSyncStepsInput);

      expect(result.length).toBe(recordSyncStepsInput.length);
      recordSyncStepsInput.forEach(expectedRSS => expect(result).toContainEqual(expectedRSS));
    });

    it('combines sync steps that match exactly', () => {
      const testAddress1 = 'test1';
      const testAddress2 = 'test2';
      const recordSyncStepsInput = [
        new RecordSyncStep(0, 7, [testAddress1]),
        new RecordSyncStep(0, 7, [testAddress2]),
        new RecordSyncStep(9, 12, [testAddress1]),
        new RecordSyncStep(9, 12, [testAddress2])
      ];
      const expectedCombinedSyncSteps = [
        new RecordSyncStep(0, 7, [testAddress1, testAddress2]),
        new RecordSyncStep(9, 12, [testAddress1, testAddress2])
      ];

      const result = combineMatchingSyncSteps(recordSyncStepsInput);

      expect(result.length).toBe(expectedCombinedSyncSteps.length);
      expectedCombinedSyncSteps.forEach(expectedRSS => expect(result).toContainEqual(expectedRSS));
    });
  });

  describe('saveRecordSync', () => {
    it('saves record syncs', async () => {
      const chainId = 'chainId';
      const address = 'address';
      const rs1: IRecordIdSync = {
        address: address,
        startId: 0,
        endId: 50
      };
      const recordSyncStepUpdate = new RecordSyncStep(rs1.startId, rs1.endId, [address]);
      await Repo.recordIdSyncs.add(rs1);
      const expectedUpdatedRS: IRecordIdSync = {
        ...rs1
      };

      await saveRecordSync(chainId, address, recordSyncStepUpdate);

      const allRecordSyncs = await Repo.recordIdSyncs.toCollection().toArray();

      expect(allRecordSyncs.length).toBe(2);
      expect(allRecordSyncs[0]).toEqual(expect.objectContaining(expectedUpdatedRS));
    });
  });
});
