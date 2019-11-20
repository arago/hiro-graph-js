type LuceneOptions<T> = '$not' | '$or' | '$must' | '$and' | '$missing' | T;

type LucenseBase<T extends string> = {
  [K in LuceneOptions<T>]?: string | string[] | LucenseBase<T>;
};
interface LuceneSpecial {
  $search?: { type: 'ngram' | 'prefix'; term: string; field?: string } | string;
  $range?: { [index: string]: [number, number] };
}
interface LucenseAny {
  [index: string]: string | string[] | LucenseAny;
}

export type LuceneQuery<T extends string = string> = LucenseBase<T> &
  LuceneSpecial &
  LucenseAny;

export const createLuceneQuerystring: <T extends string = string>(
  query: LuceneQuery<T>,
  entity?: any,
) => {
  querystring: string;
  placeholders?: object;
};

export default createLuceneQuerystring;
