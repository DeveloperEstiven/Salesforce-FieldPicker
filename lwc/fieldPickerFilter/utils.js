// utils.js
/** @typedef {import('./utils.js').FilterOption} FilterOption */

/**
 * @typedef {Object} FilterOption
 * @property {string} label - Display label for the filter.
 * @property {string} value - Unique value for the filter.
 * @property {string} icon - Icon name for the filter.
 * @property {boolean} isDisabled - Indicates if the filter is disabled.
 * @property {boolean} isSelected - Indicates if the filter is selected.
 * @property {string} itemClass - CSS classes for the filter item.
 */

/**
 * Prepares filter options by setting the selection status.
 * @param {FilterOption[]} filterOptions
 * @param {string[]} selectedFilters
 * @returns {FilterOption[]}
 */
export function prepareFilterOptions(filterOptions) {
    return filterOptions
        .map((option) => {
            const isDisabled = option.isSelected ? false : option.isDisabled;
            const itemClass = ["slds-dropdown__item", option.isSelected && "slds-is-selected", isDisabled && "is-disabled"].filter(Boolean).join(" ");
            return {
                ...option,
                itemClass,
                isDisabled,
                tabindex: isDisabled ? "-1" : "0"
            };
        })
        .sort((a, b) => Number(a.isDisabled) - Number(b.isDisabled));
}

/**
 * Finds a filter option by value.
 * @param {FilterOption[]} filterOptions
 * @param {string} value
 * @returns {FilterOption|null}
 */
export function findFilterOption(filterOptions, value) {
    return filterOptions.find((option) => option.value === value) || null;
}

/**
 * Event constants used in the component.
 */
export const EVENT = {
    VALIDATION_ERROR: "validationerror",
    CHANGE: "filterchange"
};
