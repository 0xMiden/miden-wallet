import { Runtime } from 'webextension-polyfill';

import * as Actions from 'lib/miden/back/actions';
import * as Analytics from 'lib/miden/back/analytics';
import { intercom } from 'lib/miden/back/defaults';
import { store, toFront } from 'lib/miden/back/store';

const frontStore = store.map(toFront);

export async function start() {
  intercom.onRequest(processRequest);
  await Actions.init();
  frontStore.watch(() => {
    // intercom.broadcast({ type: AleoMessageType.StateUpdated });
  });
}

async function processRequest(port: Runtime.Port) {
  // switch (req?.type) {
  //   case AleoMessageType.SendTrackEventRequest:
  //     await Analytics.trackEvent(req);
  //     return { type: AleoMessageType.SendTrackEventResponse };
  //   case AleoMessageType.SendPageEventRequest:
  //     await Analytics.pageEvent(req);
  //     return { type: AleoMessageType.SendPageEventResponse };
  //   case AleoMessageType.SendPerformanceEventRequest:
  //     await Analytics.performanceEvent(req);
  //     return { type: AleoMessageType.SendPerformanceEventResponse };
  //   case AleoMessageType.GetStateRequest:
  //     const state = await Actions.getFrontState();
  //     return {
  //       type: AleoMessageType.GetStateResponse,
  //       state
  //     };
  //   case AleoMessageType.NewWalletRequest:
  //     await Actions.registerNewWallet(req.password, req.mnemonic, req.ownMnemonic);
  //     return { type: AleoMessageType.NewWalletResponse };
  //   case AleoMessageType.UnlockRequest:
  //     await Actions.unlock(req.password);
  //     return { type: AleoMessageType.UnlockResponse };
  //   case AleoMessageType.LockRequest:
  //     await Actions.lock();
  //     return { type: AleoMessageType.LockResponse };
  //   case AleoMessageType.CreateAccountRequest:
  //     await Actions.createHDAccount(req.name);
  //     return { type: AleoMessageType.CreateAccountResponse };
  //   case AleoMessageType.DecryptCiphertextsRequest:
  //     const texts = await Actions.decryptCiphertexts(req.accPublicKey, req.ciphertexts);
  //     return { type: AleoMessageType.DecryptCiphertextsResponse, texts: texts };
  //   case AleoMessageType.UpdateCurrentAccountRequest:
  //     await Actions.updateCurrentAccount(req.accountPublicKey);
  //     return { type: AleoMessageType.UpdateCurrentAccountResponse };
  //   case AleoMessageType.RevealPublicKeyRequest:
  //     const publicKey = await Actions.revealPublicKey(req.accountPublicKey);
  //     return {
  //       type: AleoMessageType.RevealPublicKeyResponse,
  //       publicKey
  //     };
  //   case AleoMessageType.RevealViewKeyRequest:
  //     const viewKey = await Actions.revealViewKey(req.accountPublicKey, req.password);
  //     return {
  //       type: AleoMessageType.RevealViewKeyResponse,
  //       viewKey
  //     };
  //   case AleoMessageType.RevealPrivateKeyRequest:
  //     const privateKey = await Actions.revealPrivateKey(req.accountPublicKey, req.password);
  //     return {
  //       type: AleoMessageType.RevealPrivateKeyResponse,
  //       privateKey
  //     };
  //   case AleoMessageType.RevealMnemonicRequest:
  //     const mnemonic = await Actions.revealMnemonic(req.password);
  //     return {
  //       type: AleoMessageType.RevealMnemonicResponse,
  //       mnemonic
  //     };
  //   case AleoMessageType.RemoveAccountRequest:
  //     await Actions.removeAccount(req.accountPublicKey, req.password);
  //     return {
  //       type: AleoMessageType.RemoveAccountResponse
  //     };
  //   case AleoMessageType.EditAccountRequest:
  //     await Actions.editAccount(req.accountPublicKey, req.name);
  //     return {
  //       type: AleoMessageType.EditAccountResponse
  //     };
  //   case AleoMessageType.ImportAccountRequest:
  //     await Actions.importAccount(req.privateKey, req.encPassword);
  //     return {
  //       type: AleoMessageType.ImportAccountResponse
  //     };
  //   case AleoMessageType.ImportWatchOnlyAccountRequest:
  //     await Actions.importWatchOnlyAccount(req.viewKey);
  //     return {
  //       type: AleoMessageType.ImportWatchOnlyAccountResponse
  //     };
  //   case AleoMessageType.ImportMnemonicAccountRequest:
  //     await Actions.importMnemonicAccount(req.mnemonic, req.password, req.derivationPath);
  //     return {
  //       type: AleoMessageType.ImportMnemonicAccountResponse
  //     };
  //   case AleoMessageType.UpdateSettingsRequest:
  //     await Actions.updateSettings(req.settings);
  //     return {
  //       type: AleoMessageType.UpdateSettingsResponse
  //     };
  //   case AleoMessageType.AuthorizeRequest:
  //     const auth = await Actions.authorize(
  //       req.accPublicKey,
  //       req.program,
  //       req.functionName,
  //       req.inputs,
  //       req.feeCredits,
  //       req.feeRecord,
  //       req.imports
  //     );
  //     return {
  //       type: AleoMessageType.AuthorizeResponse,
  //       ...auth
  //     };
  //   case AleoMessageType.AuthorizeDeployRequest:
  //     const authDeploy = await Actions.authorizeDeploy(req.accPublicKey, req.deployment, req.feeCredits, req.feeRecord);
  //     return {
  //       type: AleoMessageType.AuthorizeDeployResponse,
  //       ...authDeploy
  //     };
  //   case AleoMessageType.DAppGetAllSessionsRequest:
  //     const allSessions = await Actions.getAllDAppSessions();
  //     return {
  //       type: AleoMessageType.DAppGetAllSessionsResponse,
  //       sessions: allSessions
  //     };
  //   case AleoMessageType.DAppRemoveSessionRequest:
  //     const sessions = await Actions.removeDAppSession(req.origin);
  //     return {
  //       type: AleoMessageType.DAppRemoveSessionResponse,
  //       sessions
  //     };
  //   case AleoMessageType.PageRequest:
  //     const dAppEnabled = await Actions.isDAppEnabled();
  //     if (dAppEnabled) {
  //       if (req.payload === 'PING') {
  //         return {
  //           type: AleoMessageType.PageResponse,
  //           payload: 'PONG'
  //         };
  //       }
  //       const resPayload = await Actions.processDApp(req.origin, req.payload);
  //       return {
  //         type: AleoMessageType.PageResponse,
  //         payload: resPayload ?? null
  //       };
  //     }
  //     break;
  //   case AleoMessageType.GetOwnedRecordsRequest:
  //     const records = await Actions.getOwnedRecords(req.accPublicKey);
  //     return {
  //       type: AleoMessageType.GetOwnedRecordsResponse,
  //       records
  //     };
  // }
}
