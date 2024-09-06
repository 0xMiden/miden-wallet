import { logger } from 'shared/logger';

export async function retry<T>(fn: () => Promise<T>, maxAttempts: number, waitBetween: number = 1000): Promise<T> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const result = await fn();
      return result;
    } catch (err) {
      attempts++;
      if (attempts === maxAttempts) {
        throw err;
      }
      // wait for some time before the next attempt (optional)
      await new Promise(resolve => setTimeout(resolve, waitBetween));
    }
  }
  // unreachable code, but TypeScript requires a return statement
  throw new Error(`Retry failed after ${maxAttempts} attempts.`);
}

function timeout(ms: number): Promise<any> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
}

export async function retryWithTimeout<T>(fn: () => Promise<T>, ms: number, retries: number): Promise<T> {
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await Promise.race([fn(), timeout(ms)]);
    } catch (err: any) {
      logger.info(`Retry ${i + 1}: ${err.message}`);
    }
  }
  throw new Error('Failed after all retries');
}
