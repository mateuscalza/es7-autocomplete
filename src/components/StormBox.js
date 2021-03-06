import extend from 'extend';
import PresentText from './PresentText';
import Icon from './Icon';
import Multiple from './Multiple';
import Panel from './Panel';
import SelectSource from '../sources/SelectSource';
import Core from '../core/Core';
import Events from '../mixins/Events';
import Finding from '../mixins/Finding';
import PanelControl from '../mixins/PanelControl';
import Selecting from '../mixins/Selecting';
import Positioning from '../mixins/Positioning';
import Replica from '../mixins/Replica';
import Interface from '../mixins/Interface';
import debounce from '../util/debounce';
import {div} from '../util/dom';
import use from '../util/use';

export default class StormBox extends use(
    Core,
    Events,
    Positioning,
    Finding,
    PanelControl,
    Selecting,
    Interface,
    Replica
) {
    constructor(options) {

        const {
            hiddenInput, // Input with value, ID
            textInput, // Input with content
            source, // Data source (Source instance)
            selectInput, // If selectInput then hiddenInput, textInput and source are unnecessary
            style = {}, // Styles
            customText = false, // Users can type a custom text without value
            debounceTime = 600, // Time for wait key up
            queryParam = 'q', // Query param to filter sources
            minLength = 1, // The minimum number of characters a user must type before a search is performed
            clearOnType = false, // Clear current value and content when user type
            autoFind = false, // Find when user enter on element
            autoSelectWhenOneResult = true, // Select when return just one result, NOT VALID IF EMPTY ITEM IS ALLOWED, EXCEPT WHEN AUTOCOMPLETE IS CLOSED
            emptyItem, // Create a empty item to set values as null
            messages = {}, // Custom presentation messages
            references = {}, // Carry other fields value as param
            otherParams = {}, // Set more params to be passed to sources
            showValue = true, // Present value to user
            valueInOthersAs = 'ID', // Text to show "value" in additional data (if not string, is hide)
            minItemsLength = 1, // Min obrigatory items per page (if no space, scroll)
            multiple = false, // Option to select multiple items
            anchorElement = null, // Anchor element to be replaced by autocomplete, required for multiple
            distinct = true, // When multiple, select only distinct items
            hiddenInputName = null, // Required for multiple, name to create inputs with value
            textInputName = null, // Required for multiple, name to create inputs with value
            softErrors = false, // Soft errors, recommended for production
            disabled = false, // Is disabled
            readOnly = false // Is disabled
        } = options;

        super(options);

        // Key
        this.key = StormBox.currentSerialKey++;

        // Environment
        this.finding = false;
        this.open = false;
        this.typing = false;
        this.ignoreFocus = false;
        this.ignoreBlur = false;
        this.lastParams = null;
        this.forcedSearch = false;
        this.valueOnOpen = undefined;
        this.usedOtherFields = [];
        this.paginationData = null;
        this.direction = 'down';

        // Initial
        this.disabled = disabled;
        this.readOnly = readOnly;
        this.multiple = multiple;
        this.distinct = distinct;
        this.anchorElement = anchorElement;
        this.references = references;
        this.otherParams = otherParams;
        this.queryParam = queryParam;
        this.clearOnType = clearOnType;
        this.autoFind = autoFind;
        this.minLength = minLength;
        this.showValue = showValue;
        this.customText = customText;
        this.softErrors = softErrors;
        this.autoSelectWhenOneResult = autoSelectWhenOneResult;
        this.valueInOthersAs = valueInOthersAs;
        this.minItemsLength = minItemsLength;
        this.hiddenInputName = hiddenInputName;
        this.textInputName = textInputName;
        this.emptyItem = emptyItem;
        if (multiple) {
            this.emptyItem = false;
        }

        // Source validation
        if (!source && !selectInput) {
            throw new Error('Set a source or a selectInput.');
        }

        // Set data source
        this.source = source || new SelectSource(selectInput);

        // Set style props
        this.style = extend({
            hiddenInput: 'ac-hidden-input',
            textInput: 'ac-text-input',
            panel: 'ac-panel',
            listWrapper: 'ac-list-wrapper',
            item: 'ac-item',
            emptyItem: 'ac-empty-item',
            customTextItem: 'ac-custom-text-item',
            additional: 'ac-additional',
            searchInput: 'ac-search-input',
            searchInputWrapper: 'ac-search-input-wrapper',
            presentText: 'ac-present-text',
            presentCropText: 'ac-present-crop-text',
            presentTextItems: 'ac-present-items',
            presentInnerText: 'ac-present-inner-text',
            presentInnerValue: 'ac-present-inner-value',
            errorView: 'ac-error-view',
            errorViewWrapper: 'ac-error-view-wrapper',
            warningView: 'ac-warning-view',
            warningViewWrapper: 'ac-warning-view-wrapper',
            wrapper: 'ac-wrapper',
            top: 'ac-top',
            bottom: 'ac-bottom',
            openWrapper: 'ac-wrapper ac-open-wrapper',
            disabledWrapper: 'ac-wrapper ac-disabled-wrapper',
            readOnlyWrapper: 'ac-wrapper ac-read-only-wrapper',
            rightIcon: 'fa fa-search ac-icon',
            loadingRightIcon: 'fa fa-spinner ac-icon ac-loading-icon',
            disabledRightIcon: 'fa fa-ban ac-icon',
            readOnlyRightIcon: 'fa fa-info ac-icon',
            paginationWrapper: 'ac-pagination-wrapper',
            paginationLeft: 'ac-pagination-left',
            paginationRight: 'ac-pagination-right',
            paginationGoLeftIcon: 'fa fa-chevron-left',
            paginationGoRightIcon: 'fa fa-chevron-right',
            multipleWrapper: 'ac-multiple',
            multipleItemRemoveIcon: 'fa fa-remove ac-multiple-remove',
            disabledMultipleItemRemoveIcon: 'fa fa-remove ac-multiple-remove ac-multiple-remove-disabled',
            alreadySelected: 'fa fa-check-circle ac-already-selected'
        }, style);

        this.messages = extend({
            searchPlaceholder: 'Search...',
            emptyItemName: 'No value',
            singularMultipleItems: 'item',
            pluralMultipleItems: 'items',
            noData: 'No items'
        }, messages);

        // Set StormBox's elements
        this.elements = {
            hiddenInput,
            textInput,
            wrapper: div({
                className: this.style.wrapper
            }),
            label: null
        };

        // Debouncing find
        this.debouncedFind = debounce(::this.find, debounceTime);
        // Debouncing layout change
        this.debouncedLayoutChange = debounce(::this.layoutChange, 250);

        // Set relative components
        this.components = {
            presentText: new PresentText({style: this.style}, {}, this),
            icon: new Icon({style: this.style}, {}, this),
            panel: new Panel({style: this.style}, {onSelect: ::this.select}, this),
            multiple: new Multiple({style: this.style}, {onRemove: ::this.remove}, this)
        };

        // Prepare elements
        this.prepareElements();
    }

    prepareElements() {
        // Turn wrapper focusable
        this.elements.wrapper.setAttribute('tabindex', '0');
        this.elements.wrapper.autoComplete = this;
        if (!this.multiple) {
            // Store hiddenInput value
            this.value = this.elements.hiddenInput.value;
            // Store textInput value (content)
            this.content = this.elements.textInput.value;

            // If no anchor, textInput is anchor
            if (!this.anchorElement) {
                this.anchorElement = this.elements.textInput;
            }

            // Find label
            this.elements.label = StormBox.findLabel(this.anchorElement) || null;

            // Add wrapper after anchor
            this.anchorElement.parentNode.insertBefore(this.elements.wrapper, this.anchorElement.nextSibling)

            // Clone props and observe set
            this.relatedReplica();

            // Remove old inputs
            this.elements.hiddenInput.parentNode.removeChild(this.elements.hiddenInput);
            this.elements.textInput.parentNode.removeChild(this.elements.textInput);

            if (this.anchorElement.parentNode) {
                this.anchorElement.parentNode.removeChild(this.anchorElement);
            }

            // Prepare hiddenInput
            this.elements.hiddenInput.autoComplete = this;
            this.elements.hiddenInput.type = 'hidden';
            this.elements.hiddenInput.className = this.style.hiddenInput;
            this.elements.hiddenInput.dataset['autocompleteKey'] = this.key;
            // Prepare textInput
            this.elements.textInput.autoComplete = this;
            this.elements.textInput.type = 'hidden';
            this.elements.textInput.className = this.style.textInput;
            this.elements.textInput.dataset['autocompleteTextKey'] = this.key;

            // Present values
            this.components.presentText.value(this.value);
            this.components.presentText.text(this.content);

            // Put hiddens in DOM
            this.elements.wrapper.appendChild(this.elements.hiddenInput);
            this.elements.wrapper.appendChild(this.elements.textInput);

            // Append wrapper's children
            this.elements.wrapper.appendChild(this.components.presentText.element);
            this.elements.wrapper.appendChild(this.components.icon.element);
            this.elements.wrapper.appendChild(this.components.panel.element);

        } else {
            // Store hiddenInput value
            this.value = this.elements.hiddenInput.map(element => element.value);
            // Store textInput value (content)
            this.content = this.elements.textInput.map(element => element.value);

            // If no anchor, first textInput is anchor
            if (!this.anchorElement && this.elements.textInput[0]) {
                this.anchorElement = this.elements.textInput[0];
            }

            // If still no anchor, throw error
            if (!this.anchorElement) {
                throw new Error('StormBox anchor element missing!');
            }

            // Find label
            this.elements.label = StormBox.findLabel(this.anchorElement) || null;

            // Add wrapper after anchor
            this.anchorElement.parentNode.insertBefore(this.elements.wrapper, this.elements.textInput.nextSibling)

            // Clone props and observe set
            this.relatedReplica();

            // Remove items from DOM
            this.elements.hiddenInput.forEach(element => element.parentNode.removeChild(element));
            this.elements.textInput.forEach(element => element.parentNode.removeChild(element));

            if (this.anchorElement.parentNode) {
                this.anchorElement.parentNode.removeChild(this.anchorElement);
            }

            // Present values
            this.components.presentText.value('');
            if (this.value.length === 1) {
                this.components.presentText.text(`${this.value.length} ${this.messages.singularMultipleItems}`);
            } else if (this.value.length > 1) {
                this.components.presentText.text(`${this.value.length} ${this.messages.pluralMultipleItems}`);
            } else {
                this.components.presentText.text(' ');
            }
            this.components.multiple.render();

            // Append wrapper's children
            this.elements.wrapper.appendChild(this.components.presentText.element);
            this.elements.wrapper.appendChild(this.components.icon.element);
            this.elements.wrapper.appendChild(this.components.panel.element);
            this.elements.wrapper.parentNode.insertBefore(this.components.multiple.element, this.elements.wrapper.nextSibling)

        }
        this.prepareEvents();
    }
    
    relatedApply(fn) {
        if (!StormBox.isArray(this.elements.textInput)) {
            fn(this.elements.textInput);
        } else {
            this.elements.textInput.forEach(element => fn(element));
        }

        if (!StormBox.isArray(this.elements.hiddenInput)) {
            fn(this.elements.hiddenInput);
        } else {
            this.elements.hiddenInput.forEach(element => fn(element));
        }

        if (this.anchorElement != this.elements.textInput && this.anchorElement != this.elements.hiddenInput) {
            fn(this.anchorElement);
        }
    }

}
