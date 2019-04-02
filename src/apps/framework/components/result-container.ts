export class ResultContainer {
    constructor(private readonly result: Array<any>,
                private readonly criteriaMap: { [s: string]: any },
                private readonly duration: number) {
    }

    getCount(): number {
        return this.result.length;
    }

    getResult() {
        return this.result;
    }

    getDuration() {
        return this.duration;
    }

    getCriteriaMap() {
        return this.criteriaMap;
    }
}
