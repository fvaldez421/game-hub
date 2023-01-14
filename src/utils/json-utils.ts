export const stringifyJSON = (blob: any, pretty: boolean = false) => {
  if (pretty) {
    return JSON.stringify(blob, undefined, 4);
  }
  return JSON.stringify(blob);
};

export const parseJSONAttempt = <ExpectedModel>(
  blob: any,
  fallback: any = null
): ExpectedModel | null => {
  try {
    return JSON.parse(blob);
  } catch (err) {
    console.error(`Failed to parse JSON: ${stringifyJSON(blob)}`, err);
  }
  return null;
};
