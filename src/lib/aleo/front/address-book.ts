import { useCallback } from 'react';

import { useAleoClient } from 'lib/aleo/front';
import { getMessage } from 'lib/i18n';

import { useFilteredContacts } from './use-filtered-contacts.hook';

export function useContacts() {
  const { updateSettings } = useAleoClient();
  const { contacts, allContacts } = useFilteredContacts();

  const addContact = useCallback(() => {}, [contacts, allContacts, updateSettings]);

  const removeContact = useCallback(async (address: string) => {}, [contacts, updateSettings]);

  const getContact = useCallback(() => {}, [allContacts]);

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
