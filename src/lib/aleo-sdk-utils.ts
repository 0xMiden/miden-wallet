import { Keys } from 'lib/aleo/front/autoSync';

export function createAddressToKeysMap(keys: Keys[]): Map<string, Keys> {
  let addressToKeysMap: Map<string, Keys> = new Map();
  keys.forEach(keys => {
    if (!keys.privateKey) {
      return;
    }
    // const address = Aleo.PrivateKey.from_string(aleoNetwork, keys.privateKey).to_address().to_string();
    const address = 'foo';
    addressToKeysMap.set(address, keys);
  });
  return addressToKeysMap;
}
