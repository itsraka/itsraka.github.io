import {
    ApiClient,
    AutocompletedCheckboxListView,
    EmptyCloseComponent,
    HTMLViewer,
    StatsViewer,
    Archiver,
    LocationGrouper,
    MapViewerManager,
    getCheckedAliases,
} from "./framework/components"

import {
    MultiCheckboxCriteriaConverter,
    MultiSelectCriteriaConverter,
    IdentityCriteriaConverter,
    RangeCriteriaConverter,
} from "./framework/components/criteria-converter"

import {UniqueKeyChecker} from "./framework/components/unique-key-checker"
import {UrlStateContainer} from "./framework/components/url-state-container"
import {ResultContainer} from "./framework/components/result-container"
import {CheckboxFilterMatchBuilder} from "./framework/components/checkbox-filter-match-builder"
import {CheckboxStateModifierBuilder} from "./framework/components/checkbox-state-modifier-builder"
import {FilledFilterState} from "./framework/components/filtration/filter-state"
import {FilterContainerBuilder} from "./framework/components/filtration/filter-container"
import {
    FilterStateMatcher,
    FilterStateMatcherBuilder,
    NullFilterStateMatcherObject
} from "./framework/components/filtration/filter-state-matcher"
import {
    FilterStateModifier,
    FilterStateModifierBuilder,
    NullFilterStateModifierObject
} from "./framework/components/filtration/filter-state-modifier"
import {Modifier} from "./framework/components/filtration/modifier"
import {Matcher} from "./framework/components/filtration/matcher"
import {LocationListMap} from "./framework/components/location-map"
import {GroupMarker} from "./framework/components/marker"
import {CallbackFilterViewBuilder} from "./framework/components/filter-view-builder"
import {AliasFilterStateMatcherBuilder} from "./framework/components/alias-filter-state-matcher"
import {SubmitAction} from "./framework/components/submit-action"
import {ResultCountComponent} from "./framework/components/result-count"
import {MultiSelectMatcher} from "./framework/components/common-matchers"
import {Location, distance} from "./framework/components/location"
import {OpenEvent} from "./framework/components/events"
import {OpenEventPublisher} from "./framework/components/event_publishers"
import {createAliasMap} from "./framework/components/alias-map"
import {createAliasStateMapByCheckboxes} from "./framework/components/alias-state-map"

import {Application} from "./framework/application"

declare const M: any;
declare const COMPANIES_DATA_JSON: any;

