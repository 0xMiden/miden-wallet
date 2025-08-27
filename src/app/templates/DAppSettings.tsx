import React, { ComponentProps, FC, useCallback, useMemo, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import Name from 'app/atoms/Name';
import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import DAppLogo from 'app/templates/DAppLogo';
import HashChip from 'app/templates/HashChip';
import { useStorage, useMidenContext, useAccount } from 'lib/miden/front';
import { MidenDAppSession, MidenDAppSessions, MidenSharedStorageKey } from 'lib/miden/types';
import { useRetryableSWR } from 'lib/swr';
import { useConfirm } from 'lib/ui/dialog';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

type DAppEntry = [string, MidenDAppSession];
type DAppActions = {
  remove: (origin: string) => void;
};

const getDAppKey = (entry: DAppEntry) => entry[0];

const DAppSettings: FC = () => {
  const { t } = useTranslation();

  const { getAllDAppSessions, removeDAppSession } = useMidenContext();
  const account = useAccount();
  const confirm = useConfirm();

  const { data, mutate } = useRetryableSWR<MidenDAppSessions>(['getAllDAppSessions'], getAllDAppSessions, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  let allDAppSessions = Object.entries(data!);
  let dAppSessions: Record<string, MidenDAppSession> = {};
  allDAppSessions.forEach(([origin, sessions]) => {
    const session = sessions.find(sess => sess.accountId === account.publicKey);
    if (session) dAppSessions[origin] = session;
  });

  const [dAppEnabled, setDAppEnabled] = useStorage(MidenSharedStorageKey.DAppEnabled, true);

  const changingRef = useRef(false);

  const handleChange = useCallback(
    async (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (changingRef.current) return;
      changingRef.current = true;

      setDAppEnabled(evt.target.checked).catch((err: any) => {});

      changingRef.current = false;
    },
    [setDAppEnabled]
  );

  const handleRemoveClick = useCallback(
    async (origin: string) => {
      if (
        await confirm({
          title: t('actionConfirmation'),
          children: t('resetPermissionsConfirmation', origin)
        })
      ) {
        await removeDAppSession(origin);
        mutate();
      }
    },
    [removeDAppSession, mutate, confirm, t]
  );

  const dAppEntries = Object.entries(dAppSessions);

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <div className="flex justify-between mb-8">
        <div className="flex flex-col w-4/6">
          <label className="leading-tight flex flex-col" htmlFor="popupEnabled">
            <span
              className="text-black font-medium text-black my-1"
              style={{
                font: '14px',
                lineHeight: '20px'
              }}
            >
              {t('dAppsInteraction')}
            </span>

            <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
              {t('dAppsCheckmarkPrompt', { action: t(dAppEnabled ? 'disable' : 'enable') })}
            </span>
          </label>
        </div>
        <ToggleSwitch
          checked={dAppEnabled}
          onChange={handleChange}
          name="dAppEnabled"
          containerClassName="mb-4"
          testID={GeneralSettingsSelectors.DAppToggle}
        />
      </div>

      {dAppEntries.length > 0 && (
        <>
          <h2>
            <span className="text-black font-medium" id="authorizedDApps">
              {t('authorizedDApps')}
            </span>
          </h2>

          <div className="mb-4">
            <span className="text-xs text-black" style={{ maxWidth: '90%' }} id="clickIconToResetPermissions">
              {t('clickIconToResetPermissions')}
            </span>
          </div>

          <CustomSelect
            actions={{ remove: handleRemoveClick }}
            className="mb-4 text-xs rounded-lg border border-gray-600"
            getItemId={getDAppKey}
            items={dAppEntries}
            OptionIcon={DAppIcon}
            OptionContent={DAppDescription}
            light
            hoverable={false}
          />
        </>
      )}
    </div>
  );
};

export default DAppSettings;

const DAppIcon: FC<OptionRenderProps<DAppEntry, string, DAppActions>> = props => (
  <DAppLogo className="flex-none mr-1" style={{ alignSelf: 'flex-center' }} origin={props.item[0]} size={36} />
);

const DAppDescription: FC<OptionRenderProps<DAppEntry, string, DAppActions>> = props => {
  const { t } = useTranslation();
  const {
    actions,
    item: [origin, { network, accountId, decryptPermission }]
  } = props;
  const { remove: onRemove } = actions!;

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      onRemove(origin);
    },
    [onRemove, origin]
  );

  const dAppAttributes = useMemo(
    () => [
      {
        key: 'originLabel',
        value: origin,
        Component: ({ className, ...rest }: ComponentProps<typeof Name>) => (
          <a
            href={origin}
            target="_blank"
            rel="noopener noreferrer"
            className={classNames('text-black hover:underline', className)}
          >
            <Name {...rest} />
          </a>
        )
      },
      {
        key: 'networkLabel',
        value: network,
        valueClassName: network.toString() && 'capitalize',
        Component: Name
      },
      {
        key: 'pkhLabel',
        value: <HashChip hash={accountId} type="link" small />,
        Component: 'span'
      },
      {
        key: 'permissionLabel',
        value: t(`${decryptPermission.toString()}_SHORT`),
        Component: 'span'
      }
    ],
    [origin, network, accountId, decryptPermission, t]
  );

  return (
    <div className="flex flex-1 w-full">
      <div className="flex flex-col justify-between flex-1">
        <Name className="mb-1 text-xs font-medium leading-tight text-left" style={{ maxWidth: '14rem' }}>
          {origin}
        </Name>

        {dAppAttributes.map(({ key, value, valueClassName, Component }) => (
          <div className="text-xs  leading-tight text-black" key={key}>
            {`${t(key)} `}
            <Component
              className={classNames('font-normal text-xs inline-flex', valueClassName)}
              style={{ maxWidth: '10rem' }}
              key={key}
            >
              {value}
            </Component>
          </div>
        ))}
      </div>

      <button
        className={classNames('flex-none', 'text-gray-500 hover:text-black', 'transition ease-in-out duration-200')}
        onClick={handleRemoveClick}
      >
        <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
      </button>
    </div>
  );
};
