import { api, LightningElement } from "lwc";
import { findFilterOption, prepareFilterOptions, EVENT } from "./utils";

const OPEN_CLASS = "slds-is-open";

export default class FieldPickerFilter extends LightningElement {
    @api isDisabled = false;
    isMenuOpen = false;

    @api filterOptions;

    toggleOpen() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    handleFilterSelect(event) {
        const filterValue = event.currentTarget.dataset.filter;
        this.selectFilter(filterValue);
    }

    clearAll() {
        const updatedFilterOptions = this.filterOptions.map((option) => {
            return { ...option, isSelected: false };
        });

        this.dispatchEvent(new CustomEvent(EVENT.CHANGE, { detail: updatedFilterOptions }));
        this.toggleOpen();
        this.focusMenuButton();
    }

    selectFilter(filterValue) {
        const filterOption = findFilterOption(this.filterOptions, filterValue);
        if (!filterOption) {
            console.warn(`Filter "${filterValue}" is not a valid option.`);
            return;
        }
        if (!filterOption.isSelected && filterOption.isDisabled) {
            console.warn(`Filter "${filterValue}" is disabled and cannot be selected.`);
            return;
        }

        // Toggle selection status
        const updatedFilterOptions = this.filterOptions.map((option) => {
            if (option.value === filterValue) {
                return { ...option, isSelected: !option.isSelected };
            }
            return option;
        });

        // Dispatch event to notify parent about the updated filter options
        this.dispatchEvent(new CustomEvent(EVENT.CHANGE, { detail: updatedFilterOptions }));

        // Update internal state
        this.filterOptions = updatedFilterOptions;
    }

    get isSelected() {
        return this.filterOptions.some((f) => f.isSelected);
    }

    get isNotSelected() {
        return !this.isSelected;
    }

    get clearAllClass() {
        if (this.isNotSelected) {
            return "slds-dropdown__item is-disabled";
        }
        return "slds-dropdown__item";
    }
    get clearAllTabIndex() {
        if (this.isNotSelected) {
            return "-1";
        }
        return "0";
    }

    /**
     * Computes the filter options with selection status.
     * @returns {FilterOption[]}
     */
    get computedFilterOptions() {
        return prepareFilterOptions(this.filterOptions);
    }

    /**
     * Determines if the button should be disabled.
     * @returns {boolean}
     */
    get isButtonDisabled() {
        return this.isDisabled;
    }

    /**
     * Computes the CSS classes for the menu container.
     * @returns {string}
     */
    get menuClasses() {
        return `slds-dropdown-trigger slds-dropdown-trigger_click ${this.isMenuOpen ? OPEN_CLASS : ""}`;
    }

    /** @param {KeyboardEvent} event */
    handleKeydown(event) {
        if (!this.isMenuOpen) return;

        switch (event.key) {
            case "Enter":
                this.handleEnterKey(event);
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

        if (focusedElement === this.refs.clearAll) {
            this.clearAll();
            return;
        }

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
}