$(document).ready(function () {
    const KEY_CODE = {
        ESCAPE: 27,
        ENTER: 13,
        UP: 38,
        DOWN: 40,
        BACKSPACE: 8
    };

    const uniqueKeyChecker = new UniqueKeyChecker();

    const SEARCH_QUERY_VACANCY = uniqueKeyChecker.unique("vacancy-query");
    const CITY_CRITERIA_NAME = uniqueKeyChecker.unique("vacancy-city");
    const REVIEW_COUNT_CRITERIA_NAME = uniqueKeyChecker.unique("company-review");
    const COMPANY_CRITERIA_NAME = uniqueKeyChecker.unique("company");
    const NEWEST_CRITERIA_NAME = uniqueKeyChecker.unique("vacancy-newest");
    const SALARY_CRITERIA_NAME = uniqueKeyChecker.unique("vacancy-salary");
    const COMPANY_SIZE_CRITERIA_NAME = uniqueKeyChecker.unique("company-size");
    const COMPANY_TYPE_CRITERIA_NAME = uniqueKeyChecker.unique("company-type");

    const multiCheckboxCriteriaConverter = new MultiCheckboxCriteriaConverter();
    const identityCriteriaConverter = new IdentityCriteriaConverter();
    const multiSelectCriteriaConverter = new MultiSelectCriteriaConverter();
    const urlStateContainer = new UrlStateContainer(
        {
            center: {
                latitude: 50.4435158,
                longitude: 30.5030242
            },
            zoom: 14
        },
        500,
        uniqueKeyChecker.keys(),
        {
            [REVIEW_COUNT_CRITERIA_NAME]: identityCriteriaConverter,
            [SEARCH_QUERY_VACANCY]: identityCriteriaConverter,
            [COMPANY_CRITERIA_NAME]: multiCheckboxCriteriaConverter,
            [CITY_CRITERIA_NAME]: multiCheckboxCriteriaConverter,
            [NEWEST_CRITERIA_NAME]: identityCriteriaConverter,
            [SALARY_CRITERIA_NAME]: new RangeCriteriaConverter(),
            [COMPANY_SIZE_CRITERIA_NAME]: multiSelectCriteriaConverter,
            [COMPANY_TYPE_CRITERIA_NAME]: multiSelectCriteriaConverter,
        }
    );

    const $vacancySearch = $("#js-vacancy-autocomplete");
    const $companySearch = $("#js-company-autocomplete");
    const $citySearch = $("#js-city-autocomplete");
    const $reviewExists = $("#js-review-exists");
    const $newest = $("#js-vacancy-newest");
    const $linkView = $("#js-nearest-center-companies");
    const $selectedCompaniesContainer = $("#js-selected-companies");
    const $selectedCitiesContainer = $("#js-selected-cities");
    const $salaryFrom = $("#js-salary-from");
    const $salaryTo = $("#js-salary-to");
    const $companySizes = $("#js-company-size-filter input");
    const $companyTypes = $("#js-company-type-filter input");

    const selectedCompanyListView = new AutocompletedCheckboxListView($selectedCompaniesContainer, "company");
    const selectedCityListView = new AutocompletedCheckboxListView($selectedCitiesContainer, "city");

    let vacancyAutocomplete = new EmptyCloseComponent();

    const application = new Application(
        urlStateContainer,
        new MapViewerManager(new CompanyLocationGrouper(), CompanyGroupMarker),
        new JobDataViewer($linkView, urlStateContainer),
        new JobStatsViewer(
            $("#js-result-vacancy-count"),
            $("#js-result-company-count"),
            $("#js-result-show-time")
        ),
        new ApiClient(COMPANIES_DATA_JSON),
        new CompanyArchiver(),
        new FilterContainerBuilder({
            [REVIEW_COUNT_CRITERIA_NAME]: new ReviewExistsFilterMatchBuilder($reviewExists, urlStateContainer.getCriteriaByName(REVIEW_COUNT_CRITERIA_NAME)),
            [COMPANY_CRITERIA_NAME]: new AliasFilterStateMatcherBuilder($selectedCompaniesContainer),
            [COMPANY_SIZE_CRITERIA_NAME]: new CompanySizeFilterMatchBuilder($companySizes, urlStateContainer.getCriteriaByName(COMPANY_SIZE_CRITERIA_NAME)),
            [COMPANY_TYPE_CRITERIA_NAME]: new CompanyTypeFilterMatchBuilder($companyTypes, urlStateContainer.getCriteriaByName(COMPANY_TYPE_CRITERIA_NAME)),
        }, {
            [CITY_CRITERIA_NAME]: new CityStateModifierBuilder($selectedCitiesContainer),
            [SEARCH_QUERY_VACANCY]: new TitleStateModifierBuilder($vacancySearch, urlStateContainer.getCriteriaByName(SEARCH_QUERY_VACANCY)),
            [NEWEST_CRITERIA_NAME]: new NewestStateModifierBuilder($newest, urlStateContainer.getCriteriaByName(NEWEST_CRITERIA_NAME)),
            [SALARY_CRITERIA_NAME]: new SalaryModifierBuilder($salaryFrom, $salaryTo, urlStateContainer.getCriteriaByName(SALARY_CRITERIA_NAME, {})),
        }),
        new CallbackFilterViewBuilder(function (list) {
            const jobAutocomplete = new JobAutocomplete(list);

            ($vacancySearch as any).autocomplete({
                data: jobAutocomplete.getVacancyNameMap(),
                onAutocomplete: function (name) {
                    application.searchAndRender();
                }
            });

            vacancyAutocomplete = M.Autocomplete.getInstance($vacancySearch);

            ($companySearch as any).autocomplete({
                data: jobAutocomplete.getCompanyNameMap(),
                onAutocomplete: function (companyName) {
                    const companyAlias = jobAutocomplete.findCompanyAliasByName(companyName);

                    selectedCompanyListView.addChecked(companyName, companyAlias);

                    $companySearch.val("");

                    application.searchAndRender();
                }
            });

            ($citySearch as any).autocomplete({
                data: jobAutocomplete.getCityNameMap(),
                onAutocomplete: function (cityName) {
                    const cityAlias = jobAutocomplete.findCityAliasByName(cityName);

                    selectedCityListView.addChecked(cityName, cityAlias);

                    $citySearch.val("");

                    application.searchAndRender();
                }
            });

            selectedCompanyListView.render(list, urlStateContainer.getCriteriaByName(COMPANY_CRITERIA_NAME));
            selectedCityListView.render(jobAutocomplete.getCities(), urlStateContainer.getCriteriaByName(CITY_CRITERIA_NAME));

            $vacancySearch.attr("placeholder", getRandomVacancyTitle(list));
            $companySearch.attr("placeholder", getRandomCompanyTitle(list));
        }),
    );

    application.start();

    const $container = $(".js-container");

    const resultCountComponent = new ResultCountComponent(new SubmitAction(function () {
        application.renderAfterSearch();
    }));

    const inputChange = function () {
        resultCountComponent.setTop($(this).offset().top - $container.offset().top);
        resultCountComponent.showCount(application.searchAndCount());
    };

    const enterPress = function (event) {
        if (event.keyCode === KEY_CODE.ENTER) {
            application.searchAndRender();
        }
    };

    $reviewExists.on("change", inputChange);
    $newest.on("change", inputChange);
    $companySizes.on("change", inputChange);
    $companyTypes.on("change", inputChange);
    $selectedCompaniesContainer.on("change", "input", inputChange);
    $selectedCitiesContainer.on("change", "input", inputChange);
    $salaryFrom.on("keyup", enterPress);
    $salaryTo.on("keyup", enterPress);

    $("#js-search-submit").click(function () {
        application.searchAndRender();
    });

    $vacancySearch.on("keyup", function (event) {
        if (event.keyCode === KEY_CODE.ENTER) {
            application.searchAndRender();

            vacancyAutocomplete.close();
        }

        if (event.keyCode === KEY_CODE.ESCAPE) {
            vacancyAutocomplete.close();
        }
    });

    ($("#js-tabs") as any).tabs();
    $("#js-select-result-tab").click(function () {
        application.selectResultTab();
    });
    $("#js-select-map-tab").click(function () {
        application.selectGoogleMapTab();
    });
});

