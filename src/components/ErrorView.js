import { div } from '../util/dom';

export default class ErrorView {
    constructor({ style }) {
        this.elements = {};

        this.elements.wrapper = div({ className: style.errorViewWrapper }, this.elements.error = div({
            className: style.errorView
        }));

        this.hide();
    }

    show(message) {
        this.elements.error.innerText = message;
        this.elements.wrapper.style.display = 'block';
    }

    hide() {
        this.elements.wrapper.style.display = 'none';
    }
}
