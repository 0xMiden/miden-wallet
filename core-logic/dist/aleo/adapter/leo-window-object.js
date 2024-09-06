var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from '@demox-labs/aleo-wallet-adapter-base';
import { requestDecrypt, requestPermission, requestSign, requestRecords, requestTransaction, requestExecution, requestBulkTransactions, requestDeploy, transactionStatus, getExecution, requestRecordPlaintexts, requestTransactionHistory, requestDisconnect, onPermissionChange, isAvailable } from './client';
export class LeoWindowObject extends EventEmitter {
    isAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield isAvailable();
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageString = new TextDecoder().decode(message);
            const signature = yield requestSign(this.publicKey, messageString);
            return { signature: new TextEncoder().encode(signature) };
        });
    }
    decrypt(cipherText, tpk, programId, functionName, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestDecrypt(this.publicKey, cipherText, tpk, programId, functionName, index);
            return { text: res };
        });
    }
    requestRecords(program) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestRecords(this.publicKey, program);
            return { records: res };
        });
    }
    requestTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestTransaction(this.publicKey, transaction);
            return { transactionId: res };
        });
    }
    requestExecution(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestExecution(this.publicKey, transaction);
            return { transactionId: res };
        });
    }
    requestBulkTransactions(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestBulkTransactions(this.publicKey, transaction);
            return { transactionIds: res };
        });
    }
    requestDeploy(deployment) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestDeploy(this.publicKey, deployment);
            return { transactionId: res };
        });
    }
    transactionStatus(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield transactionStatus(this.publicKey, transactionId);
            return { status: res };
        });
    }
    getExecution(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield getExecution(this.publicKey, transactionId);
            return { execution: res };
        });
    }
    requestRecordPlaintexts(program) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestRecordPlaintexts(this.publicKey, program);
            return { records: res };
        });
    }
    requestTransactionHistory(program) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield requestTransactionHistory(this.publicKey, program);
            return { transactions: res };
        });
    }
    connect(decryptPermission, network, programs) {
        return __awaiter(this, void 0, void 0, function* () {
            const perm = yield requestPermission({ name: window.location.hostname }, false, decryptPermission, network, programs);
            this.permission = perm;
            this.publicKey = perm.publicKey;
            this.network = network;
            this.clearAccountChangeInterval = onPermissionChange((perm) => {
                this.emit('accountChange', perm);
            });
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield requestDisconnect();
            this.publicKey = undefined;
            this.permission = undefined;
            this.clearAccountChangeInterval && this.clearAccountChangeInterval();
        });
    }
}
