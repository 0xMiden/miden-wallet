import { getMessage } from 'lib/i18n';
import { MIDEN_NETWORK_ENDPOINTS, MIDEN_NETWORKS } from 'lib/miden-chain/constants';
import { WalletNetwork } from 'lib/shared/types';

export const NETWORK_IDS: Map<string, string> = { ...MIDEN_NETWORK_ENDPOINTS };

export const NETWORKS: WalletNetwork[] = [...MIDEN_NETWORKS];
