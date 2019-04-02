import {DataMarker, DataMarkerConstructor} from "./components/marker"
import {OpenEvent} from "./components/events"
import {OpenEventPublisher} from "./components/event_publishers"
import {LocationListMap, LocationMap} from "./components/location-map"
import {ResultContainer} from "./components/result-container"
import {Location, CenterSetter} from "./components/location"

export class ApiClient {
    private url: string;

    constructor(url) {
        this.url = url;
    }

    data(success: (data: Array<any>) => void, error: () => void) {
        fetch(this.url)
            .then((response) => {
                return response.json();
            })
            .then(success)
            .catch(error)
    }
}

export class SyncState {
    private completeHandler: (data, map) => void;
    private map: any;
    private data: Array<any>;

    constructor(complete) {
        this.completeHandler = complete;
        this.map = null;
        this.data = null;
    }

    setMap(map) {
        this.map = map;

        this.sync();
    }

    setData(data: Array<any>) {
        this.data = data;

        this.sync();
    }

    sync() {
        if (this.map === null || this.data === null) {
            return;
        }

        const complete = this.completeHandler;

        complete(this.data, this.map);
    }
}

export class LoadHandler {
    private loaded: boolean;
    private handler: () => void;

    constructor() {
        this.loaded = false;
        this.handler = null;
    }

    handle() {
        if (this.handler === null) {
            this.loaded = true;
        } else {
            const handler = this.handler;

            handler();
        }
    }

    on(handler) {
        if (this.loaded) {
            handler();
        } else {
            this.handler = handler;
        }
    }
}

export interface LocationGrouper {
    group(list): LocationListMap;
}

export interface Archiver {
    unzip(data: Array<any>): Array<any>;
}

export function createSyncHandler(): () => void {
    const state = new LoadHandler();

    const result = function () {
        state.handle();
    };

    result.on = function (handler) {
        state.on(handler)
    };

    return result;
}

export function getCheckedAliases($checkboxes: any): Array<string> {
    const aliases = [];

    $checkboxes.each(function () {
        const $self = $(this);
        const alias = $self.attr("data-alias");

        if ($self.is(":checked")) {
            aliases.push(alias);
        }
    });

    return aliases;
}

export interface ResultViewer {
    render(result: ResultContainer);
}

export interface MapViewer extends ResultViewer {
    openEventConsume(event: OpenEvent);
}

export interface HTMLViewer extends ResultViewer {
    setOpenEventPublisher(publisher: OpenEventPublisher);
}

export class CacheDataViewerDecorator implements ResultViewer {
    private readonly viewer: ResultViewer;
    private result: ResultContainer;

    constructor(viewer: ResultViewer) {
        this.viewer = viewer;
        this.result = null;
    }

    render(result: ResultContainer) {
        if (result === this.result) {
            return;
        }

        this.result = result;

        this.viewer.render(result);
    }
}

export class EmptyMapViewer implements MapViewer {
    render(result: ResultContainer) {
        // NOP
    }

    openEventConsume(event: OpenEvent) {
        // NOP
    }
}

declare const google: any;

const MAX_OPEN_INFO_WINDOW_COUNT = 3;

class InfoWindowController {
    private list: Array<any>;
    private maxSize: number;

    constructor(maxSize) {
        this.list = [];
        this.maxSize = maxSize;
    }

    public add(infoWindow: any) {
        this.list.push(infoWindow);

        if (this.list.length > this.maxSize) {
            this.list.shift().close();
        }
    }

    public clear() {
        this.list = [];
    }

    public close() {
        for (let i = 0; i < this.list.length; i++) {
            const info = this.list[i];

            info.close();
        }

        this.clear();
    }
}

class MarketContainer {
    constructor(public readonly dataMarker: DataMarker,
                public readonly mapMarker: any) {
    }
}

class FilledMapViewer implements MapViewer {
    private readonly locationGrouper: LocationGrouper;
    private readonly dataMarkerConstructor: DataMarkerConstructor;
    private readonly map: any;
    private containerMap: LocationMap;
    private markers: Array<any>;
    private readonly infoWindowController: InfoWindowController;

    constructor(locationGrouper: LocationGrouper, dataMarkerConstructor: DataMarkerConstructor, map) {
        this.locationGrouper = locationGrouper;
        this.dataMarkerConstructor = dataMarkerConstructor;
        this.map = map;
        this.markers = [];
        this.infoWindowController = new InfoWindowController(MAX_OPEN_INFO_WINDOW_COUNT);
    }

