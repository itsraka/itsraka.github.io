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
} from "./framework/components/criteria-converter"

import {UniqueKeyChecker} from "./framework/components/unique-key-checker"
import {UrlStateContainer} from "./framework/components/url-state-container"
import {ResultContainer} from "./framework/components/result-container"
import {CheckboxFilterMatchBuilder} from "./framework/components/checkbox-filter-match-builder"
import {CheckboxStateModifierBuilder} from "./framework/components/checkbox-state-modifier-builder"
import {FilledFilterState} from "./framework/components/filtration/filter-state"
import {FilterContainerBuilder} from "./framework/components/filtration/filter-container"
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
import {MultiSelectModifier} from "./framework/components/common-modifiers"
import {distance} from "./framework/components/location"
import {OpenEventPublisher} from "./framework/components/event_publishers"
import {createAliasMap} from "./framework/components/alias-map"
import {Application} from "./framework/application"

declare const M: any;
declare const COURSES_DATA_JSON: any;

$(document).ready(function () {
    const KEY_CODE = {
        ESCAPE: 27,
        ENTER: 13,
        UP: 38,
        DOWN: 40,
        BACKSPACE: 8
    };

    const uniqueKeyChecker = new UniqueKeyChecker();

    const SEARCH_QUERY_DIRECTION = uniqueKeyChecker.unique("direction-query");
    const COURSE_CRITERIA_NAME = uniqueKeyChecker.unique("school-alias");
    const CITY_CRITERIA_NAME = uniqueKeyChecker.unique("city-alias");
    const DIRECTION_CRITERIA_NAME = uniqueKeyChecker.unique("direction-category-alias");
    const FREE_CRITERIA_NAME = uniqueKeyChecker.unique("free");
    const EMPLOYMENT_GUARANTEE_CRITERIA_NAME = uniqueKeyChecker.unique("employment-guarantee");
    const SCHOOL_BY_COMPANY_CRITERIA_NAME = uniqueKeyChecker.unique("school-by-company");
    const EXISTS_PLAN_CRITERIA_NAME = uniqueKeyChecker.unique("exists-plan");
    const TEACHER_WORKS_CRITERIA_NAME = uniqueKeyChecker.unique("teacher-works");

    const multiSelectCriteriaConverter = new MultiSelectCriteriaConverter();
    const multiCheckboxCriteriaConverter = new MultiCheckboxCriteriaConverter();
    const identityCriteriaConverter = new IdentityCriteriaConverter();

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
            [SEARCH_QUERY_DIRECTION]: identityCriteriaConverter,
            [COURSE_CRITERIA_NAME]: multiCheckboxCriteriaConverter,
            [CITY_CRITERIA_NAME]: multiSelectCriteriaConverter,
            [DIRECTION_CRITERIA_NAME]: multiSelectCriteriaConverter,
            [FREE_CRITERIA_NAME]: identityCriteriaConverter,
            [EMPLOYMENT_GUARANTEE_CRITERIA_NAME]: identityCriteriaConverter,
            [SCHOOL_BY_COMPANY_CRITERIA_NAME]: identityCriteriaConverter,
            [EXISTS_PLAN_CRITERIA_NAME]: identityCriteriaConverter,
            [TEACHER_WORKS_CRITERIA_NAME]: identityCriteriaConverter,
        }
    );

    const $directionSearch = $("#js-direction-autocomplete");
    const $courseSearch = $("#js-school-autocomplete");
    const $selectedDirectoryCategoriesContainer = $("#js-selected-directions");
    const $selectedCitiesContainer = $("#js-selected-cities");
    const $selectedCoursesContainer = $("#js-selected-courses");
    let directionAutocompleteCloser = new EmptyCloseComponent();
    let schoolAutocompleteCloser = new EmptyCloseComponent();

    const selectedCourseListView = new AutocompletedCheckboxListView($selectedCoursesContainer, "course");

    const $freeStatusCheckbox = $("#js-full-free");
    const $teacherWorkInCompanyCheckbox = $("#js-teacher-work-in-company");
    const $employmentGuaranteeCheckbox = $("#js-employment-guarantee");
    const $planExistsCheckbox = $("#js-course-with-plan");
    const $schoolByCompanyCheckbox = $("#js-course-by-company");
    const $linkView = $("#js-nearest-center-companies");

    const application = new Application(
        urlStateContainer,
        new MapViewerManager(new CourseLocationGrouper(), CourseGroupMarker),
        new SchoolDataViewer($linkView, urlStateContainer),
        new SchoolStatsViewer(
            $("#js-result-course-count"),
            $("#js-result-direction-count"),
            $("#js-result-city-count")
        ),
        new ApiClient(COURSES_DATA_JSON),
        new CourseArchiver(),
        new FilterContainerBuilder({
            [COURSE_CRITERIA_NAME]: new AliasFilterStateMatcherBuilder($selectedCoursesContainer),
            [FREE_CRITERIA_NAME]: new FreeStatusFilterMatchBuilder($freeStatusCheckbox, urlStateContainer.getCriteriaByName(FREE_CRITERIA_NAME)),
            [EXISTS_PLAN_CRITERIA_NAME]: new PlanExistsFilterMatchBuilder($planExistsCheckbox, urlStateContainer.getCriteriaByName(EXISTS_PLAN_CRITERIA_NAME)),
            [SCHOOL_BY_COMPANY_CRITERIA_NAME]: new SchoolByCompanyFilterMatchBuilder($schoolByCompanyCheckbox, urlStateContainer.getCriteriaByName(SCHOOL_BY_COMPANY_CRITERIA_NAME)),
        }, {
            [SEARCH_QUERY_DIRECTION]: new DirectionTitleStateModifierBuilder($directionSearch, urlStateContainer.getCriteriaByName(SEARCH_QUERY_DIRECTION)),
            [DIRECTION_CRITERIA_NAME]: new DirectionCategoryStateModifierBuilder($selectedDirectoryCategoriesContainer),
            [CITY_CRITERIA_NAME]: new CityStateModifierBuilder($selectedCitiesContainer),
            [TEACHER_WORKS_CRITERIA_NAME]: new TeacherWorkInCompanyStateModifierBuilder($teacherWorkInCompanyCheckbox, urlStateContainer.getCriteriaByName(TEACHER_WORKS_CRITERIA_NAME)),
            [EMPLOYMENT_GUARANTEE_CRITERIA_NAME]: new EmploymentGuaranteeStateModifierBuilder($employmentGuaranteeCheckbox, urlStateContainer.getCriteriaByName(EMPLOYMENT_GUARANTEE_CRITERIA_NAME)),
        }),
        new CallbackFilterViewBuilder(function (list) {
            const courseAutocomplete = new CourseAutocomplete(list);

            ($directionSearch as any).autocomplete({
                data: courseAutocomplete.getDirectionNameMap(),
                onAutocomplete: function (name) {
                    application.searchAndRender();
                }
            });

            directionAutocompleteCloser = M.Autocomplete.getInstance($directionSearch);

            ($courseSearch as any).autocomplete({
                data: courseAutocomplete.getSchoolNameMap(),
                onAutocomplete: function (courseName) {
                    const courseAlias = courseAutocomplete.findCourseAliasByName(courseName);

                    selectedCourseListView.addChecked(courseName, courseAlias);

                    $courseSearch.val("");

                    application.searchAndRender();
                }
            });

            selectedCourseListView.render(list, urlStateContainer.getCriteriaByName(COURSE_CRITERIA_NAME));

            schoolAutocompleteCloser = M.Autocomplete.getInstance($courseSearch);

            const cityPriorityListGenerator = new CityPriorityListGenerator();
            const cityListRender = new CityListRender($selectedCitiesContainer);
            cityListRender.render(cityPriorityListGenerator.generate(list), urlStateContainer.getCriteriaByName(CITY_CRITERIA_NAME, []));

            const directionCategoryPriorityListGenerator = new DirectionCategoryPriorityListGenerator();
            const directionCategoryListRender = new DirectionCategoryListRender($selectedDirectoryCategoriesContainer);
            directionCategoryListRender.render(directionCategoryPriorityListGenerator.generate(list), urlStateContainer.getCriteriaByName(DIRECTION_CRITERIA_NAME, []));
        }),
    );

    application.start();

    /**
     *
     * @param event
     * @param {EmptyCloseComponent} closer
     */
    function keyupSearch(event, closer) {
        if (event.keyCode === KEY_CODE.ENTER) {
            application.searchAndRender();

            closer.close();
        } else if (event.keyCode === KEY_CODE.ESCAPE) {
            closer.close();
        }
    }

    $directionSearch.on("keyup", function (event) {
        keyupSearch(event, directionAutocompleteCloser);
    });

    $courseSearch.on("keyup", function (event) {
        keyupSearch(event, schoolAutocompleteCloser);
    });

    const $container = $(".js-container");
    const resultCountComponent = new ResultCountComponent(new SubmitAction(function () {
        application.renderAfterSearch();
    }));

    const inputChange = function () {
        resultCountComponent.setTop($(this).offset().top - $container.offset().top);
        resultCountComponent.showCount(application.searchAndCount());
    };

    $selectedCitiesContainer.on("change", "input", inputChange);
    $selectedCoursesContainer.on("change", "input", inputChange);
    $selectedDirectoryCategoriesContainer.on("change", "input", inputChange);
    $freeStatusCheckbox.on("change", inputChange);
    $planExistsCheckbox.on("change", inputChange);
    $employmentGuaranteeCheckbox.on("change", inputChange);
    $schoolByCompanyCheckbox.on("change", inputChange);
    $teacherWorkInCompanyCheckbox.on("change", inputChange);

    $("#js-search-submit").click(function () {
        application.searchAndRender();
    });

    ($("#js-tabs") as any).tabs();
    $("#js-select-result-tab").click(function () {
        application.selectResultTab();
    });
    $("#js-select-map-tab").click(function () {
        application.selectGoogleMapTab();
    });
});

