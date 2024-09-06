// Actually, there is a bunch of other types but only these will be used for now
export type AleoOperationType = 'delegation' | 'transaction' | 'reveal' | 'origination';
export type AleoQuoteCurrency = 'None' | 'Btc' | 'Eur' | 'Usd' | 'Cny' | 'Jpy' | 'Krw';
export type AleoOperationStatus = 'applied' | 'failed' | 'backtracked' | 'skipped';
export type AleoContractType = 'delegator_contract' | 'smart_contract';

export interface AleoAlias {
  alias?: string;
  address: string;
}

export interface AleoOperationError {
  type: string;
}

// To be reviewed if a new operation type is added
interface AleoOperationBase {
  type: AleoOperationType;
  id: number;
  level?: number;
  timestamp: string;
  block?: string;
  hash: string;
  counter: number;
  sender: AleoAlias;
  gasLimit: number;
  gasUsed: number;
  bakerFee: number;
  quote?: AleoQuote;
  errors?: AleoOperationError[] | null;
  status: AleoOperationStatus;
}

export type AleoGetOperationsParams = {
  address: string;
  from?: string;
  to?: string;
  type?: AleoOperationType[];
  lastId?: number;
  limit?: number;
  offset?: number;
  sort?: 0 | 1;
  quote?: AleoQuoteCurrency[];
};

export type AleoQuote = Partial<Record<AleoQuoteCurrency, number>>;

export interface AleoDelegationOperation extends AleoOperationBase {
  type: 'delegation';
  initiator?: AleoAlias;
  nonce?: number;
  amount?: number;
  prevDelegate?: AleoAlias | null;
  newDelegate?: AleoAlias | null;
}

export interface AleoTransactionOperation extends AleoOperationBase {
  type: 'transaction';
  initiator?: AleoAlias;
  nonce?: number;
  storageLimit: number;
  storageUsed: number;
  storageFee: number;
  allocationFee: number;
  target: AleoAlias;
  amount: number;
  parameters?: string;
  hasInternals: boolean;
}

export interface AleoOriginationOperation extends AleoOperationBase {
  type: 'origination';
}

export interface AleoRevealOperation extends AleoOperationBase {
  type: 'reveal';
}

export type AleoOperation =
  | AleoDelegationOperation
  | AleoTransactionOperation
  | AleoRevealOperation
  | AleoOriginationOperation;

export type AleoDelegateInfo = {
  alias?: string;
  address: string;
  active: boolean;
};

export type AleoRelatedContract = {
  kind: AleoContractType;
  alias?: string;
  address: string;
  balance: number;
  delegate?: AleoDelegateInfo;
  creationLevel: number;
  creationTime: string;
};

type Int32ParameterKey = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'in' | 'ni';
export type Int32Parameter = Partial<Record<Int32ParameterKey, number>>;

export type AleoGetRewardsParams = {
  address: string;
  cycle?: Int32Parameter;
  sort?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  quote?: AleoQuoteCurrency[];
};

export type AleoRewardsEntry = {
  cycle: number;
  balance: number;
  baker: {
    alias?: string;
    address: string;
  };
  stakingBalance: number;
  expectedBlocks: number;
  expectedEndorsements: number;
  futureBlocks: number;
  futureBlockRewards: number;
  ownBlocks: number;
  ownBlockRewards: number;
  extraBlocks: number;
  extraBlockRewards: number;
  missedOwnBlocks: number;
  missedOwnBlockRewards: number;
  missedExtraBlocks: number;
  missedExtraBlockRewards: number;
  uncoveredOwnBlocks: number;
  uncoveredOwnBlockRewards: number;
  uncoveredExtraBlocks: number;
  uncoveredExtraBlockRewards: number;
  futureEndorsements: number;
  futureEndorsementRewards: number;
  endorsements: number;
  endorsementRewards: number;
  missedEndorsements: number;
  missedEndorsementRewards: number;
  uncoveredEndorsements: number;
  uncoveredEndorsementRewards: number;
  ownBlockFees: number;
  extraBlockFees: number;
  missedOwnBlockFees: number;
  missedExtraBlockFees: number;
  uncoveredOwnBlockFees: number;
  uncoveredExtraBlockFees: number;
  doubleBakingRewards: number;
  doubleBakingLostDeposits: number;
  doubleBakingLostRewards: number;
  doubleBakingLostFees: number;
  doubleEndorsingRewards: number;
  doubleEndorsingLostDeposits: number;
  doubleEndorsingLostRewards: number;
  doubleEndorsingLostFees: number;
  revelationRewards: number;
  revelationLostRewards: number;
  revelationLostFees: number;
  quote?: AleoQuote;
};

export type AleoGetRewardsResponse = AleoRewardsEntry[] | undefined;

export const allInt32ParameterKeys: Int32ParameterKey[] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'ni'];

export const isReveal = (operation: AleoOperation): operation is AleoRevealOperation => {
  return operation.type === 'reveal';
};

export interface AleoAccountTokenBalance {
  account: AleoAlias;
  balance: string;
  firstLevel: number;
  firstTime: string;
  id: number;
  lastLevel: number;
  lastTime: string;
  token: {
    contract: AleoAlias;
    id: number;
    metadata: {
      artifactUri: string;
      creators: Array<string>;
      decimals: string;
      description: string;
      displayUri: string;
      formats: Array<{ uri: string; mimeType: string }>;
      isBooleanAmount: boolean;
      name: string;
      shouldPreferSymbol: boolean;
      symbol: string;
      tags: Array<string>;
      thumbnailUri: string;
    };
    standard: string;
    tokenId: string;
  };
  transfersCount: number;
}

export interface AleoTokenTransfer {
  amount: string;
  from: AleoAlias;
  id: number;
  level: number;
  timestamp: string;
  to: AleoAlias;
  token: {
    contract: AleoAlias;
    id: number;
    metadata: {
      name: string;
      symbol: string;
      decimals: string;
      thumbnailUri?: string;
      eth_name?: string;
      eth_symbol?: string;
      eth_contract?: string;
    };
    standard: string;
    tokenId: string;
  };
  transactionId: number;
}
