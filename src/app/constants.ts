import { ALEO_SLUG, CREDITS_PROGRAM_ID, MTSP_PROGRAM_ID } from 'lib/miden/assets/constants';

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

  CONVERT_NFT: BigInt(1_600_000),

  [CREDITS_PROGRAM_ID]: {
    transfer_public: BigInt(53_613),
    transfer_private: BigInt(2_354),
    transfer_private_to_public: BigInt(29_657),
    transfer_public_to_private: BigInt(27_760)
  },
  [MTSP_PROGRAM_ID]: {
    transfer_public: BigInt(147_214),
    transfer_private: BigInt(4_996),
    transfer_private_to_public: BigInt(103_652),
    transfer_public_to_private: BigInt(64_789)
  }
};

type TransferType =
  | 'transfer_public'
  | 'transfer_private'
  | 'transfer_private_to_public'
  | 'transfer_public_to_private';

export const useRecommendedFee = (tokenSlug: string, sendPrivate: boolean, receivePrivate: boolean): bigint => {
  let functionName: TransferType = sendPrivate ? 'transfer_private_to_public' : 'transfer_public';
  if (receivePrivate) {
    functionName = sendPrivate ? 'transfer_private' : 'transfer_public_to_private';
  }
  return RECOMMENDED_FEES[tokenSlug === ALEO_SLUG ? CREDITS_PROGRAM_ID : MTSP_PROGRAM_ID][functionName];
};

export const useRecommendedConvertFee = (tokenSlug: string, convertPrivate: boolean): bigint => {
  return tokenSlug === ALEO_SLUG
    ? RECOMMENDED_FEES[CREDITS_PROGRAM_ID][convertPrivate ? 'transfer_private_to_public' : 'transfer_public_to_private']
    : RECOMMENDED_FEES[MTSP_PROGRAM_ID][convertPrivate ? 'transfer_private_to_public' : 'transfer_public_to_private'];
};
