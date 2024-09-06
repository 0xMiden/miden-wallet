import { AssetMetadata, DetailedAssetMetdata } from './types';

export function getAssetSymbol(metadata: AssetMetadata | null, short = false) {
  if (!metadata) return '???';
  if (!short) return metadata.symbol;
  return metadata.symbol === 'aleo' ? 'aleo' : metadata.symbol.substr(0, 5);
}

export function getAssetName(metadata: AssetMetadata | null) {
  return metadata ? metadata.symbol : 'Unknown Token';
}

export function toBaseMetadata(data: DetailedAssetMetdata | AssetMetadata): AssetMetadata {
  return {
    decimals: data.decimals,
    symbol: data.symbol,
    name: data.name,
    shouldPreferSymbol: data.shouldPreferSymbol,
    thumbnailUri: data.thumbnailUri,
    displayUri: data.displayUri,
    artifactUri: data.artifactUri,
    programId: data.programId,
    mappingName: data.mappingName
  };
}