// <required-project-logic>
class CourseLocationGrouper implements LocationGrouper {
    group(list) {
        return createLatitudeLongitudeContainer(list);
    }
}

class CourseGroupMarker extends GroupMarker {
    getTitle() {
        const titles = [];

        for (let item of this.list) {
            titles.push(item.name);
        }

        return titles.join(" | ");
    }

    getContent() {
        const contents = [];

        for (let course of this.list) {
            const directions = [];

            for (let direction of course.directions) {
                directions.push(`<a href="` + direction.url + `" target="_blank">` + direction.title + `</a>`);
            }

            const content = `<div class="infowindow"><a class="infowindow-company" href=${course.url} target="_blank">${course.name}</a><br/><br/>${directions.join("<br/>")}</div>`;
            contents.push(content);
        }

        return contents.join("<br/><br/>");
    }
}

class CourseArchiver implements Archiver {
    unzip(data) {
        return data;
    }
}

class Course {
    public readonly alias: string;
    public readonly name: string;
    public readonly url: string;
    public readonly directions: Array<any>;
    public readonly cities: Array<any>;

    constructor(alias, name, url, directions, cities) {
        this.alias = alias;
        this.name = name;
        this.url = url;
        this.directions = directions;
        this.cities = cities;
    }
}

function createLatitudeLongitudeContainer(courses: Array<Course>): LocationListMap {
    const map = new LocationListMap();

    for (let course of courses) {
        for (let city of course.cities) {
            for (let office of city.locations) {
                map.add(
                    office.latitude,
                    office.longitude,
                    new Course(
                        course.alias,
                        course.name,
                        course.url,
                        course.directions,
                        course.cities
                    )
                );
            }
        }
    }

    return map;
}

