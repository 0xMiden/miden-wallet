import React, { FC } from 'react';

import { useTranslation } from 'react-i18next';

export const ACTIVITY_PAGE_SIZE = 1000;
export const NFT_PAGE_SIZE = 100;
export const ACTIVITY_SUMMARY_SIZE = 3;
export const OP_STACK_PREVIEW_SIZE = 2;

export class ArtificialError extends Error {}
export class NotEnoughFundsError extends ArtificialError {}
export class ZeroBalanceError extends NotEnoughFundsError {}
export class ZeroTEZBalanceError extends NotEnoughFundsError {}

export const ACCOUNT_NAME_PATTERN = /[^\s-].{0,16}$/;

export const PASSWORD_PATTERN = new RegExp(
  [
    '^',
    '(?=.*[a-z])', // Must contain at least 1 lowercase alphabetical character
    '(?=.*[A-Z])', // Must contain at least 1 uppercase alphabetical character
    '(?=.*[0-9])', // Must contain at least 1 numeric character
    '(?=.{8,})' // Must be eight characters or longer
  ].join('')
);

export const uppercaseLowercaseMixtureRegx = /(?=.*[a-z])(?=.*[A-Z])/;
export const lettersNumbersMixtureRegx = /(?=.*\d)(?=.*[A-Za-z])/;
export const specialCharacterRegx = /[!@#$%^&*()_+\-=\]{};':"\\|,.<>?]/;

export const URL_PATTERN =
  /(^(https:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$)|(^http(s)?:\/\/localhost:[0-9]+$)/;

export const MnemonicErrorCaption: FC = () => {
  const { t } = useTranslation();
  return (
    <ul className="list-disc list-inside">
      <li>{t('mnemonicWordsAmountConstraint')}</li>
      <li>{t('mnemonicSpacingConstraint')}</li>
      <li>{t('justValidPreGeneratedMnemonic')}</li>
    </ul>
  );
};

export function formatMnemonic(m: string) {
  return m.replace(/\n/g, ' ').trim();
}

export function useAccountBadgeTitle() {
  const { t } = useTranslation();
  return t('importedAccount');
}

// Deprecated: Use useAccountBadgeTitle() hook instead in React components
export function getAccountBadgeTitle() {
  // This function is kept for backward compatibility but should be migrated
  // to useAccountBadgeTitle() in components that can use hooks
  return 'Imported';
}
