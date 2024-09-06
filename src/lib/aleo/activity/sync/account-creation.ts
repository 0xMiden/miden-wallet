import * as Repo from 'lib/aleo/repo';

const MAX_RECORD_ID_SYNC_ATTEMPTS = 3;
const associatedRecordIdSyncKey = 'associatedRecordIdSync';

/**
 * Method has general boilerplate for setting account creation info. There is some
 * logic to handle retries for getLatestRecordFromBlockHeight failure, allowing retries but
 * limiting the retries within the session.
 *
 * The reason behind this logic is that we want to greedily try to get the user's associatedRecordId
 * while also not rate-limiting them from the RPC within the session.
 * This is because having the associatedRecordId will dramatically improve the sync speed for the user,
 * and unless the RPC is bugged or down the user should ideally always have an associatedRecordId for
 * their blockHeight.
 *
 * There is a small edge case where a user could have a blockHeight so early that there is no previous record,
 * but desiging around that edge case is not worth the complexity / effort.
 */
export async function setAccountCreationMetadata(address: string, blockHeight: number): Promise<void> {
  const existingAccountCreationBlockHeight = await Repo.accountCreationBlockHeights.get({ address });

  if (existingAccountCreationBlockHeight === undefined) {
    let latestRecordId = 0;
    try {
    } catch (e) {
      // intentionally swallowing errors
    }

    // Adds both the creation height info and an implicit sync record from genesis to "now" aka the latestRecordId
    await Repo.accountCreationBlockHeights.add({ address, blockHeight, associatedRecordId: latestRecordId });
    await Repo.recordIdSyncs.add({
      address,
      startId: 0, // inclusive
      endId: latestRecordId // exclusive
    });
  }
  // If the associatedRecordId is 0, the last sync may have failed to retrieve the latest record id
  else if (existingAccountCreationBlockHeight?.associatedRecordId === 0) {
    // Prevents the sync from occurring more than MAX times per session
    const syncAttempt = Number(sessionStorage.getItem(associatedRecordIdSyncKey) ?? 0);
    if (syncAttempt >= MAX_RECORD_ID_SYNC_ATTEMPTS) {
      return;
    }

    try {
    } catch (e) {
      console.info('Failed to get the latest record from block height:\n', e);
    }

    sessionStorage.setItem('associatedRecordIdSync', `${syncAttempt + 1}`);
  }
}

export async function getAccountCreationRecordId(address: string): Promise<number> {
  const accountCreation = await Repo.accountCreationBlockHeights.get({ address });

  return accountCreation?.associatedRecordId ?? 0;
}
