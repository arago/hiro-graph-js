export function extract(obj: Record<string, string> = {}, ...keys: string[]) {
  return keys.reduce((acc, k) => {
    if (k in obj && obj[k] !== undefined) {
      acc[k] = obj[k];
    }

    return acc;
  }, {} as Record<string, string>);
}
