import { useMemo } from 'react';

import { useMidenClient } from './client';
import { useSettings } from './ready';

export function useFilteredContacts() {
  const settings = useSettings();
  // @ts-ignore
  const settingContacts = useMemo(() => settings?.contacts ?? [], [settings?.contacts]);

  return { contacts: settingContacts, allContacts: [] };
}