class SchoolStatsViewer extends StatsViewer {
    private $courseCount: any;
    private $directionCount: any;
    private $cityCount: any;

    constructor($courseCount, $directionCount, $cityCount) {
        super();
        this.$courseCount = $courseCount;
        this.$directionCount = $directionCount;
        this.$cityCount = $cityCount;
    }

    render(result) {
        const courseCounter = new UniqueMapCounter();
        const directionCounter = new UniqueMapCounter();
        const citiesCounter = new UniqueMapCounter();

        const courses = result.getResult();

        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            const directions = course.directions;
            const cities = course.cities;

            courseCounter.add(course.alias);

            for (let j = 0; j < directions.length; j++) {
                directionCounter.add(directions[j].category.alias);
            }

            for (let j = 0; j < cities.length; j++) {
                citiesCounter.add(cities[j].alias);
            }
        }

        this.$courseCount.html(courseCounter.getCount());
        this.$directionCount.html(directionCounter.getCount());
        this.$cityCount.html(citiesCounter.getCount());
    }
}

class UniqueMapCounter {
    private readonly map: { [s: string]: boolean };
    private count: number;

    constructor() {
        this.map = {};
        this.count = 0;
    }

    add(value) {
        if (this.map.hasOwnProperty(value)) {
            return;
        }

        this.map[value] = true;
        ++this.count;
    }

