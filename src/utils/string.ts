// change to 7 - 4
export const shortenAddress = (address: string, startCharsCount = 7, endCharsCount = 4) => {
  if (address.length < startCharsCount + endCharsCount + 3) {
    return address;
  }
  return `${address.slice(0, startCharsCount)}...${address.slice(-endCharsCount)}`;
};

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
