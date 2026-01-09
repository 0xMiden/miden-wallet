import { withWasmClientLock } from './miden-client';

describe('withWasmClientLock', () => {
  it('executes a single operation and returns its result', async () => {
    const result = await withWasmClientLock(async () => {
      return 'test-result';
    });

    expect(result).toBe('test-result');
  });

  it('serializes concurrent operations', async () => {
    const executionOrder: number[] = [];
    const operationDuration = 50;

    // Start 3 operations concurrently
    const op1 = withWasmClientLock(async () => {
      executionOrder.push(1);
      await new Promise(resolve => setTimeout(resolve, operationDuration));
      executionOrder.push(-1);
      return 'op1';
    });

    const op2 = withWasmClientLock(async () => {
      executionOrder.push(2);
      await new Promise(resolve => setTimeout(resolve, operationDuration));
      executionOrder.push(-2);
      return 'op2';
    });

    const op3 = withWasmClientLock(async () => {
      executionOrder.push(3);
      await new Promise(resolve => setTimeout(resolve, operationDuration));
      executionOrder.push(-3);
      return 'op3';
    });

    const results = await Promise.all([op1, op2, op3]);

    // All operations should complete
    expect(results).toEqual(['op1', 'op2', 'op3']);

    // Operations should be serialized: each one starts after previous ends
    // Pattern should be: [1, -1, 2, -2, 3, -3] (start/end pairs in order)
    expect(executionOrder).toEqual([1, -1, 2, -2, 3, -3]);
  });

  it('releases the lock even when operation throws', async () => {
    const errorOp = withWasmClientLock(async () => {
      throw new Error('test error');
    });

    await expect(errorOp).rejects.toThrow('test error');

    // Next operation should still be able to acquire the lock
    const result = await withWasmClientLock(async () => {
      return 'success after error';
    });

    expect(result).toBe('success after error');
  });

  it('preserves operation order (FIFO)', async () => {
    const order: string[] = [];

    const ops = ['first', 'second', 'third', 'fourth', 'fifth'].map(name =>
      withWasmClientLock(async () => {
        order.push(name);
        await new Promise(resolve => setTimeout(resolve, 10));
        return name;
      })
    );

    await Promise.all(ops);

    expect(order).toEqual(['first', 'second', 'third', 'fourth', 'fifth']);
  });

  it('does not allow concurrent execution', async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;

    const ops = Array.from({ length: 5 }, (_, i) =>
      withWasmClientLock(async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise(resolve => setTimeout(resolve, 20));
        concurrentCount--;
        return i;
      })
    );

    await Promise.all(ops);

    // Should never have more than 1 concurrent operation
    expect(maxConcurrent).toBe(1);
  });
});

describe('getMidenClient singleton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('reuses the same instance without options', async () => {
    const create = jest.fn(async () => ({ free: jest.fn() }));
    jest.doMock('./miden-client-interface', () => ({
      MidenClientInterface: class {
        static create = create;
        free() {}
      }
    }));

    jest.isolateModules(() => {
      const { getMidenClient } = require('./miden-client');
      return Promise.all([getMidenClient(), getMidenClient()]).then(([first, second]: any[]) => {
        expect(create).toHaveBeenCalledTimes(1);
        expect(first).toBe(second);
      });
    });
  });

  it('disposes and recreates when called with options', async () => {
    const free = jest.fn();
    const create = jest
      .fn()
      .mockResolvedValueOnce({ free })
      .mockResolvedValueOnce({ free });

    jest.doMock('./miden-client-interface', () => ({
      MidenClientInterface: class {
        static create = create;
        free = free;
      }
    }));

    jest.isolateModules(() => {
      const { getMidenClient } = require('./miden-client');
      return Promise.resolve()
        .then(() => getMidenClient({ seed: new Uint8Array([1]) }))
        .then(() => getMidenClient({ seed: new Uint8Array([2]) }))
        .then(() => {
          expect(create).toHaveBeenCalledTimes(2);
          expect(free).toHaveBeenCalledTimes(1);
        });
    });
  });
});
