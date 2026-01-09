import { MidenClientInterface, MidenClientCreateOptions } from './miden-client-interface';

/**
 * Simple async mutex to prevent concurrent WASM client operations.
 * The WASM client cannot handle concurrent calls - they cause
 * "recursive use of an object detected which would lead to unsafe aliasing in rust" errors.
 */
class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];

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
    }
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