    getCount() {
        return this.count;
    }
}

class CourseAutocomplete {
    private readonly courseNameMap: { [s: string]: any };
    private readonly directionNameMap: { [s: string]: any };
    private readonly courseNameAliasMap: { [s: string]: string };

    constructor(courses: Array<Course>) {
        const directionNameMap = {};
        const courseNameMap = {};
        const courseNameAliasMap = {};

        for (let i = 0; i < courses.length; i++) {
            /** @type Course */
            const course = courses[i];

            courseNameMap[course.name] = null;
            courseNameAliasMap[course.name] = course.alias;

            const directions = course.directions;

            for (let j = 0; j < directions.length; j++) {
                const direction = directions[j];

                directionNameMap[direction.title] = null;
            }

        }

        this.courseNameMap = courseNameMap;
        this.directionNameMap = directionNameMap;
        this.courseNameAliasMap = courseNameAliasMap;
    }

    findCourseAliasByName(name: string): string {
        if (this.courseNameAliasMap.hasOwnProperty(name)) {
            return this.courseNameAliasMap[name];
        }

        return "";
    }

    getSchoolNameMap() {
        return this.courseNameMap;
    }

    getDirectionNameMap() {
        return this.directionNameMap;
    }
}

class DirectionStateModifier implements Modifier {
    private readonly matcher: (any) => boolean;

    constructor(matcher) {
        this.matcher = matcher;
    }

    modify(school: Course) {
        const matchDirections = [];

        const matcher = this.matcher;

        const directions = school.directions;

        for (let j = 0; j < directions.length; j++) {
            const direction = directions[j];

            if (matcher(direction)) {
                matchDirections.push(direction);
            }
        }

        if (matchDirections.length > 0) {
            return new Course(
                school.alias,
                school.name,
                school.url,
                matchDirections,
                school.cities
            );
        }

        return null;
    }
}

class DirectionTitleStateModifier extends DirectionStateModifier {
    constructor(title: string) {
        const search = title.toLowerCase();

        super(function (direction) {
            return direction.title.toLowerCase().indexOf(search) !== -1;
        });
    }
}

class DirectionCategoryStateModifier extends DirectionStateModifier {
    constructor(aliases: Array<string>) {
        const aliasMap = createAliasMap(aliases);

        super(function (direction) {
            return aliasMap.hasOwnProperty(direction.category.alias);
        });
    }
}

class TeacherWorkInCompanyStateModifier extends DirectionStateModifier {
    constructor(aliases) {
        super(function (direction) {
            const teachers = direction.teachers;

            if (teachers === null) {
                return false;
            }

            for (let i = 0; i < teachers.length; i++) {
                const teacher = teachers[i];

                if (teacher.job === true) {
                    return true;
                }
            }

            return false;
        });
    }
}

class EmploymentGuaranteeStateModifier extends DirectionStateModifier {
    constructor(aliases) {
        super(function (direction) {
            return direction.employment_guarantee === true;
        });
    }
}


class DirectionTitleStateModifierBuilder implements FilterStateModifierBuilder {
    private readonly $element: any;

    constructor($element, text) {
        this.$element = $element;

        if (text !== null) {
            this.$element.val(text);
        }
    }

