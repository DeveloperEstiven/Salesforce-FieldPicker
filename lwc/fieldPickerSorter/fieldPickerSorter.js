import { api, LightningElement, track } from "lwc";
import { prepareSortOptions, SORT_OPTIONS, EVENT, INITIAL_SORT } from "./utils";
/** @typedef {import('./utils.js').SortOption} SortOption */
/** @typedef {import('./utils.js').SortValue} SortValue */

const OPEN_CLASS = "slds-is-open";

export default class FieldPickerSorter extends LightningElement {
    /** @type {SortValue} */
    @api initialSort = null;
    /** @type {SortValue} */
    @track selectedSortOption = INITIAL_SORT;
    @track isMenuOpen = false;
    /** @type {SortOption[]} */
    sortOptions = SORT_OPTIONS;

    connectedCallback() {
        if (this.initialSort) {
            const initialSortOption = this.sortOptions.find(s=>s.value?.sortBy === this.initialSort.sortBy && s.value?.dir === this.initialSort.dir);
            if (!initialSortOption) {
                const detail = `Invalid initial sort "${JSON.stringify(this.initialSort)}". The value should be one of the following options: ${this.sortOptions.filter(f=>Boolean(f.value)).map((f) => JSON.stringify(f.value)).join(", ")} or null`;
                return this.dispatchEvent(new CustomEvent(EVENT.VALIDATION_ERROR, { detail }));
            }
            this.selectedSortOption = initialSortOption;
        }
    }

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
