export class UniqueKeyChecker {
    private map: { [s: string]: boolean; };
    private list: Array<string>;

    constructor() {
        this.map = {};
        this.list = [];
    }

    unique(key: string): string {
        if (this.map.hasOwnProperty(key)) {
            throw new Error(`already exists: ${key}`);
        }

        this.map[key] = true;
        this.list.push(key);

        return key;
    }

    keys() {
        return this.list;
    }
}
