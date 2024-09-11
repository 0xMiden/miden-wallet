import { ALEO_METADATA } from '../../lib/miden/front';

export const useGasToken = () => {
  return {
    logo: 'misc/token-logos/film.png',
    symbol: 'ф',
    assetName: 'aleo',
    metadata: ALEO_METADATA,
    isDcpNetwork: true
  };
};
