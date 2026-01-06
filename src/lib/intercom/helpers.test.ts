import { DEFAULT_ERROR_MESSAGE, deserializeError, IntercomError, serializeError } from './helpers';

describe('intercom helpers', () => {
  it('serializes plain errors and arrays', () => {
    expect(serializeError(new Error('boom'))).toBe('boom');
    expect(serializeError({})).toBe(DEFAULT_ERROR_MESSAGE);
    expect(serializeError({ message: 'bad', errors: ['x'] })).toEqual(['bad', ['x']]);
  });

  it('deserializes into IntercomError', () => {
    const err1 = deserializeError('oops');
    expect(err1).toBeInstanceOf(IntercomError);
    expect(err1.message).toBe('oops');

    const err2 = deserializeError(['oops', ['y']]);
    expect(err2.errors).toEqual(['y']);
  });
});
