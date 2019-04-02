export function createAliasMap(aliases: Array<string>): { [s: string]: boolean; } {
    const map = {};

    for (let i = 0; i < aliases.length; i++) {
        map[aliases[i]] = true;
    }

    return map;
}
