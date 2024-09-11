import { spawn, Thread, Transfer, Worker } from 'threads';

import { ITransition } from 'lib/miden/db/transaction-types';
import { TransactionBuilder } from 'workers/buildTransaction';

export const synthesizeKeys = async (
  chainId: string,
  program: string,
  functionName: string,
  imports: { [key: string]: string }
) => {
  const transactionBuilder = await spawn<TransactionBuilder>(new Worker('./buildTransaction.js'));
  try {
    // const keys = await transactionBuilder.synthesizeKeys(chainId, program, functionName, imports);
    await Thread.terminate(transactionBuilder);
    return [];
  } catch (e) {
    await Thread.terminate(transactionBuilder);
    throw e;
  }
};

export const buildAuthorization = async (
  chainId: string,
  transition: ITransition,
  feeTransition: ITransition,
  authorization: string,
  feeAuthorization: string | undefined,
  imports: { [key: string]: string }
) => {
  // Prepare inputs
  const { program, functionName } = transition;

  // Get Key Files
  // Create transaction builder worker
  const transactionBuilder = await spawn<TransactionBuilder>(new Worker('./buildTransaction.js'));

  try {
    // Load Keys

    // Create transition

    // Destroy Thread
    await Thread.terminate(transactionBuilder);

    return {};
  } catch (e) {
    // Destroy Thread
    await Thread.terminate(transactionBuilder);
    throw e;
  }
};

export const buildTransaction = async (
  chainId: string,
  transition: ITransition,
  feeTransition: ITransition,
  accPrivateKey: string,
  imports: { [key: string]: string }
) => {
  // Prepare inputs
  const { program, functionName, inputsJson } = transition;
  const { inputsJson: feeInputsJson } = feeTransition;

  // Get Key Files

  // Create transaction builder worker
  const transactionBuilder = await spawn<TransactionBuilder>(new Worker('./buildTransaction.js'));

  try {
    // Load Keys

    // Fee inputs
    const feeInputs = JSON.parse(feeInputsJson);
    const feeAmountInput = feeTransition.functionName === 'fee_private' ? feeInputs[1] : feeInputs[0];
    const feeAmount = parseInt(feeAmountInput.slice(0, -3)) / 1_000_000;

    // Create transition
    const feeRecord = feeTransition.functionName === 'fee_private' ? feeInputs[0] : undefined;

    await Thread.terminate(transactionBuilder);

    return {};
  } catch (e) {
    await Thread.terminate(transactionBuilder);
    throw e;
  }
};

export const buildExecution = async (
  chainId: string,
  transition: ITransition,
  accPrivateKey: string,
  imports: { [key: string]: string }
) => {
  // Prepare inputs
  const { program, functionName, inputsJson } = transition;

  // Get Key Files

  // Create transaction builder worker
  const transactionBuilder = await spawn<TransactionBuilder>(new Worker('./buildTransaction.js'));

  try {
    // Load Keys

    // Create transition

    // Destroy Thread
    await Thread.terminate(transactionBuilder);

    return {};
  } catch (e) {
    // Destroy Thread
    await Thread.terminate(transactionBuilder);
    throw e;
  }
};

export const generateDeployment = async (
  chainId: string,
  program: string,
  feeTransition: ITransition,
  accPrivateKey: string,
  imports: { [key: string]: string }
) => {
  // Prepare inputs
  const { inputsJson: feeInputsJson } = feeTransition;

  // Get Key Files

  // Get Key Files

  // Create transaction builder worker
  const transactionBuilder = await spawn<TransactionBuilder>(new Worker('./buildTransaction.js'));

  try {
    // Load Keys

    // Fee inputs
    const feeInputs = JSON.parse(feeInputsJson);
    const feeAmountInput = feeTransition.functionName === 'fee_private' ? feeInputs[1] : feeInputs[0];
    const feeAmount = parseInt(feeAmountInput.slice(0, -3)) / 1_000_000;
    const feeRecord = feeTransition.functionName === 'fee_private' ? feeInputs[0] : undefined;

    // Create transition

    // Destroy Thread
    await Thread.terminate(transactionBuilder);

    // Return Intermediate Transaction
    return {};
  } catch (e) {
    // Destroy Thread
    await Thread.terminate(transactionBuilder);
    throw e;
  }
};