class CompanyLocationGrouper implements LocationGrouper {
    group(list) {
        return createLatitudeLongitudeContainer(list);
    }
}

class CompanyGroupMarker extends GroupMarker {
    /**
     *
     * @returns {string}
     */
    getTitle() {
        const titles = [];

        for (let item of this.list) {
            titles.push(item.name);
        }

        return titles.join(" | ");
    }

    /**
     *
     * @returns {string}
     */
    getContent() {
        const contents = [];

        for (let company of this.list) {
            const vacancies = [];

            for (let vacancy of company.vacancies) {
                vacancies.push(`<a href="` + vacancyUrl(company.alias, vacancy.id) + `" target="_blank">` + vacancy.title + `</a>` + salary(vacancy.salary))
            }

            const office = company.offices[0];
            const content = `<div class="infowindow"><a class="infowindow-company" href=${companyUrl(company.alias)} target="_blank">${company.name}</a></br><p class="infowindow-address">${office.address}</p>${vacancies.join("<br/>")}</div>`;
            contents.push(content);
        }

        return contents.join("<br/><br/>");
    }
}

class CompanyArchiver implements Archiver {
    unzip(data) {
        return unzipCompanies(data);
    }
}

// </required-project-logic>

// <current-project-logic>
function unzipOffices(source) {
    const length = source.length;

    const result = new Array(length);

    for (let i = 0; i < length; i++) {
        const office = source[i];

        result[i] = new Office(
            unzipCity(office[0]),
            office[1],
            office[2]
        );
    }

    return result;
}

function unzipVacancies(source) {
    const length = source.length;

    const result = new Array(length);

    for (let i = 0; i < length; i++) {
        const vacancy = source[i];

        result[i] = new Vacancy(
            vacancy[0],
            vacancy[1],
            unzipCities(vacancy[2]),
            vacancy[3],
            vacancy[4],
            vacancy[5]
        );
    }

    return result;
}

