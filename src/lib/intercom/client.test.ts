import { MessageType } from './types';

// Mock webextension-polyfill before importing
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();
const mockPostMessage = jest.fn();
let disconnectCallback: (() => void) | null = null;

const mockPort = {
  onMessage: {
    addListener: mockAddListener,
    removeListener: mockRemoveListener
  },
  onDisconnect: {
    addListener: jest.fn((cb: () => void) => {
      disconnectCallback = cb;
    })
  },
  postMessage: mockPostMessage
};

jest.mock('webextension-polyfill', () => ({
  runtime: {
    connect: jest.fn(() => mockPort)
  }
}));

import { IntercomClient } from './client';

describe('IntercomClient', () => {
  let client: IntercomClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    disconnectCallback = null;
    client = new IntercomClient();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates client and connects to port', () => {
    const browser = require('webextension-polyfill');
    expect(browser.runtime.connect).toHaveBeenCalledWith({ name: 'INTERCOM' });
  });

  it('sends request and resolves on response', async () => {
    const requestPromise = client.request({ action: 'test' });

    // Get the message listener
    const messageListener = mockAddListener.mock.calls[0][0];

    // Simulate response
    messageListener({
      type: MessageType.Res,
      reqId: 0,
      data: { result: 'success' }
    });

    const result = await requestPromise;
    expect(result).toEqual({ result: 'success' });
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageType.Req,
      data: { action: 'test' },
      reqId: 0
    });
  });

  it('sends request and rejects on error', async () => {
    const requestPromise = client.request({ action: 'test' });

    // Get the message listener
    const messageListener = mockAddListener.mock.calls[0][0];

    // Simulate error response
    messageListener({
      type: MessageType.Err,
      reqId: 0,
      data: 'Something went wrong'
    });

    await expect(requestPromise).rejects.toMatchObject({
      message: 'Something went wrong'
    });
  });

  it('ignores messages with different reqId', async () => {
    const requestPromise = client.request({ action: 'test' });

    // Get the message listener
    const messageListener = mockAddListener.mock.calls[0][0];

    // Simulate response with different reqId - should be ignored
    messageListener({
      type: MessageType.Res,
      reqId: 999,
      data: { result: 'wrong' }
    });

    // Now send the correct response
    messageListener({
      type: MessageType.Res,
      reqId: 0,
      data: { result: 'correct' }
    });

    const result = await requestPromise;
    expect(result).toEqual({ result: 'correct' });
  });

  it('increments reqId for each request', async () => {
    // First request
    const promise1 = client.request({ action: 'first' });
    const messageListener1 = mockAddListener.mock.calls[0][0];
    messageListener1({ type: MessageType.Res, reqId: 0, data: {} });
    await promise1;

    // Second request
    const promise2 = client.request({ action: 'second' });
    const messageListener2 = mockAddListener.mock.calls[1][0];
    messageListener2({ type: MessageType.Res, reqId: 1, data: {} });
    await promise2;

    expect(mockPostMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({ reqId: 0 }));
    expect(mockPostMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ reqId: 1 }));
  });

  it('subscribes to notifications and calls callback', () => {
    const callback = jest.fn();
    client.subscribe(callback);

    // Get the subscription listener
    const subListener = mockAddListener.mock.calls[0][0];

    // Simulate subscription message
    subListener({
      type: MessageType.Sub,
      data: { event: 'update' }
    });

    expect(callback).toHaveBeenCalledWith({ event: 'update' });
  });

  it('unsubscribes when calling returned function', () => {
    const callback = jest.fn();
    const unsubscribe = client.subscribe(callback);

    unsubscribe();

    expect(mockRemoveListener).toHaveBeenCalled();
  });

  it('subscribe ignores non-Sub messages', () => {
    const callback = jest.fn();
    client.subscribe(callback);

    // Get the subscription listener
    const subListener = mockAddListener.mock.calls[0][0];

    // Simulate non-Sub message
    subListener({
      type: MessageType.Req,
      data: { event: 'update' }
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('reconnects after disconnect', () => {
    const browser = require('webextension-polyfill');

    // Trigger disconnect
    if (disconnectCallback) {
      disconnectCallback();
    }

    // Advance timers by 1 second
    jest.advanceTimersByTime(1000);

    // Should have reconnected
    expect(browser.runtime.connect).toHaveBeenCalledTimes(2);
  });
});
