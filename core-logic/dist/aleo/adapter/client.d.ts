import { WalletAdapterNetwork, DecryptPermission, AleoTransaction, AleoDeployment } from '@demox-labs/aleo-wallet-adapter-base';
import { AleoDAppMetadata, AleoDAppPermission } from './types';
export declare function isAvailable(): Promise<boolean>;
export declare function onAvailabilityChange(callback: (available: boolean) => void): () => void;
export declare function onPermissionChange(callback: (permission: AleoDAppPermission) => void): () => void;
export declare function getCurrentPermission(): Promise<AleoDAppPermission>;
export declare function requestPermission(appMeta: AleoDAppMetadata, force: boolean, decryptPermission: DecryptPermission, network: WalletAdapterNetwork, programs?: string[]): Promise<{
    rpc: string;
    publicKey: string;
    decryptPermission: DecryptPermission;
    programs: string[] | undefined;
}>;
export declare function requestDisconnect(): Promise<import("./types").AleoDAppDisconnectResponse>;
export declare function requestSign(sourcePublicKey: string, payload: string): Promise<string>;
export declare function requestDecrypt(sourcePublicKey: string, cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number): Promise<string>;
export declare function requestRecords(sourcePublicKey: string, program: string): Promise<any[]>;
export declare function requestTransaction(sourcePublicKey: string, transaction: AleoTransaction): Promise<string | undefined>;
export declare function requestExecution(sourcePublicKey: string, transaction: AleoTransaction): Promise<string | undefined>;
export declare function requestBulkTransactions(sourcePublicKey: string, transactions: AleoTransaction[]): Promise<string[] | undefined>;
export declare function requestDeploy(sourcePublicKey: string, deployment: AleoDeployment): Promise<string>;
export declare function transactionStatus(sourcePublicKey: string, transactionId: string): Promise<string>;
export declare function getExecution(sourcePublicKey: string, transactionId: string): Promise<string>;
export declare function requestRecordPlaintexts(sourcePublicKey: string, program: string): Promise<any[]>;
export declare function requestTransactionHistory(sourcePublicKey: string, program: string): Promise<any[]>;
export declare function assertResponse(condition: any): asserts condition;
export declare class AleoWalletError implements Error {
    name: string;
    message: string;
}
export declare class NotGrantedAleoWalletError extends AleoWalletError {
    name: string;
    message: string;
}
export declare class NotFoundAleoWalletError extends AleoWalletError {
    name: string;
    message: string;
}
export declare class InvalidParamsAleoWalletError extends AleoWalletError {
    name: string;
    message: string;
}
//# sourceMappingURL=client.d.ts.map