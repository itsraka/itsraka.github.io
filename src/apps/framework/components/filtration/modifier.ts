export interface Modifier {
    modify(item: any): any;
}

export class SameModifier implements Modifier {
    modify(item: any): any {
        return item;
    }
}

export class MergeModifier implements Modifier {
    constructor(private readonly source: Modifier, private readonly next: Modifier) {
    }

    modify(item) {
        const result = this.source.modify(item);

        if (result === null) {
            return null;
        }

        return this.next.modify(result);
    }
}
