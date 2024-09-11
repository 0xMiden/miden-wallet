import React, { FC, useCallback } from 'react';

import classNames from 'clsx';
import { KeyedMutator } from 'swr';

import { Button } from 'app/atoms/Button';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { IKeyFile, keyFiles } from 'lib/miden/repo';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';

const DEFAULT_FILES_URL = 'https://aleo-public.s3.us-west-2.amazonaws.com/testnetbeta/DefaultFiles-5-21-24.zip';
const DEFAULT_FILES_NAME = 'DefaultFiles.zip';

const FileSettings: FC = () => {
  const { data, mutate } = useRetryableSWR<IKeyFile[]>(['getAllFiles'], fetchKeyFiles, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const { trackEvent } = useAnalytics();

  const files = data || [];
  const totalStorage = files.reduce((acc, { bytes }) => acc + bytes.length, 0);

  const uploadFile = useCallback(async () => {
    readFileAsUint8Array(saveKeyFile, mutate);
  }, [mutate]);

  const onClick = useCallback(() => {
    trackEvent('FileSettings/DownloadDefaultFiles', AnalyticsEventCategory.ButtonPress);
  }, [trackEvent]);

  return (
    <div className="w-full max-w-sm mx-auto my-4">
      <div
        className={classNames('w-full mb-1', 'leading-tight', 'flex flex-col', 'font-medium text-black')}
        style={{ fontSize: '14px', lineHeight: '20px' }}
      >
        {`${t('storageUsed')}`}
      </div>
      <div style={{ fontSize: '12px', lineHeight: '16px' }}>{`${formatBytes(totalStorage)}`}</div>

      <div className="w-full mt-6 overflow-scroll" style={{ maxHeight: '440px' }}>
        {files.map(file => (
          <FileEntry key={file.name} file={file} mutate={mutate} />
        ))}
      </div>
      <div className="w-full flex flex-col items-center justify-center align-center mt-6">
        <div className="w-full flex items-center">
          <Button
            className={classNames(
              'relative w-full',
              'rounded-lg border-2',
              'bg-primary-500 border-primary-purple',
              'flex justify-center',
              'font-medium',
              'transition duration-200 ease-in-out',
              'text-white'
            )}
            style={{
              padding: '12px 16px',
              fontSize: '16px',
              lineHeight: '24px'
            }}
            onClick={uploadFile}
            testID="FileSettings/UploadFile"
          >
            {t('uploadFile')}
          </Button>
        </div>
        <div
          className="flex items-center mt-6 text-black"
          style={{
            fontSize: '16px',
            lineHeight: '24px'
          }}
        >
          <a href={DEFAULT_FILES_URL} download={DEFAULT_FILES_NAME} onClick={onClick}>
            {t('downloadDefaultFiles')}
          </a>
        </div>
      </div>
    </div>
  );
};

const FileEntry: FC<{ file: IKeyFile; mutate: KeyedMutator<IKeyFile[]> }> = ({ file, mutate }) => {
  const download = useCallback(() => {
    downloadUint8Array(file.bytes, file.name, 'application/octet-stream');
  }, [file.bytes, file.name]);

  const remove = useCallback(async () => {
    await deleteKeyFile(file.name);
    mutate();
  }, [file.name, mutate]);

  return (
    <div className="flex items-center justify-between w-full py-2 text-black border-t border-gray-700">
      <div className="flex flex-col items-center w-2/3 mr-2 truncate py-2">
        <div className="w-full mb-1" style={{ fontSize: '12px', lineHeight: '16px' }}>
          {file.name}
        </div>
        <div className="w-full text-gray-200" style={{ fontSize: '12px', lineHeight: '16px' }}>
          {formatBytes(file.bytes.length)}
        </div>
      </div>
      <div className="flex justify-end w-1/6">
        <Button title={t('download')} className="cursor-pointer" testID="FileSettings/DownloadFile">
          <DownloadIcon stroke={'currentColor'} height={'24px'} width={'24px'} onClick={download} strokeWidth="2" />
        </Button>
      </div>
      <div className="flex justify-end w-1/6">
        <Button title={t('remove')} className="cursor-pointer" testID="FileSettings/RemoveFile">
          <CloseIcon stroke={'currentColor'} height={'24px'} width={'24px'} onClick={remove} strokeWidth="2" />
        </Button>
      </div>
    </div>
  );
};

export default FileSettings;

function formatBytes(bytes: number, decimals: number = 2): string {
  if (!+bytes) return '0 Bytes';

  const k: number = 1024;
  const dm: number = decimals < 0 ? 0 : decimals;
  const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i: number = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function downloadUint8Array(data: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

type FileReadCallback = (file: File, data: Uint8Array) => Promise<void>;

function readFileAsUint8Array(callback: FileReadCallback, mutate: KeyedMutator<IKeyFile[]>): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';

  input.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = async (e: ProgressEvent<FileReader>) => {
        if (e.target?.result instanceof ArrayBuffer) {
          const data = new Uint8Array(e.target.result);
          await callback(file, data);
          mutate();
        }
      };

      reader.readAsArrayBuffer(file);
    }
  });

  document.body.appendChild(input);
  input.click();

  setTimeout(() => {
    document.body.removeChild(input);
  }, 100);
}

async function saveKeyFile(file: File, bytes: Uint8Array): Promise<void> {
  await keyFiles.put({
    name: file.name,
    bytes,
    sourceType: 'uploaded',
    lastUsed: Date.now()
  });
}

async function deleteKeyFile(name: string): Promise<void> {
  await keyFiles.delete(name);
}

async function fetchKeyFiles(): Promise<IKeyFile[]> {
  return await keyFiles.toArray();
}
