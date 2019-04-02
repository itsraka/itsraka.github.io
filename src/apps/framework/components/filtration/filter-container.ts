import {FilterStateMatcherBuilder} from "./filter-state-matcher"
import {FilterStateModifierBuilder} from "./filter-state-modifier"
import {Matcher, MergeMatcher, SameMatcher} from "./matcher"
import {Modifier, MergeModifier, SameModifier} from "./modifier"

export abstract class FilterContainer {
    constructor(private readonly criteriaMap: { [s: string]: any } = {}) {
    }

    abstract filter(source: Array<{}>): Array<{}>;

    getCriteriaMap() {
        return this.criteriaMap;
    }
}

class CriteriaMap {
    private map: { [s: string]: any };
    private exists: boolean;

    constructor() {
        this.map = {};
        this.exists = false;
    }

    add(name: string, criteria: any) {
        this.map[name] = criteria;

        this.exists = true;
    }

    public isExists() {
        return this.exists;
    }

    public getMap() {
        return this.map;
    }
}

export class FilterContainerBuilder {
    constructor(private readonly matcherBuilderMap: { [s: string]: FilterStateMatcherBuilder },
                private readonly modifierBuilderMap: { [s: string]: FilterStateModifierBuilder },) {
    }

    build(): FilterContainer {
        const criteriaMap = new CriteriaMap();

        let matcher: Matcher = new SameMatcher();
        for (let criteriaName in this.matcherBuilderMap) {
            if (this.matcherBuilderMap.hasOwnProperty(criteriaName)) {
                const filterMatchBuilder = this.matcherBuilderMap[criteriaName];

                const stateMatcher = filterMatchBuilder.build();
                const state = stateMatcher.getState();

                if (state.isEmpty()) {
                    continue;
                }

                criteriaMap.add(criteriaName, state.getCriteria());
                matcher = new MergeMatcher(matcher, stateMatcher.getMatcher());
            }
        }

        let modifier: Modifier = new SameModifier();
        for (let criteriaName in this.modifierBuilderMap) {
            if (this.modifierBuilderMap.hasOwnProperty(criteriaName)) {
                const stateModifierBuilder = this.modifierBuilderMap[criteriaName];

                const stateModifier = stateModifierBuilder.build();
                const state = stateModifier.getState();

                if (state.isEmpty()) {
                    continue;
                }

                criteriaMap.add(criteriaName, state.getCriteria());
                modifier = new MergeModifier(modifier, stateModifier.getModifier());
            }
        }

        if (criteriaMap.isExists()) {
            return new FilledFilterContainer(criteriaMap.getMap(), matcher, modifier);
        }

        return new EmptyFilterContainer();
    }
}

class EmptyFilterContainer extends FilterContainer {
    filter(source) {
        return source;
    }
}

export class FilledFilterContainer extends FilterContainer {
    constructor(criteriaMap,
                private readonly matcher: Matcher,
                private readonly modifier: Modifier) {
        super(criteriaMap);
    }

    filter(source) {
        const result = [];

        for (let i = 0; i < source.length; i++) {
            const item = source[i];

            if (this.matcher.match(item)) {
                const modified = this.modifier.modify(item);

                if (modified !== null) {
                    result.push(modified);
                }
            }
        }

        return result;
    }
}
