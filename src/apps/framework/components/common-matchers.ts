import {createAliasMap} from "./alias-map"
import {Matcher} from "./filtration/matcher"

export abstract class MultiSelectMatcher implements Matcher {
    protected readonly aliasMap: { [s: string]: boolean; };

    constructor(aliases) {
        this.aliasMap = createAliasMap(aliases);
    }

    abstract match(item: any): boolean;
}

export class SameAliasMatcher extends MultiSelectMatcher {
    constructor(aliases, private readonly state: boolean) {
        super(aliases);
    }

    match(item) {
        return this.aliasMap.hasOwnProperty(item.alias) === this.state;
    }
}
