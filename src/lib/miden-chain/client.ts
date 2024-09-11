import { JSONRPCClient } from 'json-rpc-2.0';
import { IRecordMetadata } from './rpc-types';

export const getHeight = async () => {};

export const getLastRecordId = async () => {};

export const getNFTProgramInfo = async () => {};

export const getEarliestRecordIdForBlock = async () => {};

export const getLatestRecordFromBlockHeight = async () => {};

const RECORD_METADATA_PER_REQUEST = 5_000;
export const getRecordMetadata = async (
  startId: number,
  endId: number,
  includeTagged: boolean,
  recordsPerRequest?: number
) => {
  const client = getClient();
  const page = 0;
  const records = await client.request('records/metadata', {
    startId,
    endId,
    page,
    includeTagged,
    recordsPerRequest: recordsPerRequest || RECORD_METADATA_PER_REQUEST
  });

  return records as IRecordMetadata[];
};

export const getRecordsByTransitionAndIndex = async () => {};

export const getSerialNumbers = async () => {};

let programCache: { [key: string]: string } = {};
export async function getProgram() {}

export interface ILog {
  level: string;
  message: string;
  meta: object;
}

export const sendLog = async (log: ILog) => {};

export const getChainStatus = async () => {};

export const getClient = () => {
  const client = new JSONRPCClient((jsonRPCRequest: any) =>
    fetch('http://localhost:3000', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ ...jsonRPCRequest })
    }).then((response: any) => {
      if (response.status === 200) {
        // Use client.receive when you received a JSON-RPC response.
        return response.json().then((jsonRPCResponse: any) => client.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    })
  );

  return client;
};

export async function broadcastTransaction() {}

const transactionCache: { [key: string]: string } = {};

export async function getTransaction() {}

export async function getTransactionIdFromTransition() {
  return 'transactionId';
}

export async function getBondStateValue() {}

export async function getStakedBalanceRPC() {}

interface UnstakedBalance {
  balance: BigInt;
  readyToClaim: boolean;
}

export async function getUnstakedBalance() {}

export async function getMappingValue() {}

export async function getPublicBalance() {}

export async function getPublicBalanceForToken() {}

export interface RegisteredToken {
  token_id: string;
  name: string;
  symbol: string;
  decimals: string;
  supply: string;
  max_supply: string;
  admin: string;
  external_authorization_required: string;
  external_authorization_party: string;
}

export async function getRegisteredToken() {}

export const getPublicNfts = async () => {};

export const getProvingFileS3Url = async () => {};

export const MAX_TX_PER_REQUEST = 100_000;
export const getPublicTransactionsForAddress = async () => {};

export const delegateTransaction = async () => {};

export const delegateDeployTransaction = async () => {};

export const delegateDeployment = async () => {};

type GeneratedTransactionResponse = {
  transaction: string;
  status: string;
  error: string;
  updated_at: string;
};

export const getDelegatedTransaction = async () => {};

type GeneratedDeploymentResponse = {
  deployment: string;
  status: string;
  error: string;
  updated_at: string;
};

export const getDelegatedDeployment = async () => {};

export const pollDelegatedTransaction = async () => {};

export const pollDelegatedDeployment = async () => {};

export const tagRecord = async () => {};