function unzipCompanies(source) {
    const length = source.length;

    const result = new Array(length);

    for (let i = 0; i < length; i++) {
        const company = source[i];

        result[i] = new Company(
            company[0],
            company[1],
            unzipOffices(company[2]),
            unzipVacancies(company[3]),
            company[4],
            company[5],
            company[6]
        );
    }

    return result;
}

function unzipCity(source: Array<any>): City {
    return new City(
        source[0],
        source[1]
    )
}

function unzipCities(source: Array<any>): Array<City> {
    return source.map(unzipCity);
}

class Company {
    public alias: string;
    public name: string;
    public offices: Array<Office>;
    public vacancies: Array<Vacancy>;
    public review_count: number;
    public employee_count: number;
    public type: number;

    constructor(alias, name, offices, vacancies, review_count, employee_count, type) {
        this.alias = alias;
        this.name = name;
        this.offices = offices;
        this.vacancies = vacancies;
        this.review_count = review_count;
        this.employee_count = employee_count;
        this.type = type;
    }
}

class City {
    constructor(public readonly alias: string,
                public readonly name: string) {

    }
}

class Office {
    public city: City;
    public address: string;
    public location: Location;

    constructor(city, address, location) {
        this.city = city;
        this.address = address;
        this.location = new Location(location[0], location[1]);
    }
}

class Vacancy {
    public id: any;
    public title: string;
    public cities: Array<City>;
    public existsOffice: boolean;
    public salary: string;
    public published: string;

    constructor(id, title, cities, existsOffice, salary, published) {
        this.id = id;
        this.title = title;
        this.cities = cities;
        this.existsOffice = existsOffice;
        this.salary = salary;
        this.published = published;
    }
}

function createLatitudeLongitudeContainer(companies: Array<Company>): LocationListMap {
    const map = new LocationListMap();

    for (let company of companies) {
        for (let office of company.offices) {
            const vacancies = currentOfficeVacancies(office, company.vacancies);

            if (vacancies.length === 0) {
                continue;
            }

            map.add(
                office.location.latitude,
                office.location.longitude,
                new Company(
                    company.alias,
                    company.name,
                    [office],
                    vacancies,
                    company.review_count,
                    company.employee_count,
                    company.type
                )
            );
        }
    }

    return map;
}

function currentOfficeVacancies(office: Office, vacancies: Array<Vacancy>) {
    const result = [];

    for (let i = 0; i < vacancies.length; i++) {
        const vacancy = vacancies[i];

        if (vacancy.existsOffice === false || inCities(vacancy.cities, [office.city])) {
            result.push(vacancy);
        }
    }

    return result;
}

function inCities(vacancyCities: Array<City>, officeCities: Array<City>) {
    for (let j = 0; j < officeCities.length; j++) {
        for (let i = 0; i < vacancyCities.length; i++) {
            if (sameCity(vacancyCities[i], officeCities[j])) {
                return true
            }
        }
    }

    return false;
}

function sameCity(a: City, b: City): boolean {
    return a.alias === b.alias || a.name === b.name;
}

function vacancyUrl(companyAlias, vacancyId) {
    return `https://jobs.dou.ua/companies/${companyAlias}/vacancies/${vacancyId}/`;
}

function companyUrl(alias) {
    return `https://jobs.dou.ua/companies/${alias}/`;
}

function salary(value) {
    if (value) {
        return " (" + value + ")"
    }

    return "";
}

// </current-project-logic>

// <filter-project-logic>
class ReviewExistsMatcher implements Matcher {
    match(item: Company) {
        return item.review_count > 0;
    }
}

class CompanySizeFilterMatch extends MultiSelectMatcher {
    match(item: Company) {
        return this.aliasMap.hasOwnProperty(item.employee_count);
    }
}

class CompanyTypeFilterMatch extends MultiSelectMatcher {
    match(item: Company) {
        return this.aliasMap.hasOwnProperty(item.type);
    }
}

class VacancyModifier implements Modifier {
    private readonly matcher: (vacancy: Vacancy) => boolean;

    constructor(matcher) {
        this.matcher = matcher;
    }

