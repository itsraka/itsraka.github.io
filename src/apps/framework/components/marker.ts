export interface DataMarker {
    getTitle(): string;

    getContent(): string;
}

export interface DataMarkerConstructor {
    new (list: Array<any>): DataMarker;
}

export abstract class GroupMarker implements DataMarker {
    constructor(protected list: Array<any>) {
    }

    abstract getTitle(): string;

    abstract getContent(): string;
}