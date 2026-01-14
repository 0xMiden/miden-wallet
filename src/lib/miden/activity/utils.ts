// Compares two AccountIds ingoring if any one of them has a missing note tag
export const compareAccountIds = (id1: string, id2: string): boolean => {
  return id1.split('_')[0] === id2.split('_')[0];
};
