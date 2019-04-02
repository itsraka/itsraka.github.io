export interface Matcher {
    match(item: any): boolean;
}

export class SameMatcher {
    match(item: any): boolean {
        return true;
    };
}

export class MergeMatcher implements Matcher {
    constructor(private readonly source: Matcher, private readonly next: Matcher) {
    }

    match(item) {
        return this.source.match(item) && this.next.match(item);
    }
}
