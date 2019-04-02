export interface FilterViewBuilder {
    build(list: Array<any>): void;
}

export class EmptyFilterViewBuilder implements FilterViewBuilder {
    build(list) {
        // NOP
    }
}

export class CallbackFilterViewBuilder implements FilterViewBuilder {
    private handler: (list: any) => void;

    constructor(handler) {
        this.handler = handler;
    }

    build(list) {
        const handler = this.handler;

        handler(list);
    }
}
