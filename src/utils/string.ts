export function truncateHash(hash: string, front = 7, back = 4): string {
  if (!hash) return '';
  return `${hash.slice(0, front)}…${hash.slice(-back)}`;
}

// mtst1aplqzwh6s4gvcyzsvx726y6xvsgt5qv5_qruqqypuyph -> mtst1a...5qv5...uyph
export function truncateAddress(address: string, includeBack = true, front = 6, middle = 4, back = 4): string {
  if (!address) return '';

  const underscoreIndex = address.indexOf('_');
  if (underscoreIndex === -1) return truncateHash(address, front, back);

  const frontPart = address.slice(0, front);
  const middlePart = address.slice(underscoreIndex - middle, underscoreIndex);

  if (includeBack) {
    const backPart = address.slice(-back);
    return `${frontPart}...${middlePart}...${backPart}`;
  }
  return `${frontPart}...${middlePart}`;
}

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
