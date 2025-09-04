import { MIDEN_METADATA } from '../../lib/miden/front';

export const useGasToken = () => {
  return {
    logo: 'misc/token-logos/film.png',
    symbol: 'ф',
    assetName: 'miden',
    metadata: MIDEN_METADATA,
    isDcpNetwork: true
  };
};
