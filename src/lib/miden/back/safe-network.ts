import browser from 'webextension-polyfill';

import { WalletNetwork } from 'lib/shared/types';

import { NETWORKS } from '../networks';

export async function getCurrentMidenNetwork() {
  const items = await browser.storage.local.get(['network_id', 'custom_networks_snapshot']);
  const networkId = items['network_id'] as string | undefined;
  const customNetworksSnapshot = items['custom_networks_snapshot'] as WalletNetwork[] | undefined;

  return [...NETWORKS, ...(customNetworksSnapshot ?? [])].find(n => n.id === networkId) ?? NETWORKS[0];
}
