export class GremlinQueryBuilder {
    constructor(initialQuery: string);

    toString(): string;

    raw(query: string): GremlinQueryBuilder;
    append(query: string): GremlinQueryBuilder;
    transform(
        transforms:
            | Array<string | GremlinQueryBuilder>
            | { [key: string]: string | GremlinQueryBuilder }
    ): GremlinQueryBuilder;
    copySplit(
        paths: Array<GremlinQueryBuilder | string>,
        mergeType: "fairMerge" | "exhaustMerge"
    ): GremlinQueryBuilder;
    or(conditions: Array<GremlinQueryBuilder | string>): GremlinQueryBuilder;
    dedup(prop: string): GremlinQueryBuilder;
    limit(start: number, finish: number): GremlinQueryBuilder;
    order(): GremlinQueryBuilder;
    by(field: string): GremlinQueryBuilder;
    range(from: number, to: number): GremlinQueryBuilder;
    values(target): GremlinQueryBuilder;
    filter(condition: string): GremlinQueryBuilder;
    addTempProp(name: string, value: string): GremlinQueryBuilder;
    addComputedProp(
        name: string,
        query: GremlinQueryBuilder | string
    ): GremlinQueryBuilder;
    groupBy(groupingProp: string, resultProp: string): GremlinQueryBuilder;
    groupCount(groupingProp: string): GremlinQueryBuilder;
    inE(...args: Array<string>): GremlinQueryBuilder;
    outE(...args: Array<string>): GremlinQueryBuilder;
    bothE(...args: Array<string>): GremlinQueryBuilder;
    inV(...args: Array<string>): GremlinQueryBuilder;
    outV(...args: Array<string>): GremlinQueryBuilder;
    bothV(...args: Array<string>): GremlinQueryBuilder;
    in(...args: Array<string>): GremlinQueryBuilder;
    out(...args: Array<string>): GremlinQueryBuilder;
    both(...args: Array<string>): GremlinQueryBuilder;
    count(...args: Array<string>): GremlinQueryBuilder;
    as(...args: Array<string>): GremlinQueryBuilder;
    back(...args: Array<string>): GremlinQueryBuilder;
    shuffle(...args: Array<string>): GremlinQueryBuilder;
    has(...args: Array<string>): GremlinQueryBuilder;
    hasNot(...args: Array<string>): GremlinQueryBuilder;
    tree(): GremlinQueryBuilder;
    property(...args: Array<string>): GremlinQueryBuilder;
    getProperty(...args: Array<string>): GremlinQueryBuilder;
}

export default function queryBuilder(
    initialQuery: string | GremlinQueryBuilder
): GremlinQueryBuilder;
