import {Location, CenterSetter} from "./location"
import {Debounce} from "./debounce"
import {CriteriaConverter} from "./criteria-converter"

const SEARCH_QUERY_CENTER = "center";

declare global {
    interface Window {
        dataLayer: Array<any>;
    }
}

declare const google: any;

interface RealLocationSetter {
    setRealCenter(center: Location);
}

export class UrlStateContainer implements RealLocationSetter {
    private centerDefined: boolean;
    private center: Location;
    private centerSetter: CenterSetter;
    private zoom: number;
    private debounce: Debounce;
    private lazyUpdateHandler: () => void;
    private criteriaMap: { [s: string]: any; };
    private criteria: string;
    private criteriaNameConverterMap: { [s: string]: CriteriaConverter; };

    constructor(defaultState: any, delay: number, criteriaNames: Array<string>, criteriaNameConverterMap: { [s: string]: CriteriaConverter; }) {
        assertConverterMap(criteriaNames, criteriaNameConverterMap);

        this.centerDefined = false;
        this.center = defaultState.center;
        this.zoom = defaultState.zoom;
        this.centerSetter = null;

        const query = new URLSearchParams(window.location.search.substring(1));

        if (query.has(SEARCH_QUERY_CENTER)) {
            const queryCenter = parseCenterString(query.get(SEARCH_QUERY_CENTER));

            if (queryCenter) {
                const [latitude, longitude, zoom] = queryCenter;

                this.centerDefined = true;
                this.center = {latitude, longitude};
                this.zoom = zoom;
            }
        }

        this.buildCriteriaMap(this.parseCriteriaMap(query, criteriaNames, criteriaNameConverterMap));

        this.debounce = new Debounce(delay);
        this.lazyUpdateHandler = this.update.bind(this);

        this.tryRealGeoLocation();
    }

    addCenterSetter(setter: CenterSetter) {
        this.centerSetter = setter;
    }

    getCenter(): Location {
        return this.center;
    }

    setCenter(center: Location) {
        this.center = center;

        this.lazyUpdate();
    }

    tryRealGeoLocation() {
        if (this.centerDefined) {
            return;
        }

        tryRealGeoLocation(this);
    }

    setRealCenter(center: Location) {
        if (this.centerDefined) {
            return;
        }

        this.setCenter(center);

        if (this.centerSetter === null) {
            return;
        }

        this.centerSetter.setCenter(center);
    }

    getZoom(): number {
        return this.zoom;
    }

    setZoom(zoom: number) {
        this.zoom = zoom;

        this.lazyUpdate();
    }

    getCriteriaByName(criteriaName, criteria: any = null): any {
        if (this.criteriaMap.hasOwnProperty(criteriaName)) {
            return this.criteriaMap[criteriaName];
        }

        return criteria;
    }

    setCriteriaMap(criteriaMap: {}) {
        this.buildCriteriaMap(criteriaMap);

        this.update();
    }

    buildCriteriaMap(criteriaMap: {}) {
        const criteria = [];

        for (let criteriaName in criteriaMap) {
            if (criteriaMap.hasOwnProperty(criteriaName)) {
                const converter = this.criteriaNameConverterMap[criteriaName];

                criteria.push(
                    "&" + criteriaName + "=" + encodeURIComponent(converter.marshal(criteriaMap[criteriaName]))
                );
            }
        }

        this.criteriaMap = criteriaMap;
        this.criteria = criteria.join("");
    }

    /**
     *
     * @param {URLSearchParams} query
     * @param {Array} criteriaNames
     * @param {{}} criteriaNameConverterMap
     * @returns {{}}
     */
    parseCriteriaMap(query, criteriaNames, criteriaNameConverterMap) {
        this.criteriaNameConverterMap = criteriaNameConverterMap;

        const criteriaMap = {};

        for (let i = 0; i < criteriaNames.length; i++) {
            const criteriaName = criteriaNames[i];

            if (query.has(criteriaName)) {
                const converter = criteriaNameConverterMap[criteriaName];

                const source = decodeURIComponent(query.get(criteriaName)).trim();

                if (source !== "") {
                    const criteria = converter.unmarshal(source);

                    if (criteria !== null) {
                        criteriaMap[criteriaName] = criteria;
                    }
                }
            }
        }

        return criteriaMap;
    }

    lazyUpdate() {
        this.debounce.handle(this.lazyUpdateHandler);
    }

    update() {
        const center = this.center.latitude + "," + this.center.longitude + "," + this.zoom;

        const url = window.location.pathname +
            "?" + SEARCH_QUERY_CENTER + "=" + center +
            this.criteria;

        window.history.pushState(
            null,
            "",
            url
        );

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            "event": "Pageview",
            "url": url,
        });
    }
}

function parseCenterString(centerString): any {
    if (centerString) {
        const [latitudeString, longitudeString, zoomString] = centerString.trim().split(",");

        const latitude = parseFloat(latitudeString);
        const longitude = parseFloat(longitudeString);
        const zoom = parseFloat(zoomString);

        if (latitude > 0 && longitude > 0 && zoom > 0) {
            return [latitude, longitude, zoom];
        }
    }

    return null;
}

function assertConverterMap(criteriaNames: Array<string>, criteriaNameConverterMap: { [s: string]: any; }) {
    for (let i = 0; i < criteriaNames.length; i++) {
        const criteriaName = criteriaNames[i];

        if (criteriaNameConverterMap.hasOwnProperty(criteriaName)) {
            continue;
        }

        throw new Error(`missing converter for "${criteriaName}"`);
    }
}

function tryRealGeoLocation(setter: RealLocationSetter) {
    if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(function (position) {
            setter.setRealCenter(new Location(position.coords.latitude, position.coords.longitude));
        });
    }
}