import { retry, retryWithTimeout } from './retry';
import { logger } from 'shared/logger';

jest.spyOn(logger, 'info').mockResolvedValue();

describe('retry utilities', () => {
  it('retries and succeeds after a transient failure', async () => {
    let attempts = 0;
    const fn = jest.fn(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('fail once');
      }
      return 'ok';
    });

    const promise = retry(fn, 3, 1);

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retryWithTimeout logs each failure and throws after exhausting retries', async () => {
    const fn = jest.fn(async () => {
      throw new Error('boom');
    });

    const promise = retryWithTimeout(fn, 1, 2);

    await expect(promise).rejects.toThrow('Failed after all retries');
    expect(logger.info).toHaveBeenCalledTimes(3);
  });
});