    modify(company: Company) {
        const matchVacancies = [];
        const matcher = this.matcher;

        for (let j = 0; j < company.vacancies.length; j++) {
            const vacancy = company.vacancies[j];

            if (matcher(vacancy)) {
                matchVacancies.push(vacancy);
            }
        }

        if (matchVacancies.length > 0) {
            return new Company(
                company.alias,
                company.name,
                company.offices,
                matchVacancies,
                company.review_count,
                company.employee_count,
                company.type
            );
        }

        return null;
    }
}

class TitleModifier extends VacancyModifier {
    constructor(title: string) {
        const search = title.toLowerCase();

        super(function (vacancy) {
            return vacancy.title.toLowerCase().indexOf(search) !== -1;
        });
    }
}

class SalaryModifier extends VacancyModifier {
    /**
     *
     * @param {{}} criteria
     */
    constructor(criteria) {
        let {from, to} = criteria;

        if (to === 0) {
            to = Number.MAX_SAFE_INTEGER;
        }

        super(function (vacancy) {
            if (vacancy.salary === "") {
                return false;
            }

            return salaryBetweenRange(vacancy.salary, from, to);
        });
    }
}

function salaryBetweenRange(source, from, to) {
    const strings = source.split("–");
    const salaries = [];

    for (let i = 0; i < strings.length; i++) {
        const salary = parseInt(strings[i].replace(/\D/g, ""), 10);

        if (between(from, to, salary)) {
            return true;
        }

        salaries.push(salary);
    }

    if (salaries.length === 1) {
        salaries[1] = salaries[0];
    }

    return between(salaries[0], salaries[1], from) || between(salaries[0], salaries[1], to);
}

function between(from, to, value) {
    return from <= value && value <= to;
}

class ReviewExistsFilterMatchBuilder extends CheckboxFilterMatchBuilder {
    constructor($element, aliases) {
        super($element, aliases, ReviewExistsMatcher);
    }
}

class MultiSelectMatcherBuilder implements FilterStateMatcherBuilder {
    private $checkboxes: any;
    private className: any;

    constructor($checkboxes, aliases, className) {
        if (aliases !== null) {
            const aliasMap = createAliasMap(aliases);

            $checkboxes.each(function () {
                const $self = $(this);
                const alias = $self.attr("data-alias");

                if (aliasMap.hasOwnProperty(alias)) {
                    $self.attr("checked", "checked");
                }
            });
        }

        this.$checkboxes = $checkboxes;
        this.className = className;
    }

    build() {
        const aliases = getCheckedAliases(this.$checkboxes);

        if (aliases.length > 0) {
            return new FilterStateMatcher(FilledFilterState(aliases), new this.className(aliases));
        }

        return NullFilterStateMatcherObject;
    }
}

class CompanySizeFilterMatchBuilder extends MultiSelectMatcherBuilder {
    /**
     *
     * @param {{}} $checkboxes
     * @param {[string]} aliases
     */
    constructor($checkboxes, aliases) {
        super($checkboxes, aliases, CompanySizeFilterMatch);
    }
}

class CompanyTypeFilterMatchBuilder extends MultiSelectMatcherBuilder {
    /**
     *
     * @param {{}} $checkboxes
     * @param {[string]} aliases
     */
    constructor($checkboxes, aliases) {
        super($checkboxes, aliases, CompanyTypeFilterMatch);
    }
}

class TitleStateModifierBuilder implements FilterStateModifierBuilder {
    private $element: any;

    constructor($element, text) {
        this.$element = $element;

        if (text !== null) {
            this.$element.val(text);
        }
    }

    build() {
        const text = this.$element.val();

        if (text.length > 0) {
            return new FilterStateModifier(FilledFilterState(text), new TitleModifier(text));
        }

        return NullFilterStateModifierObject;
    }
}

class CityModifier implements Modifier {
    private aliasMap: { [s: string]: boolean; };
    private state: boolean;

    constructor(aliases, state) {
        this.aliasMap = createAliasMap(aliases);
        this.state = state;
    }

