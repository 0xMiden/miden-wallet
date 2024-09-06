import assert from 'assert';
import { Page } from 'puppeteer';

export async function checkLocalStorageForRestrictedValues(restrictedValues: string[], page: Page) {
  const { keys, values } = await page.evaluate(() => {
    const keys = Object.keys(window.localStorage);
    const values = keys.map(key => window.localStorage.getItem(key));
    return { keys, values };
  });

  const keysString = keys.join('');
  const valuesString = values.join('');

  const restrictedValuesInLocalStorage = restrictedValues.filter(
    value => valuesString.includes(value) || keysString.includes(value)
  );
  assert(
    restrictedValuesInLocalStorage.length === 0,
    `Restricted values found in local storage: ${restrictedValuesInLocalStorage.join(', ')}`
  );

  return page;
}

export async function checkChromeStorageForRestrictedValues(restrictedValues: string[], page: Page) {
  const storageData = await page.evaluate(async () => {
    const allData = await (window as any).chrome.storage.local.get();
    return allData;
  });

  const storageJson = JSON.stringify(storageData);
  const restrictedValuesInStorage = restrictedValues.filter(value => storageJson.includes(value));
  assert(
    restrictedValuesInStorage.length === 0,
    `Restricted values found in chrome storage: ${restrictedValuesInStorage.join(', ')}`
  );

  return page;
}

export async function checkIndexedDBForRestrictedValues(restrictedValues: string[], page: Page) {
  // Evaluate a function in the context of the page to dump indexedDB data
  const indexedDBDump = await page.evaluate(async () => {
    async function openDatabase(databaseName: string): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open(databaseName);
        dbRequest.onsuccess = (event: any) => {
          resolve(event.target.result);
        };
        dbRequest.onerror = (event: any) => {
          reject(event.target.error);
        };
      });
    }

    async function getObjectStoreNames(database: IDBDatabase): Promise<string[]> {
      return Array.from(database.objectStoreNames);
    }

    async function getAllRecords(database: IDBDatabase, objectStoreName: string): Promise<any[]> {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(objectStoreName, 'readonly');
        const objectStore = transaction.objectStore(objectStoreName);
        const request = objectStore.getAll();

        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };

        request.onerror = (event: any) => {
          reject(event.target.error);
        };
      });
    }

    async function createIndexedDbDump(): Promise<DatabaseData> {
      const databases = await indexedDB.databases();
      const dataDump: DatabaseData = {};

      for (const { name: dbName } of databases) {
        dataDump[dbName!] = {};
        const db = await openDatabase(dbName!);
        const objectStoreNames = await getObjectStoreNames(db);

        for (const objectStoreName of objectStoreNames) {
          dataDump[dbName!][objectStoreName] = await getAllRecords(db, objectStoreName);
        }
      }

      return dataDump;
    }

    return await createIndexedDbDump();
  });
  const indexedDBJson = JSON.stringify(indexedDBDump);
  const restrictedValuesInIndexedDB = restrictedValues.filter(value => indexedDBJson.includes(value));
  assert(
    restrictedValuesInIndexedDB.length === 0,
    `Restricted values found in indexedDB: ${restrictedValuesInIndexedDB.join(', ')}`
  );

  return page;
}

type DatabaseData = {
  [dbName: string]: {
    [objectStoreName: string]: any[];
  };
};
