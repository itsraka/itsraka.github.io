import {CheckboxComponent} from "./checkbox"
import {FilledFilterState} from "./filtration/filter-state"
import {Matcher} from "./filtration/matcher"
import {FilterStateMatcherBuilder, FilterStateMatcher, NullFilterStateMatcherObject} from "./filtration/filter-state-matcher"

interface MatcherConstructor {
    new (): Matcher;
}

export class CheckboxFilterMatchBuilder implements FilterStateMatcherBuilder {
    private checkbox: CheckboxComponent;
    private className: MatcherConstructor;

    constructor($element, checked, className) {
        this.checkbox = new CheckboxComponent($element, checked);
        this.className = className;
    }

    build() {
        if (this.checkbox.checked()) {
            const className = this.className;

            return new FilterStateMatcher(FilledFilterState(this.checkbox.criteria()), new className());
        }

        return NullFilterStateMatcherObject;
    }
}
