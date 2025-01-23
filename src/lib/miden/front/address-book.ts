import { useCallback } from 'react';

import { useMidenContext } from 'lib/miden/front';
import { getMessage } from 'lib/i18n';

import { useFilteredContacts } from './use-filtered-contacts.hook';
import { WalletContact } from 'lib/shared/types';

export function useContacts() {
  const { updateSettings } = useMidenContext();
  const { contacts, allContacts } = useFilteredContacts();

  const addContact = useCallback(
    async (cToAdd: WalletContact) => {
      if (allContacts.some(c => c.address === cToAdd.address)) {
        throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
      }
      console.log('calling update settings...');
      await updateSettings({
        contacts: [cToAdd, ...contacts]
      });
    },
    [contacts, allContacts, updateSettings]
  );

  const removeContact = useCallback(
    async (address: string) =>
      await updateSettings({
        contacts: contacts.filter(c => c.address !== address)
      }),
    [contacts, updateSettings]
  );

  const getContact = useCallback(
    (address: string) => allContacts.find(c => c.address === address) ?? null,
    [allContacts]
  );

  return {
    addContact,
    removeContact,
    getContact
  };
}

export const CONTACT_FIELDS_TO_SEARCH = ['name', 'address'] as const;

export function searchContacts<T>(contacts: T[], searchValue: string) {
  if (!searchValue) return contacts;

  const loweredSearchValue = searchValue.toLowerCase();
  return [];
}
