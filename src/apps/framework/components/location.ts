export class Location {
    constructor(public readonly latitude: number,
                public readonly longitude: number) {
    }
}

export interface CenterSetter {
    setCenter(location: Location);
}

export function distance(a: Location, b: Location): number {
    const x = a.latitude - b.latitude;
    const y = a.longitude - b.longitude;

    return x * x + y * y;
}
