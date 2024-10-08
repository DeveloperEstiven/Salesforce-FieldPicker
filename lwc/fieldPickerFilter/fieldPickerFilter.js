import { api, LightningElement, track } from "lwc";
import { findFilterOption, prepareFilterOptions, EVENT } from "./utils";
/** @typedef {import('./utils.js').FilterOption} FilterOption */

const OPEN_CLASS = "slds-is-open";
export default class FieldPickerFilter extends LightningElement {
    /** @type {FilterOption[]} */
    @api filterOptions = [];

    /** @type {string|null} - FilterOption.value */
    @api initialFilter = null;

    @api isDisabled;

    /** @type {FilterOption|null} */
    @track selectedFilterOption = null;

    @track isMenuOpen = false;

    connectedCallback() {
        if (this.initialFilter) {
            const initialFilterOption = findFilterOption(this.filterOptions, this.initialFilter);
            if (!initialFilterOption) {
                const detail = `Invalid initial filter "${this.initialFilter}". The value should be one of the following options: ${this.filterOptions.map((f) => f.value).join(", ")}`;
                return this.dispatchEvent(new CustomEvent(EVENT.VALIDATION_ERROR, { detail }));
            }
            if (initialFilterOption.isDisabled) {
                console.warn(
                    `Unexpected behavior. Provided initial filter "${this.initialFilter}" is disabled. Expected one of the following options: ${this.filterOptions
                        .filter((f) => !f.isDisabled)
                        .map((f) => f.value)
                        .join(", ")}`
                );
            }
            this.selectedFilterOption = initialFilterOption;
        }
    }

    toggleOpen() {
        this.isMenuOpen = !this.isMenuOpen;
        this.refs.menuItems.classList.toggle(OPEN_CLASS);
    }

    /** @param {PointerEvent} event */
    handleFilterSelect(event) {
        const filterValue = event.currentTarget.dataset.filter;
        this.selectFilter(filterValue);
    }

    /** @param {string} filterValue */
    selectFilter(filterValue) {
        const isAlreadySelected = this.selectedFilterOption?.value === filterValue;

        if (isAlreadySelected) {
            this.selectedFilterOption = null;
        } else {
            const filter = findFilterOption(this.filterOptions, filterValue);
            if (filter.isDisabled) {
                return;
            }
            this.selectedFilterOption = filter;
        }

        this.dispatchEvent(new CustomEvent(EVENT.CHANGE, { detail: this.selectedFilterOption?.value || null }));
        this.toggleOpen();
    }

    /** @param {KeyboardEvent} event */
    handleKeydown(event) {
        if (!this.isMenuOpen) return;

        switch (event.key) {
            case "Enter":
                this.handleEnterKey(event);
                this.focusMenuButton();
                break;
            case "Escape":
                this.toggleOpen();
                this.focusMenuButton();
                break;
        }
    }

    /** @param {KeyboardEvent} event */
    handleEnterKey(event) {
        const focusedElement = this.template.activeElement;
        if (focusedElement === this.refs.menuButton) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        const selectedFilterOption = focusedElement?.closest("li[data-filter]");
        if (!selectedFilterOption) {
            return;
        }

        /** @type {string} */
        const filterValue = selectedFilterOption.dataset.filter;
        this.selectFilter(filterValue);
    }

    focusMenuButton() {
        this.refs.menuButton.focus();
    }

    get computedFilterOptions() {
        return prepareFilterOptions(this.filterOptions, this.selectedFilterOption?.value);
    }
}
