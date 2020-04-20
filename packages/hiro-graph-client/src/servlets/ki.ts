import { mergeMap, catchError, merge } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

import { Client } from '../client';
import { Endpoint } from '../endpoint';

interface KiValidateOptions {
  ki: string;
  [key: string]: any;
}

// @todo How accurate is this?
interface CheckResponse {
  code: number;
  status?: string;
  error?: string | { message: string };
  formatted?: string;
  variables?: {
    ISSUE: string[];
    NODE: string[];
  };
  errors?: { line: number; message: string }[];
}

interface KiValidationResponse {
  valid: boolean;
  response: {
    code: number;
    status?: string;
    error?: string;
    formatted?: string;
    variables?: {
      ISSUE: string[];
      NODE: string[];
    };
    errors?: { line: number; message: string }[];
  };
}

export const KI = {
  name: 'ki' as const,
  create: function (this: Client) {
    const endpoint = new Endpoint(this.endpoint).use('ki');

    return {
      validate: ({
        ki,
        ...rest
      }: KiValidateOptions): Observable<KiValidationResponse> => {
        const url = endpoint.path('check');

        return this.fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            ...rest,
            ki,
          }),
          raw: true,
        }).pipe(
          mergeMap((res) => res.json()),
          merge((res: CheckResponse) => {
            const valid = res.code === 200;

            return {
              valid,
              response: {
                ...res,
                // @ts-ignore
                error: !valid && (res.error?.message || res.error),
              },
            };
          }),
          catchError((err) =>
            of({
              valid: false,
              response: {
                code: 500,
                error: err.toString(),
              },
            }),
          ),
        );
      },
    };
  },
};
