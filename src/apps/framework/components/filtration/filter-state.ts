export interface FilterState {
    isEmpty(): boolean;

    getCriteria(): any;
}

class BaseFilterState implements FilterState {
    constructor(private readonly criteria: any,
                private readonly empty: boolean) {
    }

    public isEmpty() {
        return this.empty;
    }

    public getCriteria() {
        return this.criteria;
    }
}

export function FilledFilterState(criteria: any) {
    return new BaseFilterState(criteria, false);
}

export const EmptyFilterStateObject = new BaseFilterState([], true);
