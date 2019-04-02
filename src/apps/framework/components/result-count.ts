import {SubmitAction} from "./submit-action"

export class ResultCountProps {
    public readonly shown: boolean;
    public readonly loaded: boolean;
    public readonly submit: boolean;
    public readonly empty: boolean;
    public readonly count: number;

    constructor({shown = false, loaded = false, submit = false, empty = false, count = 0} = {}) {
        this.shown = shown;
        this.loaded = loaded;
        this.submit = submit;
        this.empty = empty;
        this.count = count;
    }
}

export class ResultCountComponent {
    private $hint: any;
    private $loader: any;
    private $count: any;
    private $empty: any;
    private $submit: any;

    constructor(submitAction: SubmitAction) {
        this.$hint = $("#js-count-hint");
        this.$loader = $(".js-count-loader", this.$hint);
        this.$count = $(".js-count-result", this.$hint);
        this.$empty = $(".js-empty", this.$hint);
        this.$submit = $(".js-submit", this.$hint);

        $(".js-close", this.$hint).click(() => this.hide());
        this.$submit.click(() => {
            submitAction.submit();
            this.hide();
        });
    }

    setTop(top: number) {
        this.$hint.css("top", top);
    }

    showCount(count: number) {
        this.render(new ResultCountProps({
            shown: true,
            submit: count > 0,
            empty: count === 0,
            count: count
        }));
    }

    render(props: ResultCountProps) {
        this.$hint.toggleClass("shown", props.shown);
        this.$loader.toggleClass("loader", props.loaded);
        this.$count.html(props.count);
        this.$empty.toggle(props.empty);
        this.$submit.toggle(props.submit);
    }

    hide() {
        this.render(new ResultCountProps());
    }
}
