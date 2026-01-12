import { MidenClientCreateOptions, MidenClientInterface } from './miden-client-interface';

export type MockMidenClientOptions = MidenClientCreateOptions & {
  serializedMockChain?: Uint8Array;
  serializedMockNoteTransportNode?: Uint8Array;
};

/**
 * Create a MidenClientInterface backed by the SDK's MockWebClient.
 * This keeps chain interactions in-memory for deterministic, offline testing.
 */
export async function createMockMidenClient(options: MockMidenClientOptions = {}) {
  const { serializedMockChain, serializedMockNoteTransportNode, seed, onConnectivityIssue } = options;

  const { MockWebClient } = await import('@demox-labs/miden-sdk');

  const mockWebClient = await MockWebClient.createClient(serializedMockChain, serializedMockNoteTransportNode, seed);

  return MidenClientInterface.fromWebClient(mockWebClient as any, 'mock', onConnectivityIssue);
}