    build() {
        const text = this.$element.val();

        if (text.length > 0) {
            return new FilterStateModifier(
                FilledFilterState(text),
                new DirectionTitleStateModifier(text),
            );
        }

        return NullFilterStateModifierObject;
    }
}

class DirectionCategoryStateModifierBuilder implements FilterStateModifierBuilder {
    constructor(private readonly $element: any) {
    }

    build() {
        const aliases = getCheckedAliases($("input", this.$element));

        if (aliases.length > 0) {
            return new FilterStateModifier(FilledFilterState(aliases), new DirectionCategoryStateModifier(aliases));
        }

        return NullFilterStateModifierObject;
    }
}

class CityStateModifier extends MultiSelectModifier {
    modify(course: Course) {
        const cities = [];

        for (let i = 0; i < course.cities.length; i++) {
            const city = course.cities[i];

            if (this.aliasMap.hasOwnProperty(city.alias)) {
                cities.push(city);
            }
        }

        if (cities.length > 0) {
            return new Course(
                course.alias,
                course.name,
                course.url,
                course.directions,
                cities
            );
        }

        return null;
    }
}

class CityStateModifierBuilder implements FilterStateModifierBuilder {
    constructor(private readonly $element: any) {
    }

    build() {
        const aliases = getCheckedAliases($("input", this.$element));

        if (aliases.length > 0) {
            return new FilterStateModifier(FilledFilterState(aliases), new CityStateModifier(aliases));
        }

        return NullFilterStateModifierObject;
    }
}

class OptionCountComponent {
    public readonly alias: string;
    public readonly name: string;
    public count: number;

    constructor(alias, name) {
        this.alias = alias;
        this.name = name;
        this.count = 0;
    }

    increment(value: number) {
        this.count += value;
    }
}

abstract class OptionCountComponentPriorityListGenerator {
    private readonly map: { [s: string]: OptionCountComponent };

    constructor() {
        this.map = {};
    }

    abstract generate(courses: Array<Course>): Array<OptionCountComponent>;

    increment(alias: string, name: string, value: number) {
        /** @type OptionCountComponent */
        let optionCountComponent;

        if (this.map.hasOwnProperty(alias)) {
            optionCountComponent = this.map[alias];
        } else {
            optionCountComponent = new OptionCountComponent(alias, name);

            this.map[alias] = optionCountComponent;
        }

        optionCountComponent.increment(value);
    }

    sort(): Array<OptionCountComponent> {
        const result = [];

        for (let alias in this.map) {
            if (this.map.hasOwnProperty(alias)) {
                result.push(this.map[alias]);
            }
        }

        result.sort(compareOptionCountComponent);

        return result;
    }
}

function compareOptionCountComponent(a: OptionCountComponent, b: OptionCountComponent): number {
    const diff = b.count - a.count;

    if (diff === 0) {
        return compareString(b.name, a.name);
    }

    return diff;
}

function compareString(a: string, b: string): number {
    if (a > b) {
        return 1;
    }

    if (a < b) {
        return -1;
    }

    return 0;
}

class CityPriorityListGenerator extends OptionCountComponentPriorityListGenerator {
    generate(courses) {
        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];

            const value = course.directions.length;

            for (let j = 0; j < course.cities.length; j++) {
                const city = course.cities[j];

                this.increment(city.alias, city.name, value);
            }
        }

        return this.sort();
    }
}

class DirectionCategoryPriorityListGenerator extends OptionCountComponentPriorityListGenerator {
    generate(courses) {
        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];

            const directions = course.directions;

            for (let j = 0; j < directions.length; j++) {
                const direction = directions[j];
                const category = direction.category;

                this.increment(category.alias, category.name, 1);
            }
        }

        return this.sort();
    }
}

abstract class OptionCountComponentListRender {
    constructor(private readonly $element: any) {
    }

    render(list, aliases) {
        const views = [];
        const aliasMap = createAliasMap(aliases);

        for (let i = 0; i < list.length; i++) {
            const item = list[i];

            views.push(this.view(item, aliasMap.hasOwnProperty(item.alias)));
        }

        this.$element.html(views.join(""));
    }

