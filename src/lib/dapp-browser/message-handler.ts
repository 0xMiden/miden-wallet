/**
 * Handles messages from the DApp browser WebView and forwards them to the wallet backend.
 */

import { MidenDAppRequest } from 'lib/adapter/types';
import { processDApp } from 'lib/miden/back/actions';

export interface WebViewMessage {
  type: string;
  payload: MidenDAppRequest | string;
  reqId: string;
}

export interface WebViewResponse {
  type: 'MIDEN_PAGE_RESPONSE' | 'MIDEN_PAGE_ERROR_RESPONSE';
  payload: unknown;
  reqId: string;
  error?: string;
}

/**
 * Process a message from the WebView and return a response
 */
export async function handleWebViewMessage(message: WebViewMessage, origin: string): Promise<WebViewResponse> {
  const { payload, reqId } = message;

  try {
    // Handle PING for availability check
    if (payload === 'PING') {
      return {
        type: 'MIDEN_PAGE_RESPONSE',
        payload: 'PONG',
        reqId
      };
    }

    // Process the DApp request
    const response = await processDApp(origin, payload as MidenDAppRequest);

    return {
      type: 'MIDEN_PAGE_RESPONSE',
      payload: response ?? null,
      reqId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[DAppBrowser] Error processing message:', errorMessage);

    return {
      type: 'MIDEN_PAGE_ERROR_RESPONSE',
      payload: null,
      reqId,
      error: errorMessage
    };
  }
}
