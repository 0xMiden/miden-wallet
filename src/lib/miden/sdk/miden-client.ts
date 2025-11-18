import { MidenClientInterface, MidenClientCreateOptions } from './miden-client-interface';

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
    return midenClientSingleton.getInstanceWithOptions(options);
  }
  return midenClientSingleton.getInstance();
}
