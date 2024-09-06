import { Pool, FunctionThread, spawn } from 'threads';

import { TagProof, ProofInputs } from 'lib/aleo/activity/tagging/tag';

type ProveTagsWorker = (proofInputs: ProofInputs[]) => Promise<TagProof[]>;

type ProveTagsPool = Pool<FunctionThread<[proofInputs: ProofInputs[]], TagProof[]>>;

// Create pool with maximum number of CPUs
const poolSize = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));
let pool: ProveTagsPool;

export const beginProveTagsWorkers = async (proofInputs: ProofInputs[]): Promise<TagProof[]> => {
  if (!pool) {
    pool = Pool(() => spawn<ProveTagsWorker>(new Worker('./proveTags.js')), poolSize);
  }

  const splitWork = divideProofWork(proofInputs, poolSize);
  // Schedule tasks in parallel
  const tasks = splitWork.map(inputs =>
    pool.queue(async proveTags => {
      return await proveTags(inputs);
    })
  );
  // Wait for tasks to finish and get results
  const proofs: TagProof[] = (await Promise.all(tasks)).flat();
  return proofs;
};

const divideProofWork = (proofInputs: ProofInputs[], numberOfThreads: number) => {
  const splitWork: ProofInputs[][] = [];
  // Get the average chunk size
  const chunkSize = Math.floor(proofInputs.length / numberOfThreads);

  // one thread per proof
  if (numberOfThreads >= proofInputs.length) {
    return proofInputs.map(input => [input]);
  }

  // Split work into n - 1 sub-arrays
  let startIndex = 0;
  for (let i = 0; i < numberOfThreads - 1; i++) {
    const endIndex = startIndex + chunkSize;
    splitWork.push(proofInputs.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  // Add remaining elements as last sub-array
  splitWork.push(proofInputs.slice(startIndex));

  return splitWork;
};
