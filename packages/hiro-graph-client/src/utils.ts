import { iif, Observable, of } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';

export function extract(obj: Record<string, string> = {}, ...keys: string[]) {
  return keys.reduce((acc, k) => {
    if (k in obj && obj[k] !== undefined) {
      acc[k] = obj[k];
    }

    return acc;
  }, {} as Record<string, string>);
}

export const toPromise = <T>(o: Observable<T>) =>
  o
    .pipe(
      toArray(),
      mergeMap((res) => iif(() => res.length === 1, of(res[0]), of(res))),
    )
    .toPromise();
