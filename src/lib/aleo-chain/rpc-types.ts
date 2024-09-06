export interface IEncryptedRecord {
  id: bigint;
  record_ciphertext: string;
  program_id: string;
  block_id: bigint;
  height: string;
  timestamp: bigint;
  block_hash: string;
  transaction_id: string;
  transition_id: string;
  output_index: string;
  function_name: string;
}

export interface IRecordMetadata {
  id: number;
  transition_id: string;
  nonce_x: string;
  nonce_y: string;
  owner_x: string;
  output_index: number;
}

export interface ISerialNumberMetadata {
  serial_number: string;
  program_id: string;
  block_id: bigint;
  height: number;
  transaction_id: string;
  transition_id: string;
  timestamp: bigint;
}

export interface IPublicNFTData {
  transactionId: string;
  timestamp: bigint;
  programId: string;
  tokenId: string;
  baseUri: string;
  symbol: string;
  tokenIdString: string;
  edition: string;
}
