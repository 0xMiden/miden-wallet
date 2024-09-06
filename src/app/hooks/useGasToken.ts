import { ALEO_METADATA } from '../../lib/aleo/front';

export const useGasToken = () => {
  return {
    logo: 'misc/token-logos/film.png',
    symbol: 'ф',
    assetName: 'aleo',
    metadata: ALEO_METADATA,
    isDcpNetwork: true
  };
};
