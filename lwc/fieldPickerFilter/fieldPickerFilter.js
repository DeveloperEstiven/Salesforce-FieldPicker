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

    isMenuOpen = false;
    isDisabledInternally = false;

    connectedCallback() {
        if (!this.filterOptions.length) {
            console.warn("No filter options provided.");
            this.isDisabledInternally = true;
            return;
        }

        this.selectedFilterOption = this.checkIfOnlyOneFilterOptionEnabled();

        if (this.initialFilter) {
            if (this.selectedFilterOption && this.initialFilter !== this.selectedFilterOption.value) {
                console.warn(`Provided initial filter "${this.initialFilter}" will be ignored since only one option is enabled: "${this.getValidFilterValuesText()}"`);
                this.isDisabledInternally = true;
                return;
            }

            const initialFilterOption = findFilterOption(this.filterOptions, this.initialFilter);
            if (!initialFilterOption) {
                const detail = `Invalid initial filter "${this.initialFilter}". The value should be one of the following options: ${this.filterOptions.map((f) => f.value).join(", ")}`;
                this.dispatchEvent(new CustomEvent(EVENT.VALIDATION_ERROR, { detail }));
                return;
            }

            if (initialFilterOption.isDisabled) {
                if (this.filterOptions.every((fo) => fo.isDisabled)) {
                    console.warn(`Unexpected behavior. All available filters are disabled: ${this.filterOptions.map((f) => f.value).join(", ")}`);
                    this.isDisabledInternally = true;
                    return;
                }

                console.warn(
                    `Unexpected behavior. Provided initial filter "${this.initialFilter}" is disabled. Expected one of the following options: ${this.getValidFilterValuesText()}`
                );
                return;
            }
            this.selectedFilterOption = initialFilterOption;
        }
    }

    getValidFilters() {
        return this.filterOptions.filter((f) => !f.isDisabled);
    }

    getValidFilterValuesText() {
        return this.getValidFilters()
            .map((f) => f.value)
            .join(", ");
    }

    checkIfOnlyOneFilterOptionEnabled() {
        const validFilters = this.getValidFilters();
        if (validFilters.length === 1) {
            return validFilters[0];
        }
        return null;
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
        if (this.checkIfOnlyOneFilterOptionEnabled()) {
            this.toggleOpen();
            console.warn("Cannot deselect the only option");
            return;
        }

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

    get computedFilterOptions() {
        return prepareFilterOptions(this.filterOptions, this.selectedFilterOption?.value);
    }

    get isButtonDisabled() {
        return this.isDisabled || this.isDisabledInternally;
    }
}

// /** @param {KeyboardEvent} event */
// handleKeydown(event) {
//     if (!this.isMenuOpen) return;

//     switch (event.key) {
//         case "Enter":
//             this.handleEnterKey(event);
//             this.focusMenuButton();
//             break;
//         case "Escape":
//             this.toggleOpen();
//             this.focusMenuButton();
//             break;
//     }
// }

// /** @param {KeyboardEvent} event */
// handleEnterKey(event) {
//     const focusedElement = this.template.activeElement;
//     if (focusedElement === this.refs.menuButton) {
//         return;
//     }

//     event.stopPropagation();
//     event.preventDefault();

//     const selectedFilterOption = focusedElement?.closest("li[data-filter]");
//     if (!selectedFilterOption) {
//         return;
//     }

//     /** @type {string} */
//     const filterValue = selectedFilterOption.dataset.filter;
//     this.selectFilter(filterValue);
// }

// focusMenuButton() {
//     this.refs.menuButton.focus();
// }