    modify(item: Company) {
        const matchOffices = [];
        const officeCities = [];

        for (let i = 0; i < item.offices.length; i++) {
            const office = item.offices[i];

            if (this.aliasMap.hasOwnProperty(office.city.alias) === this.state) {
                matchOffices.push(office);
                officeCities.push(office.city);
            }
        }

        if (matchOffices.length === 0) {
            return null;
        }

        const matchVacancies = [];

        for (let j = 0; j < item.vacancies.length; j++) {
            const vacancy = item.vacancies[j];

            if (vacancy.existsOffice === false || inCities(vacancy.cities, officeCities)) {
                matchVacancies.push(vacancy);
            }
        }

        if (matchVacancies.length === 0) {
            return null;
        }

        return new Company(
            item.alias,
            item.name,
            matchOffices,
            matchVacancies,
            item.review_count,
            item.employee_count,
            item.type
        );
    }
}

class CityStateModifierBuilder implements FilterStateModifierBuilder {
    constructor(private $element: any) {
    }

    build() {
        const aliasStateMap = createAliasStateMapByCheckboxes($("input", this.$element));

        if (aliasStateMap.selected.length) {
            return new FilterStateModifier(
                FilledFilterState(aliasStateMap.aliasStateMap),
                new CityModifier(aliasStateMap.selected, true),
            );
        }

        if (aliasStateMap.disabled.length) {
            return new FilterStateModifier(
                FilledFilterState(aliasStateMap.aliasStateMap),
                new CityModifier(aliasStateMap.disabled, false),
            );
        }

        return NullFilterStateModifierObject;
    }
}

function subNdays(n) {
    const offset = (24 * 60 * 60 * 1000) * n;
    const now = new Date();
    now.setTime(now.getTime() - offset);

    return `${now.getFullYear()}-${leftPadNumber(now.getMonth() + 1)}-${leftPadNumber(now.getDate())}`;
}

function leftPadNumber(number) {
    if (number > 9) {
        return number;
    }

    return "0" + number;
}

class NewestStateModifier extends VacancyModifier {
    constructor() {
        const published = subNdays(7);

        super(function (vacancy) {
            return vacancy.published >= published;
        });
    }
}

class NewestStateModifierBuilder extends CheckboxStateModifierBuilder {
    /**
     *
     * @param {{}} $element
     * @param {Array} aliases
     */
    constructor($element, aliases) {
        super($element, aliases, NewestStateModifier);
    }
}

class SalaryModifierBuilder implements FilterStateModifierBuilder {
    private $salaryFrom: any;
    private $salaryTo: any;

    constructor($salaryFrom, $salaryTo, {from, to} = {from: 0, to: 0}) {
        this.$salaryFrom = $salaryFrom;
        this.$salaryTo = $salaryTo;

        if (from > 0) {
            this.$salaryFrom.val(from);
        }

        if (to > 0) {
            this.$salaryTo.val(to);
        }
    }

    build() {
        const from = parseInt(this.$salaryFrom.val() || "0", 10);
        const to = parseInt(this.$salaryTo.val() || "0", 10);

        if (isNaN(from) || isNaN(to) || from < 0 || to < 0 || (from > to && to > 0) || (from === 0 && to === 0)) {
            return NullFilterStateModifierObject;
        }

        const criteria = {from, to};

        return new FilterStateModifier(
            FilledFilterState(criteria),
            new SalaryModifier(criteria)
        );
    }
}

class JobStatsViewer implements StatsViewer {
    private $vacancyCount: any;
    private $companyCount: any;
    private $duration: any;

    constructor($vacancyCount, $companyCount, $duration) {
        this.$vacancyCount = $vacancyCount;
        this.$companyCount = $companyCount;
        this.$duration = $duration;
    }

    render(result: ResultContainer) {
        this.$duration.html(result.getDuration());
        this.$vacancyCount.html(vacancyCount(result));
        this.$companyCount.html(result.getCount());
    }
}

/**
 *
 * @param {ResultContainer} result
 * @returns {number}
 */
function vacancyCount(result) {
    const companies = result.getResult();

    let count = 0;

    for (let i = 0; i < companies.length; i++) {
        count += companies[i].vacancies.length;
    }

    return count;
}

class JobAutocomplete {
    private companyNameMap: { [s: string]: null };
    private vacancyNameMap: { [s: string]: null };
    private cities: Array<City>;
    private cityNameMap: { [s: string]: null };
    private companyNameAliasMap: { [s: string]: string };
    private cityNameAliasMap: { [s: string]: string };

