import { mergeMap, catchError, map } from 'rxjs/operators';
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
          json: {
            ...rest,
            ki,
          },
          raw: true,
        }).pipe(
          mergeMap((res) => res.json()),
          map((res: CheckResponse) => {
            const valid = res.code === 200;

            return {
              valid,
              response: {
                ...res,
                error:
                  // @ts-ignore
                  !valid && ((res.error && res.error.message) || res.error),
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