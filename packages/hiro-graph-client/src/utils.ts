import { iif, Observable, of } from 'rxjs';
import { mergeMap, scan } from 'rxjs/operators';

export function extract(obj: Record<string, string> = {}, ...keys: string[]) {
  return keys.reduce((acc, k) => {
    if (k in obj && obj[k] !== undefined) {
      acc[k] = obj[k];
    }

    return acc;
  }, {} as Record<string, string>);
}

export const toPromise = <T>(o: Observable<T>) => {
  const items: T[] = [];

  return o
    .pipe(
      scan((acc, r) => {
        acc.push(r);

        return acc;
      }, items),
      mergeMap((res) => iif(() => res.length === 1, of(res[0]), of(res))),
    )
    .toPromise() as Promise<T>;
};
