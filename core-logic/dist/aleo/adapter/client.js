var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { nanoid } from 'nanoid';
import { AleoDAppErrorType, AleoDAppMessageType, AleoPageMessageType } from './types';
export function isAvailable() {
    return new Promise(resolve => {
        const handleMessage = (evt) => {
            var _a, _b;
            if (evt.source === window && ((_a = evt.data) === null || _a === void 0 ? void 0 : _a.type) === AleoPageMessageType.Response && ((_b = evt.data) === null || _b === void 0 ? void 0 : _b.payload) === 'PONG') {
                done(true);
            }
        };
        const done = (result) => {
            resolve(result);
            window.removeEventListener('message', handleMessage);
            clearTimeout(t);
        };
        send({
            type: AleoPageMessageType.Request,
            payload: 'PING'
        });
        window.addEventListener('message', handleMessage);
        const t = setTimeout(() => done(false), 500);
    });
}
export function onAvailabilityChange(callback) {
    let t;
    let currentStatus = false;
    const check = (...args_1) => __awaiter(this, [...args_1], void 0, function* (attempt = 0) {
        const initial = attempt < 5;
        const available = yield isAvailable();
        if (currentStatus !== available) {
            callback(available);
            currentStatus = available;
        }
        t = setTimeout(check, available ? 10000 : !initial ? 5000 : 0, initial ? attempt + 1 : attempt);
    });
    check();
    return () => clearTimeout(t);
}
export function onPermissionChange(callback) {
    let t;
    let currentPerm = null;
    const check = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const perm = yield getCurrentPermission();
            if (!permissionsAreEqual(perm, currentPerm)) {
                callback(perm);
                currentPerm = perm;
            }
        }
        catch (_a) { }
        t = setTimeout(check, 10000);
    });
    check();
    return () => clearTimeout(t);
}
export function getCurrentPermission() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.GetCurrentPermissionRequest
        });
        assertResponse(res.type === AleoDAppMessageType.GetCurrentPermissionResponse);
        return res.permission;
    });
}
export function requestPermission(appMeta, force, decryptPermission, network, programs) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.PermissionRequest,
            appMeta,
            force,
            decryptPermission,
            network,
            programs
        });
        assertResponse(res.type === AleoDAppMessageType.PermissionResponse);
        return {
            rpc: res.network,
            publicKey: res.publicKey,
            decryptPermission: res.decryptPermission,
            programs: res.programs
        };
    });
}
export function requestDisconnect() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.DisconnectRequest
        });
        assertResponse(res.type === AleoDAppMessageType.DisconnectResponse);
        return res;
    });
}
export function requestSign(sourcePublicKey, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.SignRequest,
            sourcePublicKey,
            payload
        });
        assertResponse(res.type === AleoDAppMessageType.SignResponse);
        return res.signature;
    });
}
export function requestDecrypt(sourcePublicKey, cipherText, tpk, programId, functionName, index) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.DecryptRequest,
            sourcePublicKey,
            cipherText,
            tpk,
            programId,
            functionName,
            index
        });
        assertResponse(res.type === AleoDAppMessageType.DecryptResponse);
        return res.plainText;
    });
}
export function requestRecords(sourcePublicKey, program) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.RecordsRequest,
            sourcePublicKey,
            program
        });
        assertResponse(res.type === AleoDAppMessageType.RecordsResponse);
        return res.records;
    });
}
export function requestTransaction(sourcePublicKey, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.TransactionRequest,
            sourcePublicKey,
            transaction
        });
        assertResponse(res.type === AleoDAppMessageType.TransactionResponse);
        return res.transactionId;
    });
}
export function requestExecution(sourcePublicKey, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.ExecutionRequest,
            sourcePublicKey,
            transaction
        });
        assertResponse(res.type === AleoDAppMessageType.ExecutionResponse);
        return res.transactionId;
    });
}
export function requestBulkTransactions(sourcePublicKey, transactions) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.BulkTransactionsRequest,
            sourcePublicKey,
            transactions
        });
        assertResponse(res.type === AleoDAppMessageType.BulkTransactionsResponse);
        return res.transactionIds;
    });
}
export function requestDeploy(sourcePublicKey, deployment) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.DeployRequest,
            sourcePublicKey,
            deployment
        });
        assertResponse(res.type === AleoDAppMessageType.DeployResponse);
        return res.transactionId;
    });
}
export function transactionStatus(sourcePublicKey, transactionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.TransactionStatusRequest,
            sourcePublicKey,
            transactionId
        });
        assertResponse(res.type === AleoDAppMessageType.TransactionStatusResponse);
        return res.status;
    });
}
export function getExecution(sourcePublicKey, transactionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.GetExecutionRequest,
            sourcePublicKey,
            transactionId
        });
        assertResponse(res.type === AleoDAppMessageType.GetExecutionResponse);
        return res.execution;
    });
}
export function requestRecordPlaintexts(sourcePublicKey, program) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.RecordPlaintextsRequest,
            sourcePublicKey,
            program
        });
        assertResponse(res.type === AleoDAppMessageType.RecordPlaintextsResponse);
        return res.records;
    });
}
export function requestTransactionHistory(sourcePublicKey, program) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield request({
            type: AleoDAppMessageType.TransactionHistoryRequest,
            sourcePublicKey,
            program
        });
        assertResponse(res.type === AleoDAppMessageType.TransactionHistoryResponse);
        return res.transactions;
    });
}
function request(payload) {
    return new Promise((resolve, reject) => {
        const reqId = nanoid();
        const handleMessage = (evt) => {
            const res = evt.data;
            switch (true) {
                case evt.source !== window || (res === null || res === void 0 ? void 0 : res.reqId) !== reqId:
                    return;
                case (res === null || res === void 0 ? void 0 : res.type) === AleoPageMessageType.Response:
                    resolve(res.payload);
                    window.removeEventListener('message', handleMessage);
                    break;
                case (res === null || res === void 0 ? void 0 : res.type) === AleoPageMessageType.ErrorResponse:
                    reject(createError(res.payload));
                    window.removeEventListener('message', handleMessage);
                    break;
            }
        };
        send({
            type: AleoPageMessageType.Request,
            payload,
            reqId
        });
        window.addEventListener('message', handleMessage);
    });
}
function permissionsAreEqual(aPerm, bPerm) {
    if (aPerm === null)
        return bPerm === null;
    return aPerm.publicKey === (bPerm === null || bPerm === void 0 ? void 0 : bPerm.publicKey) && aPerm.rpc === (bPerm === null || bPerm === void 0 ? void 0 : bPerm.rpc);
}
function createError(payload) {
    console.log('Error: ', payload);
    switch (true) {
        case payload === AleoDAppErrorType.NotGranted:
            return new NotGrantedAleoWalletError();
        case payload === AleoDAppErrorType.NotFound:
            return new NotFoundAleoWalletError();
        case payload === AleoDAppErrorType.InvalidParams:
            return new InvalidParamsAleoWalletError();
        default:
            return new AleoWalletError();
    }
}
export function assertResponse(condition) {
    if (!condition) {
        throw new Error('Invalid response recieved');
    }
}
function send(msg) {
    window.postMessage(msg, '*');
}
export class AleoWalletError {
    constructor() {
        this.name = 'AleoWalletError';
        this.message = 'An unknown error occured. Please try again or report it';
    }
}
export class NotGrantedAleoWalletError extends AleoWalletError {
    constructor() {
        super(...arguments);
        this.name = 'NotGrantedAleoWalletError';
        this.message = 'Permission Not Granted';
    }
}
export class NotFoundAleoWalletError extends AleoWalletError {
    constructor() {
        super(...arguments);
        this.name = 'NotFoundAleoWalletError';
        this.message = 'Account Not Found. Try connect again';
    }
}
export class InvalidParamsAleoWalletError extends AleoWalletError {
    constructor() {
        super(...arguments);
        this.name = 'InvalidParamsAleoWalletError';
        this.message = 'Some of the parameters you provided are invalid';
    }
}
