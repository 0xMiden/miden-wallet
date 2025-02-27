import { useCallback } from 'react';

import { fetchFromStorage, putToStorage, useStorage } from '../front';
import { MidenClientInterface } from '../sdk/miden-client-interface';

const IMPORT_NOTES_KEY = 'miden-notes-pending-import';
const OUTPUT_NOTES_KEY = 'miden-export-note-ids';

export const useImportNotes = (): [string[], () => void] => {
  const [queuedImports, setImportNotes] = useStorage<string[]>(IMPORT_NOTES_KEY, []);

  const importAllNotes = useCallback(async () => {
    const midenClient = await MidenClientInterface.create();
    queuedImports.forEach(async noteBytes => {
      const byteArray = new Uint8Array(Buffer.from(noteBytes, 'base64'));
      await midenClient.importNoteBytes(byteArray);
    });
    setImportNotes([]);
  }, [setImportNotes, queuedImports]);

  return [queuedImports, importAllNotes];
};

export const queueNoteImport = async (noteBytes: string) => {
  const queuedImports = await fetchFromStorage(IMPORT_NOTES_KEY);
  await putToStorage(IMPORT_NOTES_KEY, [...queuedImports, noteBytes]);
};

export const useExportNotes = (): string[] => {
  const [exportedNotes] = useStorage<string[]>(OUTPUT_NOTES_KEY, []);

  return exportedNotes;
};

export const regiserOutputNote = async (noteId: string) => {
  const outputNotes = await fetchFromStorage(OUTPUT_NOTES_KEY);
  await putToStorage(OUTPUT_NOTES_KEY, [...outputNotes, noteId]);
};
