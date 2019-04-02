export class AliasStateMap {
    constructor(
        public readonly aliasStateMap: { [s: string]: boolean },
        public readonly selected: Array<string>,
        public readonly disabled: Array<string>,
    ) {

    }
}

export function createAliasStateMapByCheckboxes($checkboxes: JQuery): AliasStateMap {
    const selected = [];
    const disabled = [];
    const aliasStateMap = {};

    $checkboxes.each(function () {
        const $self = $(this);
        const alias = $self.attr("data-alias");

        const checked = $self.is(":checked");
        aliasStateMap[alias] = checked;

        if (checked) {
            selected.push(alias);
        } else {
            disabled.push(alias);
        }
    });


    return new AliasStateMap(
        aliasStateMap,
        selected,
        disabled
    );
}