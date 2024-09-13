import { WebClient } from '@demox-labs/miden-sdk';
import { WalletNetwork, WalletState } from 'lib/shared/types';

export interface MidenState extends WalletState {
  networks: MidenNetwork[];
}

export interface MidenNetwork extends WalletNetwork {}
