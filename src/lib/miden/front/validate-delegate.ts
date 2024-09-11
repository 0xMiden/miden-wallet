import { getANSAddress, isAddressValid } from 'lib/miden/front';

export const validateDelegate = async (value: any, t: any) => {
  if (!value?.length || value.length < 0) {
    return false;
  }

  return true;
};
