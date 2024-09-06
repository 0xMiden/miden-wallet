// change to 7 - 4
export const shortenAddress = (address: string, startCharsCount = 7, endCharsCount = 4) => {
  if (address.length < startCharsCount + endCharsCount + 3) {
    return address;
  }
  return `${address.slice(0, startCharsCount)}...${address.slice(-endCharsCount)}`;
};
