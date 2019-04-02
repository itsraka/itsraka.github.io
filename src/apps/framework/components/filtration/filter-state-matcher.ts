import {FilterState, EmptyFilterStateObject} from "./filter-state"
import {Matcher, SameMatcher} from "./matcher"

export class FilterStateMatcher {
    constructor(private readonly state: FilterState,
                private readonly matcher: Matcher,) {
    }

    public getState(): FilterState {
        return this.state;
    }

    public getMatcher(): Matcher {
        return this.matcher;
    }
}

export interface FilterStateMatcherBuilder {
    build(): FilterStateMatcher;
}

export const NullFilterStateMatcherObject = new FilterStateMatcher(EmptyFilterStateObject, new SameMatcher());

