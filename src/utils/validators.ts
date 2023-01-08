export const isNonEmptyString = (val: any) => {
  if (typeof val !== 'string') return false;
  return val.length > 0;
};

export const isNonEmptyArray = (val: any) => {
  if (!Array.isArray(val)) return false;
  return val.length > 0;
};
