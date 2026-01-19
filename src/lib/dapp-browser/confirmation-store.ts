/**
 * Store for managing DApp confirmation requests on mobile.
 * Since we can't open popup windows on mobile, we use this store to
 * coordinate between the backend (dapp.ts) and the frontend (Browser.tsx).
 */

import { PrivateDataPermission, AllowedPrivateData } from '@demox-labs/miden-wallet-adapter-base';

import { DappMetadata } from 'lib/miden/types';

export interface DAppConfirmationRequest {
  id: string;
  type: 'connect' | 'sign' | 'transaction' | 'consume';
  origin: string;
  appMeta: DappMetadata;
  network: string;
  networkRpc: string;
  privateDataPermission: PrivateDataPermission;
  allowedPrivateData: AllowedPrivateData;
  existingPermission: boolean;
  // Transaction-specific fields
  transactionMessages?: string[];
  sourcePublicKey?: string;
}

export interface DAppConfirmationResult {
  confirmed: boolean;
  accountPublicKey?: string;
  privateDataPermission?: PrivateDataPermission;
  // Transaction-specific result
  delegate?: boolean;
}

type ConfirmationResolver = (result: DAppConfirmationResult) => void;

// Singleton store for pending confirmations
class DAppConfirmationStore {
  private pendingRequest: DAppConfirmationRequest | null = null;
  private pendingResolver: ConfirmationResolver | null = null;
  private listeners: Set<() => void> = new Set();

  /**
   * Request confirmation from the user.
   * Returns a promise that resolves when the user confirms or denies.
   */
  requestConfirmation(request: DAppConfirmationRequest): Promise<DAppConfirmationResult> {
    return new Promise(resolve => {
      this.pendingRequest = request;
      this.pendingResolver = resolve;
      this.notifyListeners();
    });
  }

  /**
   * Resolve the pending confirmation with a result.
   */
  resolveConfirmation(result: DAppConfirmationResult): void {
    if (this.pendingResolver) {
      this.pendingResolver(result);
      this.pendingRequest = null;
      this.pendingResolver = null;
      this.notifyListeners();
    }
  }

  /**
   * Get the current pending request, if any.
   */
  getPendingRequest(): DAppConfirmationRequest | null {
    return this.pendingRequest;
  }

  /**
   * Check if there's a pending confirmation.
   */
  hasPendingRequest(): boolean {
    return this.pendingRequest !== null;
  }

  /**
   * Subscribe to store changes.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const dappConfirmationStore = new DAppConfirmationStore();
