import {CheckboxComponent} from "./checkbox"
import {FilledFilterState} from "./filtration/filter-state"
import {Modifier} from "./filtration/modifier"
import {FilterStateModifierBuilder, FilterStateModifier, NullFilterStateModifierObject} from "./filtration/filter-state-modifier"

interface ModifierConstructor {
    new (): Modifier;
}

export class CheckboxStateModifierBuilder implements FilterStateModifierBuilder {
    private checkbox: CheckboxComponent;
    private className: ModifierConstructor;

    constructor($element, checked, className) {
        this.checkbox = new CheckboxComponent($element, checked);
        this.className = className;
    }

    build() {
        if (this.checkbox.checked()) {
            const className = this.className;

            return new FilterStateModifier(FilledFilterState(this.checkbox.criteria()), new className());
        }

        return NullFilterStateModifierObject;
    }
}
