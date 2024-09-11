import * as React from 'react';

import { logger } from 'shared/logger';

// TODO: reuse in other places (eg. saving.ts & popup-mode/index.ts)
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item = localStorage.getItem(key);

      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Failed to get item with key ${key} from local storage`, error);

      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error('Failed to store item in local storage', error);
    }
  };

  return [storedValue, setValue];
};
