import {createAliasMap} from "./alias-map"
import {Modifier} from "./filtration/modifier"

export abstract class MultiSelectModifier implements Modifier {
    protected readonly aliasMap: { [s: string]: boolean; };

    constructor(aliases) {
        this.aliasMap = createAliasMap(aliases);
    }

    abstract modify(item: any): any;
}
