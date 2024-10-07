/**
 * @typedef {Object} SortValue
 * @property {string} sortBy
 * @property {string} dir - Direction. ASC | DESC
 */

/**
 * @typedef {Object} SortOption
 * @property {string|null} id - Unique id.
 * @property {SortValue|null} value - The sort value.
 * @property {string} label - The display label of the sort option.
 * @property {string} icon - The utility icon name.
 * @property {boolean} isOption - Determines whether the item is an option.
 * @property {boolean|undefined} showDivider - Determines if the divider should appear after this option.
 */

/**
 * @typedef {Object} RichSortOption
 * @extends SortOption
 * @property {string} itemClass - slds-dropdown__item. Adds slds-is-selected if the item is selected.
 * @property {boolean} isSelected - Determines whether the item is selected.
 */

/**
 * Enriches sort options for looping.
 * @param {SortOption[]} options - All sort options.
 * @param {string} selectedId - The Id of the currently selected sort option
 * @returns {RichSortOption[]} An enriched array of options
 */
export function prepareSortOptions(options, selectedId) {
    return options.map((option) => {
        const isSelected = option.id === selectedId;
        const itemClass = ["slds-dropdown__item", isSelected && "slds-is-selected"].filter(Boolean).join(" ");
        return { ...option, itemClass, isSelected };
    });
}

/** @type {SortOption[]} */
export const SORT_OPTIONS = [
    { id: "Not Sorted", value: null, label: "Not Sorted", icon: "utility:sort", isOption: true, showDivider: true },
    { label: "Field" },
    { id: "Field - ASC", value: { sortBy: "Field", dir: "ASC" }, label: "Field - A to Z", icon: "utility:arrowup", isOption: true },
    { id: "Field - DESC", value: { sortBy: "Field", dir: "DESC" }, label: "Field - Z to A", icon: "utility:arrowdown", isOption: true, showDivider: true },
    { label: "Type" },
    { id: "Type - ASC", value: { sortBy: "Type", dir: "ASC" }, label: "Type - A to Z", icon: "utility:arrowup", isOption: true },
    { id: "Type - DESC", value: { sortBy: "Type", dir: "DESC" }, label: "Type - Z to A", icon: "utility:arrowdown", isOption: true }
];

/** @type {SortOption} */
export const INITIAL_SORT = SORT_OPTIONS[0];

export const EVENT = {
    VALIDATION_ERROR: "validationerror",
    CHANGE: "sortchange"
};
