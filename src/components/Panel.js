import SearchInput from './SearchInput';
import ErrorView from './ErrorView';
import List from './List';
import { div } from '../util/dom';

export default class Panel {
    constructor({ style }, { onSelect }, autocomplete) {
        this.components = {
            searchInput: new SearchInput({ style }, undefined, autocomplete),
            errorView: new ErrorView({ style }),
            list: new List({ style }, { onSelect }, autocomplete)
        };

        this.element = div(
            {
                className: style.panel
            },
            this.components.searchInput.elements.wrapper,
            this.components.errorView.elements.wrapper,
            this.components.list.elements.wrapper
        );
    }

    show(results) {
        this.components.list.show(results.data);
    }

    error({ message }) {
        this.components.errorView.show(message);
    }

    clear() {
        this.components.errorView.hide();
        this.components.list.hide();
    }

}
