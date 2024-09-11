import { createStore, createEvent } from 'effector';

import { Vault } from 'lib/miden/back/vault';
import { NETWORKS } from 'lib/miden/networks';

export interface StoreState {
  inited: boolean;
  vault: Vault | null;
}

export interface UnlockedStoreState extends StoreState {
  vault: Vault;
}

export function toFront() {
  return {};
}

/**
 * Events
 */

export const inited = createEvent<boolean>('Inited');

export const locked = createEvent('Locked');

export const unlocked = createEvent<{
  vault: Vault;
  ownMnemonic: boolean;
}>('Unlocked');

// export const accountsUpdated =
//   createEvent<{ accounts: AleoAccount[]; currentAccount?: AleoAccount }>('Accounts updated');

// export const currentAccountUpdated = createEvent<AleoAccount>('Current Account Updated');

// export const settingsUpdated = createEvent<AleoSettings>('Settings updated');

/**
 * Store
 */

export const store = createStore<StoreState>({
  inited: false,
  vault: null
})
  .on(inited, (state, vaultExist) => ({
    ...state,
    inited: true,
    networks: NETWORKS
  }))
  .on(locked, () => ({
    // Attention!
    // Security stuff!
    // Don't merge new state to exisitng!
    // Build a new state from scratch
    // Reset all properties!
    inited: true,
    vault: null
  }))
  .on(unlocked, (state, { vault }) => ({
    ...state,
    vault
  }));

/**
 * Helpers
 */

export function withUnlocked<T>(factory: (state: UnlockedStoreState) => T) {
  const state = store.getState();
  assertUnlocked(state);
  return factory(state);
}

export function withInited<T>(factory: (state: StoreState) => T) {
  const state = store.getState();
  assertInited(state);
  return factory(state);
}

export function assertUnlocked(state: StoreState): asserts state is UnlockedStoreState {
  assertInited(state);
}

export function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error('Not initialized');
  }
}
