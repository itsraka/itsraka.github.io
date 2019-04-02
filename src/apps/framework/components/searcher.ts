import {FilterContainerBuilder} from "./filtration/filter-container"
import {ResultContainer} from "./result-container"

export interface Searcher {
    search(): ResultContainer;
}

export class FilledSearcher implements Searcher {
    constructor(private readonly source: Array<any>, private readonly filterContainerBuilder: FilterContainerBuilder) {
    }

    search() {
        const startTime = Date.now();
        const filterContainer = this.filterContainerBuilder.build();
        const result = filterContainer.filter(this.source);
        const duration = Date.now() - startTime;

        return new ResultContainer(result, filterContainer.getCriteriaMap(), duration);
    }
}

export class NullSearcher implements Searcher {
    search() {
        return new ResultContainer([], {}, 0);
    }
}

export class SearcherManager implements Searcher {
    constructor(private searcher: Searcher) {
    }

    search(): ResultContainer {
        return this.searcher.search();
    }

    setSearcher(searcher) {
        this.searcher = searcher;
    }
}
