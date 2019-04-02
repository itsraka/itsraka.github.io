export class SubmitAction {
    constructor(private readonly handler: () => void) {
    }

    submit() {
        this.handler();
    }
}
