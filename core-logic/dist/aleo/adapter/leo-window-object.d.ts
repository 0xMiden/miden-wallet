import { EventEmitter, WalletAdapterNetwork, DecryptPermission, AleoTransaction, AleoDeployment } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWallet, LeoWalletEvents } from '@demox-labs/aleo-wallet-adapter-leo';
import { AleoDAppPermission } from './types';
export declare class LeoWindowObject extends EventEmitter<LeoWalletEvents> implements LeoWallet {
    publicKey?: string | undefined;
    permission?: AleoDAppPermission | undefined;
    appName?: string | undefined;
    network?: WalletAdapterNetwork | undefined;
    private clearAccountChangeInterval?;
    isAvailable(): Promise<boolean>;
    signMessage(message: Uint8Array): Promise<{
        signature: Uint8Array;
    }>;
    decrypt(cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number): Promise<{
        text: string;
    }>;
    requestRecords(program: string): Promise<{
        records: any[];
    }>;
    requestTransaction(transaction: AleoTransaction): Promise<{
        transactionId?: string | undefined;
    }>;
    requestExecution(transaction: AleoTransaction): Promise<{
        transactionId?: string | undefined;
    }>;
    requestBulkTransactions(transaction: AleoTransaction[]): Promise<{
        transactionIds?: string[] | undefined;
    }>;
    requestDeploy(deployment: AleoDeployment): Promise<{
        transactionId?: string | undefined;
    }>;
    transactionStatus(transactionId: string): Promise<{
        status: string;
    }>;
    getExecution(transactionId: string): Promise<{
        execution: any;
    }>;
    requestRecordPlaintexts(program: string): Promise<{
        records: any[];
    }>;
    requestTransactionHistory(program: string): Promise<{
        transactions: any[];
    }>;
    connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork, programs?: string[]): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=leo-window-object.d.ts.map