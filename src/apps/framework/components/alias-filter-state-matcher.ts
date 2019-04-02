import {createAliasStateMapByCheckboxes} from "./alias-state-map"
import {SameAliasMatcher} from "./common-matchers"
import {FilledFilterState} from "./filtration/filter-state"
import {FilterStateMatcher, FilterStateMatcherBuilder, NullFilterStateMatcherObject} from "./filtration/filter-state-matcher"

export class AliasFilterStateMatcherBuilder implements FilterStateMatcherBuilder {
    constructor(private $element: any) {
    }

    build(): FilterStateMatcher {
        const aliasStateMap = createAliasStateMapByCheckboxes($("input", this.$element));

        if (aliasStateMap.selected.length > 0) {
            return new FilterStateMatcher(
                FilledFilterState(aliasStateMap.aliasStateMap),
                new SameAliasMatcher(aliasStateMap.selected, true)
            );
        }

        if (aliasStateMap.disabled.length > 0) {
            return new FilterStateMatcher(
                FilledFilterState(aliasStateMap.aliasStateMap),
                new SameAliasMatcher(aliasStateMap.disabled, false)
            );
        }


        return NullFilterStateMatcherObject;
    }
}