    public render(result: ResultContainer) {
        this.clear();

        const groupMakerMap = this.locationGrouper.group(result.getResult());
        const locationMap = groupMakerMap.getMap();
        const MarkerConstructor = this.dataMarkerConstructor;

        for (let latitude in locationMap) {
            if (locationMap.hasOwnProperty(latitude)) {
                for (let longitude in locationMap[latitude]) {
                    if (locationMap[latitude].hasOwnProperty(longitude)) {

                        const dataMarker = new MarkerConstructor(groupMakerMap.fetch(latitude, longitude));

                        const position = new google.maps.LatLng(latitude, longitude);

                        const mapMarker = new google.maps.Marker({
                            position: position,
                            map: this.map,
                            title: dataMarker.getTitle()
                        });

                        this.addClickListener(mapMarker, dataMarker);

                        const marketContainer = new MarketContainer(dataMarker, mapMarker);

                        this.markers.push(mapMarker);
                        this.containerMap.set(latitude, longitude, marketContainer);
                    }
                }
            }
        }
    }

    public openEventConsume(event: OpenEvent) {
        const markerContainer = this.containerMap.fetch(event.location.latitude, event.location.longitude) as MarketContainer;

        this.infoWindowController.close();

        this.open(markerContainer.mapMarker, markerContainer.dataMarker);
    }

    private addClickListener(marker: any, groupMarker: DataMarker) {
        google.maps.event.addListener(marker, "click", this.open.bind(this, marker, groupMarker));

        // https://developers.google.com/maps/documentation/javascript/events
        // Remove all click listeners from markers instance
        // google.maps.event.clearListeners(markers, 'click');
    }

    private open(marker: any, groupMarker: DataMarker) {
        const infoWindow = new google.maps.InfoWindow({
            content: groupMarker.getContent()
        });

        infoWindow.open(this.map, marker);

        this.infoWindowController.add(infoWindow);
    }

    private clear() {
        for (let i = 0; i < this.markers.length; i++) {
            const marker = this.markers[i];

            marker.setMap(null);
            google.maps.event.clearListeners(marker, "click");
        }

        this.markers = [];
        this.containerMap = new LocationMap();

        this.infoWindowController.clear();
    }
}

export class MapViewerManager implements MapViewer, CenterSetter {
    private locationGrouper: LocationGrouper;
    private mapViewer: MapViewer;
    private markerConstructor: DataMarkerConstructor;
    private map: any;

    constructor(locationGrouper: LocationGrouper, markerConstructor: DataMarkerConstructor) {
        this.locationGrouper = locationGrouper;
        this.markerConstructor = markerConstructor;
        this.mapViewer = new EmptyMapViewer();
        this.map = null;
    }

    setMap(map) {
        this.mapViewer = new FilledMapViewer(this.locationGrouper, this.markerConstructor, map);
        this.map = map;
    }

    render(result) {
        this.mapViewer.render(result);
    }

    openEventConsume(event: OpenEvent) {
        this.setCenter(event.location);

        this.mapViewer.openEventConsume(event);
    }

    setCenter(location: Location) {
        if (this.map === null) {
            return;
        }

        this.map.setCenter(new google.maps.LatLng(location.latitude, location.longitude))
    }
}

export class StatsViewer implements ResultViewer {
    render(result: ResultContainer) {
    }
}

export class EmptyCloseComponent {
    close() {
        // NOP
    }
}

export class AutocompletedCheckboxListView {
    private $element: any;
    private componentAlias: string;
    private aliasMap: { [s: string]: boolean };

    constructor($element, componentAlias) {
        const self = this;

        this.$element = $element;
        this.componentAlias = componentAlias;
        this.aliasMap = {};

        $element.on("click", ".js-remove", function (event) {
            const $root = $(event.target).closest("p");

            const companyAlias = $("input", $root).attr("data-alias");

            $root.remove();

            self.remove(companyAlias);
        });
    }

    addChecked(name: string, alias: string) {
        if (this.aliasMap.hasOwnProperty(alias)) {
            return;
        }

        this.$element.append(this.renderCheckbox(name, alias, true));

        this.aliasMap[alias] = true;
    }

    render(items: Array<any>, aliasCheckMap: { [s: string]: boolean }) {
        if (aliasCheckMap === null) {
            return;
        }

        const views = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (aliasCheckMap.hasOwnProperty(item.alias)) {
                views.push(this.renderCheckbox(item.name, item.alias, aliasCheckMap[item.alias] === true));

                this.aliasMap[item.alias] = true;
            }
        }

        this.$element.append(views.join(""));
    }

    renderCheckbox(name: string, alias: string, checked: boolean) {
        let checkedAttr = "";
        if (checked) {
            checkedAttr = "checked";
        }

        const id = `js-${this.componentAlias}-input-${alias}`;

        return `<p>
    <label for="${id}">
        <input type="checkbox" id="${id}" ${checkedAttr} data-alias="${alias}" />
        <span>${name} <span class="badge js-remove">x</span></span>
    </label>
</p>`;
    }

    remove(companyAlias: string) {
        delete this.aliasMap[companyAlias];
    }
}
