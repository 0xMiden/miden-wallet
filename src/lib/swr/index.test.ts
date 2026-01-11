// Mock SWR module
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Import after mock setup
import useSWR from 'swr';

import { useRetryableSWR } from './index';

const mockUseSWR = useSWR as jest.Mock;

describe('useRetryableSWR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls useSWR with errorRetryCount of 10 by default', () => {
    const mockResponse = { data: 'test', error: undefined, isValidating: false, mutate: jest.fn() };
    mockUseSWR.mockReturnValue(mockResponse);

    const fetcher = jest.fn().mockResolvedValue('data');
    const result = useRetryableSWR('key', fetcher, undefined);

    expect(mockUseSWR).toHaveBeenCalledWith('key', fetcher, { errorRetryCount: 10 });
    expect(result).toBe(mockResponse);
  });

  it('merges custom config with default errorRetryCount', () => {
    const mockResponse = { data: 'test', error: undefined, isValidating: false, mutate: jest.fn() };
    mockUseSWR.mockReturnValue(mockResponse);

    const fetcher = jest.fn().mockResolvedValue('data');
    const config = { refreshInterval: 5000, revalidateOnFocus: false };

    useRetryableSWR('custom-key', fetcher, config);

    expect(mockUseSWR).toHaveBeenCalledWith('custom-key', fetcher, {
      errorRetryCount: 10,
      refreshInterval: 5000,
      revalidateOnFocus: false
    });
  });

  it('allows config to override errorRetryCount', () => {
    const mockResponse = { data: 'test', error: undefined, isValidating: false, mutate: jest.fn() };
    mockUseSWR.mockReturnValue(mockResponse);

    const fetcher = jest.fn().mockResolvedValue('data');
    const config = { errorRetryCount: 5 };

    useRetryableSWR('key', fetcher, config);

    // Spread order means config.errorRetryCount overrides default
    expect(mockUseSWR).toHaveBeenCalledWith('key', fetcher, { errorRetryCount: 5 });
  });

  it('handles null fetcher', () => {
    const mockResponse = { data: undefined, error: undefined, isValidating: false, mutate: jest.fn() };
    mockUseSWR.mockReturnValue(mockResponse);

    useRetryableSWR('key', null, undefined);

    expect(mockUseSWR).toHaveBeenCalledWith('key', null, { errorRetryCount: 10 });
  });

  it('rethrows errors from useSWR', () => {
    const error = new Error('SWR error');
    mockUseSWR.mockImplementation(() => {
      throw error;
    });

    expect(() => {
      useRetryableSWR('key', jest.fn(), undefined);
    }).toThrow('SWR error');
  });
});
