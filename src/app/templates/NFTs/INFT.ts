export interface INFTAttribute {
  trait_type: string;
  value: string;
}

export interface INFT {
  // record id containing the nft information
  recordId?: string;
  // id assigned to this nft on-chain
  tokenId: string;
  // Raw, unparsed tokenId struct
  tokenIdRaw?: string;
  programId: string;
  symbol: string;
  imageURI: string;
  timestamp: number;
  edition: string;
  transactionId: string;
  isPrivate: boolean;

  // Optional properties
  collectionDescription?: string;
  collectionName?: string;
  collectionLink?: string;
  sourceLink?: string;
  explorerLink?: string;
  mintNumber?: number;
  attributes?: INFTAttribute[];
}

export interface INFTRecordData {
  recordId: string;
  transactionId: string;
  programId: string;
  tokenId: string;
  timestamp: number;
  edition: string;
}
