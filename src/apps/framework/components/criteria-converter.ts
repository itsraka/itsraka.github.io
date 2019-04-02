export interface CriteriaConverter {
    unmarshal(data: string): any;

    marshal(data: any): string;
}

export class IdentityCriteriaConverter implements CriteriaConverter {
    unmarshal(data) {
        return data;
    }

    marshal(data) {
        return data;
    }
}

export class RangeCriteriaConverter implements CriteriaConverter {
    private readonly delimiter: string;

    constructor() {
        this.delimiter = "-";
    }

    unmarshal(data) {
        const between = data.split(this.delimiter);
        const from = parseInt(between[0], 10);

        if (between.length === 2) {
            const to = parseInt(between[1], 10);

            if (to > 0 && to >= from) {
                return {from, to};
            }

            return null;
        }

        if (from > 0) {
            return {from, to: 0};
        }

        return 0;
    }

    marshal({from, to}) {
        const data = [from];

        if (to > 0) {
            data.push(to);
        }

        return data.join(this.delimiter);
    }
}

export class MultiSelectCriteriaConverter implements CriteriaConverter {
    private readonly delimiter: string;

    constructor() {
        this.delimiter = ",";
    }

    unmarshal(aliases) {
        if (aliases !== "") {
            return aliases.split(this.delimiter);
        }

        return null;
    }

    marshal(aliases) {
        if (aliases.length === 0) {
            return "";
        }

        return aliases.join(this.delimiter);
    }
}

export class MultiCheckboxCriteriaConverter implements CriteriaConverter {
    private readonly suffix: string;

    constructor() {
        this.suffix = "-unchecked";
    }

    unmarshal(source) {
        if (source !== "") {
            const aliases = source.split(",");

            const result = {};

            for (let i = 0; i < aliases.length; i++) {
                const alias = aliases[i];

                if (alias.endsWith(this.suffix)) {
                    result[alias.substring(0, alias.length - this.suffix.length)] = false;
                } else {
                    result[alias] = true;
                }
            }

            return result;
        }

        return null;
    }

    marshal(aliasCheckMap) {
        const aliases = [];

        for (let alias in aliasCheckMap) {
            if (aliasCheckMap.hasOwnProperty(alias)) {
                const checked = aliasCheckMap[alias];

                if (checked === true) {
                    aliases.push(alias);
                } else if (checked === false) {
                    aliases.push(alias + this.suffix);
                } else {
                    console.error(`wrong state for "${alias}" = "${checked}"`)
                }
            }
        }

        return aliases.join(",");
    }
}