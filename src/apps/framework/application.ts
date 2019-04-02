import {
    ResultViewer,
    HTMLViewer,
    MapViewerManager,
    StatsViewer,
    ApiClient,
    Archiver,
    SyncState,
    createSyncHandler, CacheDataViewerDecorator,
} from './components';

import {UrlStateContainer} from "./components/url-state-container"
import {FilterContainerBuilder} from "./components/filtration/filter-container"
import {FilterViewBuilder} from "./components/filter-view-builder"
import {SearcherManager, NullSearcher, FilledSearcher,} from "./components/searcher"
import {ResultContainer} from "./components/result-container"
import {OpenEvent} from "./components/events"
import {OpenEventPublisher} from "./components/event_publishers"

declare let window: { initializeMap: any };

window.initializeMap = createSyncHandler();

declare const google: any;
declare const M: any;

enum Tab {
    GoogleMap,
    ResultList,
}

export class Application implements OpenEventPublisher{
    private readonly urlStateContainer: UrlStateContainer;
    private readonly dataViewer: HTMLViewer;
    private readonly mapViewer: MapViewerManager;
    private readonly statsViewer: StatsViewer;
    private readonly apiClient: ApiClient;
    private readonly archiver: Archiver;
    private readonly filterContainerBuilder: FilterContainerBuilder;
    private readonly filterViewBuilder: FilterViewBuilder;
    private readonly searcherManager: SearcherManager;
    private resultContainer: ResultContainer;

    private selectedDataViewer: ResultViewer;
    private readonly tabDataViewerMap: { [n: number]: ResultViewer };

    constructor(urlStateContainer, mapViewerManager, dataViewer, statsViewer, apiClient, archiver, filterContainerBuilder, filterViewBuilder) {
        this.urlStateContainer = urlStateContainer;
        this.dataViewer = dataViewer;
        this.mapViewer = mapViewerManager;
        this.statsViewer = statsViewer;
        this.apiClient = apiClient;
        this.archiver = archiver;
        this.filterContainerBuilder = filterContainerBuilder;
        this.filterViewBuilder = filterViewBuilder;

        this.searcherManager = new SearcherManager(new NullSearcher());
        this.resultContainer = this.searcherManager.search();

        const selectedDataViewer = new CacheDataViewerDecorator(mapViewerManager);

        this.tabDataViewerMap = {
            [Tab.GoogleMap]: selectedDataViewer,
            [Tab.ResultList]: new CacheDataViewerDecorator(dataViewer),
        };

        this.selectedDataViewer = selectedDataViewer;

        this.dataViewer.setOpenEventPublisher(this);

        // TODO: hard code
        this.urlStateContainer.addCenterSetter(mapViewerManager);
    }

    start() {
        const self = this;
        const urlStateContainer = this.urlStateContainer;
        const mapViewerManager = this.mapViewer;
        const archiver = this.archiver;
        const apiClient = this.apiClient;
        const filterContainerBuilder = this.filterContainerBuilder;
        const filterViewBuilder = this.filterViewBuilder;
        const searcherManager = this.searcherManager;

        const syncState = new SyncState(function (source, map) {
            const list = archiver.unzip(source);

            filterViewBuilder.build(list);

            searcherManager.setSearcher(new FilledSearcher(list, filterContainerBuilder));

            mapViewerManager.setMap(map);

            self.initializeSearchAndRender();
        });

        apiClient.data(function (data: Array<any>) {
            syncState.setData(data);
        }, console.error);

        window.initializeMap.on(function () {
            const center = urlStateContainer.getCenter();

            const options = {
                zoom: urlStateContainer.getZoom(),
                center: new google.maps.LatLng(center.latitude, center.longitude),
                mapTypeId: google.maps.MapTypeId.TERRAIN,
                mapTypeControl: false
            };

            const map = new google.maps.Map(document.getElementById("js-google-map"), options);

            syncState.setMap(map);

            map.addListener("center_changed", function () {
                const center = map.getCenter();

                urlStateContainer.setCenter({
                    latitude: center.lat(),
                    longitude: center.lng()
                });
            });

            map.addListener("zoom_changed", function () {
                urlStateContainer.setZoom(map.getZoom());
            });
        });
    }

    private initializeSearchAndRender() {
        this.search();
        this.render(this.resultContainer);
    }

    searchAndRender() {
        this.search();

        const resultContainer = this.resultContainer;

        this.render(resultContainer);

        this.urlStateContainer.setCriteriaMap(resultContainer.getCriteriaMap());
    }

    searchAndCount() {
        this.search();

        const resultContainer = this.resultContainer;

        return resultContainer.getCount();
    }

    private search() {
        this.resultContainer = this.searcherManager.search();
    }

    renderAfterSearch() {
        const resultContainer = this.resultContainer;

        this.render(resultContainer);

        this.urlStateContainer.setCriteriaMap(resultContainer.getCriteriaMap());
    }

    selectResultTab() {
        this.changeTab(Tab.ResultList);
    }

    selectGoogleMapTab() {
        this.changeTab(Tab.GoogleMap);
    }

    openEventPublish(event: OpenEvent) {
        // TODO: hard core
        const tabs = M.Tabs.getInstance($("#js-tabs"));
        tabs.select("gmap");
        //

        this.selectGoogleMapTab();

        this.mapViewer.openEventConsume(event);

        this.urlStateContainer.setCenter(event.location);
    }

    private changeTab(tab: Tab) {
        if (this.tabDataViewerMap.hasOwnProperty(tab)) {
            this.selectedDataViewer = this.tabDataViewerMap[tab];

            const resultContainer = this.resultContainer;

            this.renderSelectedTab(resultContainer);
        }
    }

    private render(resultContainer: ResultContainer) {
        this.renderSelectedTab(resultContainer);
        this.statsViewer.render(resultContainer);
    }

    private renderSelectedTab(resultContainer: ResultContainer) {
        this.selectedDataViewer.render(resultContainer);
    }
}