import React, { ChangeEvent } from 'react';

import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import { TextArea } from 'components/TextArea';
import {
  createFaucet,
  createNewMintTransaction,
  exportNote,
  fetchCacheAccountAuth,
  syncState
} from 'lib/miden/sdk/miden-client-interface';
import { NoteType } from '@demox-labs/miden-sdk';
import { NoteExportType } from 'lib/miden/sdk/constants';

export interface SelectRecipientProps {
  address?: string;
  onGoBack: () => void;
  onGoNext: () => void;
  onAddressChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
}

export const SelectRecipient: React.FC<SelectRecipientProps> = ({
  onGoBack,
  onGoNext,
  address,
  onAddressChange,
  onClear
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <NavigationHeader title="Recipient" onBack={onGoBack} />
      <div className="flex flex-col flex-1 p-4 md:w-[460px] md:mx-auto">
        <div className="flex-1 flex flex-col justify-stretch gap-y-2">
          <div className="relative">
            <TextArea
              placeholder={'Recipient Address'}
              className="w-full pr-10"
              value={address}
              onChange={onAddressChange}
            />
            {address && (
              <button
                type="button"
                onClick={onClear}
                className="absolute top-0 right-0 mt-3 mr-3 "
                aria-label="Clear text"
              >
                <Icon name={IconName.CloseCircle} fill="black" size="md" />
              </button>
            )}
          </div>
        </div>
        <div>
          <Button
            onClick={async () => {
              const faucet = await createFaucet();
              console.log('syncing state');
              await syncState();
              console.log('synced state');

              await fetchCacheAccountAuth(faucet);

              const mintTxn = await createNewMintTransaction('PUB KEY', faucet, NoteType.private(), BigInt(100));

              const noteId = mintTxn.created_notes().notes()[0].id().to_string();

              console.log('exporting note...');
              const noteBytes = await exportNote(noteId, NoteExportType.PARTIAL);

              const blob = new Blob([noteBytes], { type: 'application/octet-stream' });

              // Create a URL for the Blob
              const url = URL.createObjectURL(blob);

              // Create a temporary anchor element
              const a = document.createElement('a');
              a.href = url;
              a.download = 'exportNoteTest.mno'; // Specify the file name

              // Append the anchor to the document
              document.body.appendChild(a);

              // Programmatically click the anchor to trigger the download
              a.click();

              // Remove the anchor from the document
              document.body.removeChild(a);

              // Revoke the object URL to free up resources
              URL.revokeObjectURL(url);
            }}
            hidden={false}
          >
            Debugging Miden Button
          </Button>
        </div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={'Cancel'} variant={ButtonVariant.Secondary} onClick={() => {}} />
          <Button
            className="flex-1"
            title={'Next'}
            variant={ButtonVariant.Primary}
            disabled={false}
            onClick={onGoNext}
          />
        </div>
      </div>
    </div>
  );
};
