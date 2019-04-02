import {FilterState, EmptyFilterStateObject} from "./filter-state"
import {Modifier, SameModifier} from "./modifier"

export class FilterStateModifier {
    constructor(private readonly filterState: FilterState,
                private readonly modifier: Modifier,) {
    }

    public getState(): FilterState {
        return this.filterState;
    }

    public getModifier(): Modifier {
        return this.modifier;
    }
}

export interface FilterStateModifierBuilder {
    build(): FilterStateModifier;
}

export const NullFilterStateModifierObject = new FilterStateModifier(EmptyFilterStateObject, new SameModifier());
