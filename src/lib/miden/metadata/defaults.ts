import browser from 'webextension-polyfill';

import { CREDITS_PROGRAM_ID, MTSP_PROGRAM_ID } from '../assets/constants';
import { AssetMetadata } from './types';

export const ALEO_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'ALEO',
  name: 'Aleo',
  programId: CREDITS_PROGRAM_ID,
  mappingName: 'account',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/aleo.svg')
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
  programId: MTSP_PROGRAM_ID,
  mappingName: 'authorized_balances',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/default.svg'),
  externalAuthorizationRequired: 'false'
};
