import { useCallback } from 'react';

import { fetchFromStorage, putToStorage, useStorage } from '../front';
import { NoteExportType } from '../sdk/constants';
import { MidenClientInterface } from '../sdk/miden-client-interface';

const IMPORT_NOTES_KEY = 'miden-notes-pending-import';
const OUTPUT_NOTES_KEY = 'miden-export-note-ids';

export const queueNoteImport = async (noteBytes: string) => {
  const queuedImports = (await fetchFromStorage(IMPORT_NOTES_KEY)) || [];
  await putToStorage(IMPORT_NOTES_KEY, [...queuedImports, noteBytes]);
};

export const importAllNotes = async () => {
  const queuedImports: string[] = (await fetchFromStorage(IMPORT_NOTES_KEY)) || [];
  if (queuedImports.length === 0) {
    return;
  }
  const midenClient = await MidenClientInterface.create();
  const imports = queuedImports.map(async noteBytes => {
    const byteArray = new Uint8Array(Buffer.from(noteBytes, 'base64'));
    await midenClient.importNoteBytes(byteArray);
  });
  await Promise.all(imports);
  await new Promise(resolve => setTimeout(resolve, 2000));
  await midenClient.syncState();
  await putToStorage(IMPORT_NOTES_KEY, []);
};

export interface NoteDownload {
  noteId: string;
  downloadUrl: string;
}

export const useExportNotes = (): [string[], () => Promise<void>] => {
  const [exportedNotes] = useStorage<string[]>(OUTPUT_NOTES_KEY, []);

  const downloadAll = useCallback(async () => {
    const midenClient = await MidenClientInterface.create();
    const noteExportPromises = exportedNotes.map(async noteId => {
      const noteBytes = await midenClient.exportNote(noteId, NoteExportType.DETAILS);
      const blob = new Blob([noteBytes], { type: 'application/octet-stream' });
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = `midenNote${noteId.slice(0, 6)}.mno`; // Specify the file name

      // Append the anchor to the document
      document.body.appendChild(a);

      // Programmatically click the anchor to trigger the download
      a.click();

      // Remove the anchor from the document
      document.body.removeChild(a);

      // Revoke the object URL to free up resources
      URL.revokeObjectURL(url);
    });
    await Promise.all(noteExportPromises);
    await putToStorage(OUTPUT_NOTES_KEY, []);
  }, [exportedNotes]);

  return [exportedNotes, downloadAll];
};

export const registerOutputNote = async (noteId: string) => {
  const outputNotes = (await fetchFromStorage(OUTPUT_NOTES_KEY)) || [];
  await putToStorage(OUTPUT_NOTES_KEY, [...outputNotes, noteId]);
};
