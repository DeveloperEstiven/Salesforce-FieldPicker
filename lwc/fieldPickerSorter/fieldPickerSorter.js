import { LightningElement, track } from "lwc";
import { prepareSortOptions, SORT_OPTIONS, INITIAL_SORT, EVENT } from "./utils";
/** @typedef {import('./utils.js').SortOption} SortOption */

const OPEN_CLASS = "slds-is-open";

export default class FieldPickerSorter extends LightningElement {
    @track selectedSortOption = INITIAL_SORT;
    @track isMenuOpen = false;
    sortOptions = SORT_OPTIONS;

    toggleOpen() {
        this.isMenuOpen = !this.isMenuOpen;
        this.refs.menuItems.classList.toggle(OPEN_CLASS);
    }

    /** @param {PointerEvent} event */
    handleOptionSelect(event) {
        /** @type {string} */
        const optionId = event.currentTarget.dataset.id;
        this.selectOption(optionId);
    }

    /** @param {string} optionId */
    selectOption(optionId) {
        this.selectedSortOption = this.sortOptions.find((option) => option.id === optionId);
        this.dispatchEvent(new CustomEvent(EVENT.CHANGE, { detail: this.selectedSortOption.value }));
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

        const selectedSortOption = focusedElement?.closest("li[data-id]");
        if (!selectedSortOption) {
            return;
        }

        /** @type {string} */
        const optionId = selectedSortOption.dataset.id;
        this.selectOption(optionId);
    }

    focusMenuButton() {
        this.refs.menuButton.focus();
    }

    get computedSortOptions() {
        return prepareSortOptions(this.sortOptions, this.selectedSortOption.id);
    }
}
