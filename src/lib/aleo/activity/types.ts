export enum OpStackItemType {
  TransferTo,
  TransferFrom,
  CoinbaseReward,
  Delegation,
  Interaction,
  Origination,
  Other
}

export type OpStackItem =
  | TransferFromItem
  | TransferToItem
  | CoinbaseRewardItem
  | DelegationItem
  | InteractionItem
  | OriginationItem
  | OtherItem;

export interface OpStackItemBase {
  type: OpStackItemType;
}

export interface TransferFromItem extends OpStackItemBase {
  type: OpStackItemType.TransferFrom;
  from: string;
}

export interface TransferToItem extends OpStackItemBase {
  type: OpStackItemType.TransferTo;
  to: string;
}

export interface CoinbaseRewardItem extends OpStackItemBase {
  type: OpStackItemType.CoinbaseReward;
}

export interface DelegationItem extends OpStackItemBase {
  type: OpStackItemType.Delegation;
  to: string;
}

export interface InteractionItem extends OpStackItemBase {
  type: OpStackItemType.Interaction;
  with: string;
  entrypoint: string;
}

export interface OriginationItem extends OpStackItemBase {
  type: OpStackItemType.Origination;
  contract?: string;
}

export interface OtherItem extends OpStackItemBase {
  type: OpStackItemType.Other;
  name: string;
}
