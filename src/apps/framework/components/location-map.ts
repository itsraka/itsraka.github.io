export class LocationListMap {
    private readonly map: {};

    constructor() {
        this.map = {};
    }

    add(latitude, longitude, item) {
        this.map[latitude] = this.map[latitude] || {};
        this.map[latitude][longitude] = this.map[latitude][longitude] || [];
        this.map[latitude][longitude].push(item);
    }

    getMap() {
        return this.map;
    }

    fetch(latitude, longitude): Array<any> {
        return this.map[latitude][longitude];
    }
}

export class LocationMap {
    private readonly map: {};

    constructor() {
        this.map = {};
    }

    set(latitude, longitude, item) {
        this.map[latitude] = this.map[latitude] || {};
        this.map[latitude][longitude] = item;
    }

    getMap() {
        return this.map;
    }

    fetch(latitude, longitude) {
        return this.map[latitude][longitude];
    }
}
