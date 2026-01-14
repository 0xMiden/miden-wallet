// Compares two AccountIds ignoring the optional note tag suffix (part after '_')
export const compareAccountIds = (id1: string, id2: string): boolean => {
  if (!id1 || !id2) {
    return false;
  }
  return id1.split('_')[0] === id2.split('_')[0];
};
