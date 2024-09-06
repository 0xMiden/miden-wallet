import { v5 as uuid } from 'uuid';

const RECORD_NAMESPACE = '2677c729-bccd-48b6-a410-edea2fc5dd11';

export interface IDappRecord {
  id: string;
  owner: string;
  program_id: string;
  microcredits?: string;
  spent: boolean;
  recordName: string;
  data: any;
}

export interface IRecord {
  // represented as a bigint on-chain, but stored as a string to be indexed by dexie
  id: string;
  chainId: string;
  address: string;
  microcredits?: bigint;
  block_height_created: bigint;
  block_id_created: bigint;
  // represented as a bigint on-chain, but stored as a string to be indexed by dexie
  timestamp_created: number;
  serial_number: string;
  ciphertext: string;
  program_id: string;
  block_height_spent: bigint;
  block_id_spent: bigint;
  // Representing on chain values
  block_hash: string;
  transaction_id: string;
  transition_id: string;
  transaction_id_spent?: string;
  transition_id_spent?: string;
  // represented as a bigint on-chain, but stored as a string to be indexed by dexie
  timestamp_spent: number;
  // stored as 0 (unspent) or 1 (spent) because Dexie cannot index booleans
  spent: number;
  locked: number;
  locallySyncedTransactions: number;

  // Used to figure out the name of the record
  output_index: number;
  function_name: string;

  tag?: string;
}

export interface IOwnedRecord {
  // rpc id for record
  id: string;
  address: string;
  transition_id: string;
  output_index: number;
  synced: number;
  nonce_x: string;
  nonce_y: string;
  owner_x: string;
  tag: string;
}

// implementation class to give records default values
export class Record implements IRecord {
  id: string;
  chainId: string;
  address: string;
  microcredits?: bigint;
  block_height_created: bigint;
  block_id_created: bigint;
  timestamp_created: number;
  serial_number: string;
  ciphertext: string;
  program_id: string;
  block_height_spent: bigint;
  block_id_spent: bigint;
  timestamp_spent: number;
  block_hash: string;
  transaction_id: string;
  transition_id: string;
  spent: number;
  locked: number;
  locallySyncedTransactions: number;
  output_index: number;
  function_name: string;

  constructor(
    chainId: string,
    block_height_created: bigint,
    block_id_created: bigint,
    timestamp_created: number,
    ciphertext: string,
    program_id: string,
    block_hash: string,
    transaction_id: string,
    transition_id: string,
    output_index: number,
    function_name: string
  ) {
    this.id = uuid(`${ciphertext}-${chainId}`, RECORD_NAMESPACE);
    this.chainId = chainId;
    this.address = '';
    this.microcredits = BigInt(0);
    this.block_height_created = block_height_created;
    this.block_id_created = block_id_created;
    this.timestamp_created = timestamp_created;
    this.serial_number = '';
    this.ciphertext = ciphertext;
    this.program_id = program_id;
    this.block_height_spent = BigInt(-1);
    this.block_id_spent = BigInt(-1);
    this.timestamp_spent = -1;
    this.block_hash = block_hash;
    this.transaction_id = transaction_id;
    this.transition_id = transition_id;
    this.spent = 0;
    this.locked = 0;
    this.locallySyncedTransactions = 0;
    this.output_index = output_index;
    this.function_name = function_name;
  }
}

export interface ICoinbaseReward {
  chainId: string;
  address: string;
  commitment: string;
  reward: bigint;
  target: bigint;
  target_sum: bigint;
  height: bigint;
  block_hash: string;
  timestamp: number;
  coinbase_reward: bigint;
}

// Deprecated, use IRecordIdSync
export interface IRecordSync {
  chainId: string;
  address: string;
  startBlock: number;
  endBlock: number;
  page: number;
  rangeComplete: boolean;
}

export interface IRecordIdSync {
  address: string;
  // inclusive
  startId: number;
  // exlusive
  endId: number;
}

export interface IPublicSync {
  chainId: string;
  address: string;
  startBlock: number;
  endBlock: number;
  page: number;
  rangeComplete: boolean;
}

export interface ISerialNumberSync {
  chainId: string;
  page: number;
}

export interface ISerialNumber {
  chainId: string;
  serial_number: string;
  program_id: string;
  block_id: bigint;
  height: bigint;
  transaction_id: string;
  transition_id: string;
  timestamp_spent: string;
}

export interface IAccountCreationBlockHeight {
  address: string;
  blockHeight: number;
  associatedRecordId: number;
}
