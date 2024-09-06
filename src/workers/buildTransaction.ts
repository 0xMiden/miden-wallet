import { expose } from 'threads/worker';

const TransactionBuilder = {
  synthesizeKeys: async () => {},
  setProvingKey: () => {},
  setVerifyingKey: () => {},
  setInclusionProvingKey: async () => {},
  buildAuthorization: async () => {},
  buildTransaction: async () => {},
  buildExecution: async () => {},
  buildDeployment: async () => {}
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TransactionBuilder = typeof TransactionBuilder;

expose(TransactionBuilder);
