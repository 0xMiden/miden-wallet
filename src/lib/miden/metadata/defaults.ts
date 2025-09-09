import browser from 'webextension-polyfill';

import { AssetMetadata } from './types';

export const MIDEN_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'MIDEN',
  name: 'Miden',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/miden.svg')
};

export const EMPTY_ASSET_METADATA: AssetMetadata = {
  decimals: 0,
  symbol: '',
  name: '',
  thumbnailUri: ''
};

export const DEFAULT_TOKEN_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'Unknown',
  name: 'Unknown',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/default.svg')
};
