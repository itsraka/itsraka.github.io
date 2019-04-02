export class CheckboxComponent {
    private $element: any;

    constructor($element, checked) {
        this.$element = $element;

        if (checked === "1") {
            this.$element.attr("checked", "checked");
        }
    }

    checked(): boolean {
        return this.$element.is(":checked");
    }

    criteria() {
        return "1";
    }
}
