import { expose } from 'threads/worker';

import { ProofInputs, TagProof } from 'lib/aleo/activity/tagging/tag';
import { TAGGING_KEYS } from 'lib/aleo/activity/tagging/tagging-keys';

async function proveTags(chainId: string, proofInputs: ProofInputs[]): Promise<TagProof[]> {
  const proofKeys = TAGGING_KEYS;
  const proofs = proofInputs.map(proofInput => {});

  return [];
}

expose(proveTags);
