import { MidenClientInterface, MidenClientCreateOptions } from './miden-client-interface';

/**
 * Simple async mutex to prevent concurrent WASM client operations.
 * The WASM client cannot handle concurrent calls - they cause
 * "recursive use of an object detected which would lead to unsafe aliasing in rust" errors.
 *
 * Supports an idle queue for low-priority background tasks that run only when
 * no high-priority operations are pending.
 */
class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];
  private idleQueue: Array<() => Promise<void>> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
      this.drainIdleQueue();
    }
  }

  /**
   * Queue a low-priority task to run when the mutex is idle.
   * Idle tasks run after all high-priority (withWasmClientLock) operations complete.
   */
  queueIdleTask(task: () => Promise<void>): void {
    if (!this.locked && this.queue.length === 0) {
      this.runIdleTask(task);
    } else {
      this.idleQueue.push(task);
    }
  }

  private drainIdleQueue(): void {
    const task = this.idleQueue.shift();
    if (task) {
      this.runIdleTask(task);
    }
  }

  private runIdleTask(task: () => Promise<void>): void {
    this.locked = true;
    task()
      .catch(err => console.warn('Idle task failed:', err))
      .finally(() => {
        // Check if high-priority work came in while idle task was running
        if (this.queue.length > 0) {
          const next = this.queue.shift()!;
          next();
        } else {
          // Continue with more idle tasks or release
          const nextIdle = this.idleQueue.shift();
          if (nextIdle) {
            this.runIdleTask(nextIdle);
          } else {
            this.locked = false;
          }
        }
      });
  }
}

// Global mutex for all WASM client operations
const wasmClientMutex = new AsyncMutex();

/**
 * Execute an operation with the WASM client mutex held.
 * This ensures only one WASM client operation runs at a time across the entire app.
 */
export async function withWasmClientLock<T>(operation: () => Promise<T>): Promise<T> {
  await wasmClientMutex.acquire();
  try {
    return await operation();
  } finally {
    wasmClientMutex.release();
  }
}

/**
 * Queue a low-priority operation to run when the WASM client is idle.
 * Use this for background tasks like metadata prefetching that shouldn't
 * block or delay critical operations.
 *
 * Operations are fire-and-forget (errors are logged, not thrown).
 */
export function runWhenClientIdle(operation: () => Promise<void>): void {
  wasmClientMutex.queueIdleTask(operation);
}

/**
 * Singleton manager for MidenClientInterface.
 * Ensures a bounded number of client instances (and underlying web workers) exist at a time.
 */
class MidenClientSingleton {
  private instance: MidenClientInterface | null = null;
  private initializingPromise: Promise<MidenClientInterface> | null = null;

  private instanceWithOptions: MidenClientInterface | null = null;
  private initializingPromiseWithOptions: Promise<MidenClientInterface> | null = null;

  /**
   * Get or create the singleton MidenClientInterface instance.
   * This instance does not specify any options and is never disposed.
   */
  async getInstance(): Promise<MidenClientInterface> {
    if (this.instance) {
      return this.instance;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = (async () => {
      const client = await MidenClientInterface.create();
      this.instance = client;
      this.initializingPromise = null;
      return client;
    })();

    return this.initializingPromise;
  }

  /**
   * Get or create the singleton MidenClientInterface instance with specified options.
   * If it already exists, this instance will always be disposed and recreated to ensure option correctness.
   */
  async getInstanceWithOptions(options: MidenClientCreateOptions): Promise<MidenClientInterface> {
    if (this.instanceWithOptions) {
      this.disposeInstanceWithOptions();
    }

    if (this.initializingPromiseWithOptions) {
      return this.initializingPromiseWithOptions;
    }

    this.initializingPromiseWithOptions = (async () => {
      const client = await MidenClientInterface.create(options);
      this.instanceWithOptions = client;
      this.initializingPromiseWithOptions = null;
      return client;
    })();

    return this.initializingPromiseWithOptions;
  }

  disposeInstanceWithOptions(): void {
    if (this.instanceWithOptions) {
      this.instanceWithOptions.free();
      this.instanceWithOptions = null;
      this.initializingPromiseWithOptions = null;
    }
  }
}

const midenClientSingleton = new MidenClientSingleton();

/**
 * Convenience function to get the shared MidenClientInterface instance.
 * Use this in your components and modules instead of calling MidenClientInterface.create().
 */
export async function getMidenClient(options?: MidenClientCreateOptions): Promise<MidenClientInterface> {
  if (options) {
    return await midenClientSingleton.getInstanceWithOptions(options);
  }
  return await midenClientSingleton.getInstance();
}
