import { useCallback } from 'react';

import { useExportNote } from '@miden-sdk/react';

import { fetchFromStorage, putToStorage, useStorage } from '../front';
import { withSdkLock } from '../sdk-bridge/wasmLock';
import { getMidenClient } from '../sdk/miden-client';

const IMPORT_NOTES_KEY = 'miden-notes-pending-import';
const OUTPUT_NOTES_KEY = 'miden-export-note-ids';

export const queueNoteImport = async (noteBytes: string) => {
  const queuedImports = (await fetchFromStorage<string[]>(IMPORT_NOTES_KEY)) || [];
  await putToStorage(IMPORT_NOTES_KEY, [...queuedImports, noteBytes]);
};

export const importAllNotes = async () => {
  const queuedImports: string[] = (await fetchFromStorage<string[]>(IMPORT_NOTES_KEY)) || [];
  if (queuedImports.length === 0) {
    return;
  }
  // Use SDK lock for WASM client access (importAllNotes is called outside React)
  await withSdkLock(async () => {
    const midenClient = await getMidenClient();
    for (const noteBytes of queuedImports) {
      const byteArray = new Uint8Array(Buffer.from(noteBytes, 'base64'));
      await midenClient.importNoteBytes(byteArray);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    await midenClient.syncState();
  });
  await putToStorage(IMPORT_NOTES_KEY, []);
};

export interface NoteDownload {
  noteId: string;
  downloadUrl: string;
}

export const useExportNotes = (): [string[], () => Promise<void>] => {
  const [exportedNotes] = useStorage<string[]>(OUTPUT_NOTES_KEY, []);
  const { exportNote } = useExportNote();

  const downloadAll = useCallback(async () => {
    for (const noteId of exportedNotes) {
      try {
        const noteBytes = await exportNote(noteId);

        const blob = new Blob([noteBytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `midenNote${noteId.slice(0, 6)}.mno`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to export note:', noteId, err);
      }
    }
    await putToStorage(OUTPUT_NOTES_KEY, []);
  }, [exportedNotes, exportNote]);

  return [exportedNotes, downloadAll];
};

export const registerOutputNote = async (noteId: string) => {
  const outputNotes = (await fetchFromStorage<string[]>(OUTPUT_NOTES_KEY)) || [];
  await putToStorage(OUTPUT_NOTES_KEY, [...outputNotes, noteId]);
};