    abstract view(item: OptionCountComponent, checked: boolean);
}

class CommonOptionCountComponentListRender extends OptionCountComponentListRender {
    private readonly componentAlias: string;

    constructor($element, componentAlias) {
        super($element);
        this.componentAlias = componentAlias;
    }

    view(item: OptionCountComponent, checked: boolean): string {
        const id = `js-${this.componentAlias}-${item.alias}`;

        let checkedAttr = "";
        if (checked) {
            checkedAttr = "checked";
        }

        return `<p>
    <label for="${id}">
        <input type="checkbox" id="${id}" data-alias="${item.alias}" ${checkedAttr} />
        <span>${item.name}</span>
    </label>
</p>`
    }
}

class CityListRender extends CommonOptionCountComponentListRender {
    constructor($element) {
        super($element, "city");
    }
}

class DirectionCategoryListRender extends CommonOptionCountComponentListRender {
    constructor($element) {
        super($element, "direction-cateogory");
    }
}

class FreeStatusFilterMatch implements Matcher {
    match(item) {
        return item.free_status === 1;
    }
}

class FreeStatusFilterMatchBuilder extends CheckboxFilterMatchBuilder {
    constructor($element, aliases) {
        super($element, aliases, FreeStatusFilterMatch);
    }
}

class PlanExistsFilterMatch implements Matcher {
    match(item) {
        return item.plan_exists === true;
    }
}

class PlanExistsFilterMatchBuilder extends CheckboxFilterMatchBuilder {
    constructor($element, aliases) {
        super($element, aliases, PlanExistsFilterMatch);
    }
}

class SchoolByCompanyFilterMatch implements Matcher {
    match(item) {
        return item.is_company === true;
    }
}

class SchoolByCompanyFilterMatchBuilder extends CheckboxFilterMatchBuilder {
    constructor($element, aliases) {
        super($element, aliases, SchoolByCompanyFilterMatch);
    }
}

class TeacherWorkInCompanyStateModifierBuilder extends CheckboxStateModifierBuilder {
    constructor($element, aliases) {
        super($element, aliases, TeacherWorkInCompanyStateModifier);
    }
}

class EmploymentGuaranteeStateModifierBuilder extends CheckboxStateModifierBuilder {
    /**
     *
     * @param {{}} $element
     * @param {Array} aliases
     */
    constructor($element, aliases) {
        super($element, aliases, EmploymentGuaranteeStateModifier);
    }
}

class SchoolDataViewer implements HTMLViewer {
    constructor(private readonly $element: any,
                private readonly urlStateContainer: UrlStateContainer,) {
    }

    render(result: ResultContainer) {
        const courses = result.getResult();
        const center = this.urlStateContainer.getCenter();

        courses.sort(function (a, b) {
            return minSchoolDistance(a, center) - minSchoolDistance(b, center);
        });

        const views = [];

        const length = Math.min(courses.length, 20);
        for (let i = 0; i < length; i++) {
            views.push(renderSchool(courses[i]));
        }

        this.$element.html(views.join(""));
    }

    setOpenEventPublisher(publisher: OpenEventPublisher) {

    }
}

function minSchoolDistance(school, center) {
    const cities = school.cities;

    let result = distance(cities[0].locations[0], center);

    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const locations = city.locations;

        for (let j = 0; j < locations.length; j++) {
            const location = locations[j];

            result = Math.min(result, distance(location, center));
        }
    }

    return result;
}

function renderSchool(school) {
    const views = [];

    for (let i = 0; i < school.directions.length; i++) {
        const direction = school.directions[i];

        views.push(`<p><a href="${direction.url}" target="_blank">${direction.title}</a></p>`);
    }

    return `
        <div class="row">
            <div class="col s12 work-block z-depth-2 card-panel hoverable">
                <div class="col s12 header">
                    <div class="title"><a href="${school.url}" target="_blank">${school.name}</a></div>
                </div>
                <div class="col s12 message">
                    ${views.join("")}
                </div>
            </div>
        </div>
    `;
}

// </current-project-logic>