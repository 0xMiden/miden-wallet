import browser from 'webextension-polyfill';

import { AssetMetadata } from './types';

export const MIDEN_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'MIDEN',
  name: 'Miden',
  programId: '',
  mappingName: 'account',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/usds.svg')
};

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
