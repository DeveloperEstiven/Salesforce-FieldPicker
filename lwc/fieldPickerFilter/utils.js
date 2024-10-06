/**
 * Utility function to find a filter option by its value.
 * @param {FilterOption[]} options - The array of filter options.
 * @param {string} value - The value to search for.
 * @returns {FilterOption|null} The matching filter option or null if not found.
 */
export function findFilterOption(options, value) {
    return options.find((option) => option.value === value) || null;
}

/**
 * @typedef {Object} FilterOption
 * @property {string} label - The display label of the filter option.
 * @property {boolean} isDisabled
 * @property {string} value - The unique value of the filter option.
 * @property {string} icon - The icon name associated with the filter option.
 */

/**
 * @typedef {Object} RichFilterOption
 * @extends FilterOption
 * @property {string} itemClass - "slds-dropdown__item" class. Includes "slds-is-selected" if the item is selected. Includes "is-disabled" if disabled
 * @property {boolean} isSelected - Determines whether the item is selected.
 * @property {string} tabindex - -1 if the item is disabled. 0 if the item is enabled.
 */

/**
 * Prepares filter options with additional computed properties.
 * @param {FilterOption[]} options - The list of filter options.
 * @param {string|null} selectedValue - The currently selected option's value.
 * @returns {RichFilterOption[]} The enriched list of filter options.
 */
export function prepareFilterOptions(options, selectedValue) {
    return options.map((option) => {
        const isSelected = option.value === selectedValue;
        const itemClass = ["slds-dropdown__item", isSelected && "slds-is-selected", option.isDisabled && "is-disabled"].filter(Boolean).join(" ");
        return {
            ...option,
            itemClass,
            isSelected,
            tabindex: option.isDisabled ? "-1" : "0"
        };
    });
}

export const EVENT = {
    VALIDATION_ERROR: "validationerror",
    CHANGE: "filterchange"
};