    constructor(companies) {
        const companyNameMap = {};
        const vacancyNameMap = {};
        const cityNameMap = {};
        const companyNameAliasMap = {};
        const cityNameAliasMap = {};
        const cities = [];

        for (let i = 0; i < companies.length; i++) {
            /** @type Company */
            const company = companies[i];

            companyNameMap[company.name] = null;
            companyNameAliasMap[company.name] = company.alias;

            const vacancies = company.vacancies;

            for (let j = 0; j < vacancies.length; j++) {
                const vacancy = vacancies[j];

                vacancyNameMap[vacancy.title] = null;

                for (let k = 0; k < vacancy.cities.length; k++) {
                    const city = vacancy.cities[k];

                    if (city.alias !== "" && cityNameMap.hasOwnProperty(city.name) === false) {
                        cityNameMap[city.name] = null;
                        cityNameAliasMap[city.name] = city.alias;
                        cities.push(city);
                    }
                }
            }

        }

        this.companyNameMap = companyNameMap;
        this.vacancyNameMap = vacancyNameMap;
        this.cityNameMap = cityNameMap;
        this.companyNameAliasMap = companyNameAliasMap;
        this.cityNameAliasMap = cityNameAliasMap;
        this.cities = cities;
    }

    getCompanyNameMap() {
        return this.companyNameMap;
    }

    getCityNameMap() {
        return this.cityNameMap;
    }

    getCities() {
        return this.cities;
    }

    getVacancyNameMap() {
        return this.vacancyNameMap;
    }

    findCompanyAliasByName(name: string): string {
        if (this.companyNameAliasMap.hasOwnProperty(name)) {
            return this.companyNameAliasMap[name];
        }

        return "";
    }

    findCityAliasByName(name: string): string {
        if (this.cityNameAliasMap.hasOwnProperty(name)) {
            return this.cityNameAliasMap[name];
        }

        return "";
    }
}

class JobDataViewer implements HTMLViewer {
    private $element: any;
    private urlStateContainer: UrlStateContainer;

    constructor($element, urlStateContainer) {
        this.$element = $element;
        this.urlStateContainer = urlStateContainer;
    }

    render(result: ResultContainer) {
        const companies = result.getResult();
        const center = this.urlStateContainer.getCenter();

        companies.sort(function (a, b) {
            return distance(a.offices[0].location, center) - distance(b.offices[0].location, center);
        });

        const views = [];

        const length = Math.min(companies.length, 20);
        for (let i = 0; i < length; i++) {
            views.push(renderCompany(companies[i]));
        }

        this.$element.html(views.join(""));
    }

    setOpenEventPublisher(publisher: OpenEventPublisher) {
        this.$element.on("click", "a.js-show-marker", function(event) {
            const $target = $(event.target);

            const latitude = $target.attr("data-location-latitude");
            const longitude = $target.attr("data-location-longitude");

            const openEvent = new OpenEvent(new Location(
                parseFloat(latitude),
                parseFloat(longitude),
            ));

            publisher.openEventPublish(openEvent);
        });
    }
}

function renderCompany(company: Company): string {
    const location = company.offices[0].location;
    const views = [];

    for (let i = 0; i < company.vacancies.length; i++) {
        const vacancy = company.vacancies[i];

        views.push(`<p><a href="${vacancyUrl(company.alias, vacancy.id)}" target="_blank">${vacancy.title}</a></p>`);
    }

    return `
        <div class="row">
            <div class="col s12 work-block z-depth-2 card-panel hoverable">
                <div class="col s12 header">
                    <div class="title">
                        <a href="${companyUrl(company.alias)}" target="_blank">${company.name}</a>
                        <a href="javascript:void(0);" class="js-show-marker" data-location-latitude="${location.latitude}" data-location-longitude="${location.longitude}" title="показати на карті">📌</a>
                    </div>
                </div>
                <div class="col s12 message">
                    ${views.join("")}
                </div>
            </div>
        </div>
    `;
}

function getRandomCompanyTitle(companies: Array<Company>): string {
    return getRandomItemByList(companies).name;
}

function getRandomVacancyTitle(companies: Array<Company>): string {
    const company = getRandomItemByList(companies);

    return getRandomItemByList(company.vacancies).title;
}

function getRandomItemByList(items: Array<any>) {
    const limit = items.length - 1;
    const index = Math.floor(Math.random() * limit);

    return items[index];
}

// </filter-project-logic>