import { logger } from './logger';

describe('logger', () => {
  const originalEnv = process.env.MODE_ENV;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    (logger as any).sendLogToServer = jest.fn();
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.MODE_ENV = originalEnv;
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('censors private and view keys', () => {
    const str = 'APrivateKey' + 'x'.repeat(48) + ' ' + 'AViewKey' + 'y'.repeat(45);
    const result = (logger as any).censorKeys(str);
    expect(result).toBe('APrivateKey**** AViewKey****');
  });

  it('sends logs in production when analytics enabled', async () => {
    process.env.MODE_ENV = 'production';
    localStorage.setItem('analytics', JSON.stringify({ enabled: true }));

    await logger.info('message', { foo: 'bar' });

    expect((logger as any).sendLogToServer).toHaveBeenCalledTimes(1);
    const logArg = (logger as any).sendLogToServer.mock.calls[0][0];
    expect(logArg.level).toBe('info');
    expect(logArg.meta.walletVersion).toBeDefined();
  });

  it('skips sending logs when not production', async () => {
    process.env.MODE_ENV = 'development';
    await logger.info('message');
    expect((logger as any).sendLogToServer).not.toHaveBeenCalled();
  });

  it('logs warning messages', async () => {
    process.env.MODE_ENV = 'production';
    localStorage.setItem('analytics', JSON.stringify({ enabled: true }));

    await logger.warning('warning message', { context: 'test' });

    expect(warnSpy).toHaveBeenCalledWith('warning message');
    expect((logger as any).sendLogToServer).toHaveBeenCalledTimes(1);
    const logArg = (logger as any).sendLogToServer.mock.calls[0][0];
    expect(logArg.level).toBe('warn');
    expect(logArg.message).toBe('warning message');
  });

  it('logs error messages', async () => {
    process.env.MODE_ENV = 'production';
    localStorage.setItem('analytics', JSON.stringify({ enabled: true }));

    await logger.error('error message', { errorCode: 500 });

    expect(errorSpy).toHaveBeenCalledWith('error message', { errorCode: 500 });
    expect((logger as any).sendLogToServer).toHaveBeenCalledTimes(1);
    const logArg = (logger as any).sendLogToServer.mock.calls[0][0];
    expect(logArg.level).toBe('error');
    expect(logArg.message).toBe('error message');
  });

  it('skips sending when analytics disabled', async () => {
    process.env.MODE_ENV = 'production';
    localStorage.setItem('analytics', JSON.stringify({ enabled: false }));

    await logger.info('message');

    expect((logger as any).sendLogToServer).not.toHaveBeenCalled();
  });
});
