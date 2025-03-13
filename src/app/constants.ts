export const RECOMMENDED_FEES = {
  // Derived from snarkOS: `snarkos developer execute "credits.aleo" claim_unbond_public ...`
  // Took public fee (78711) and added 5% for uncertainty buffer
  CLAIM_UNSTAKED: BigInt(82_646),

  // Derived from snarkOS: `snarkos developer execute "credits.aleo" bond_public ...`
  // Took public fee (172079) and added 5% for uncertainty buffer
  STAKE: BigInt(180_683),

  // Derived from snarkOS: `snarkos developer execute "credits.aleo" unbond_public ...`
  // Took public fee (355356) and added 5% for uncertainty buffer
  UNSTAKE: BigInt(373_124),

  SEND_NFT_PRIVATE: BigInt(45_000),

  SEND_NFT_PUBLIC: BigInt(1_600_000),

  CONVERT_NFT: BigInt(1_600_000)
};

type TransferType =
  | 'transfer_public'
  | 'transfer_private'
  | 'transfer_private_to_public'
  | 'transfer_public_to_private';

export const useRecommendedFee = (tokenSlug: string, sendPrivate: boolean, receivePrivate: boolean) => {};

export const useRecommendedConvertFee = (tokenSlug: string, convertPrivate: boolean) => {};
