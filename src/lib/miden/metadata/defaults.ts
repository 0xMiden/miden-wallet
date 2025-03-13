import browser from 'webextension-polyfill';

import { AssetMetadata } from './types';

// TODO: Make this miden data
export const ALEO_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'MIDEN',
  name: 'Miden',
  programId: '',
  mappingName: 'account',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/usds.svg')
};

export const BONDED_ALEO_SYMBOL = 'bonded-aleo';
export const STAKED_ALEO_SYMBOL = 'staked-aleo';

export const EMPTY_ASSET_METADATA: AssetMetadata = {
  decimals: 0,
  symbol: '',
  name: '',
  programId: '',
  mappingName: '',
  thumbnailUri: ''
};

export const DEFAULT_TOKEN_METADATA: AssetMetadata = {
  decimals: 0,
  symbol: '',
  name: '',
  programId: '',
  mappingName: 'authorized_balances',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/default.svg'),
  externalAuthorizationRequired: 'false'
};
