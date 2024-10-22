import { ReadyWalletState, WalletNetwork, WalletState } from 'lib/shared/types';

export interface MidenState extends WalletState {
  networks: MidenNetwork[];
}

export interface ReadyMidenState extends ReadyWalletState {}

export interface MidenNetwork extends WalletNetwork {}
