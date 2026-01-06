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
