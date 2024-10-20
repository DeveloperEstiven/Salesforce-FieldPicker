/** @typedef {import('c/fieldPickerFilter/utils').FilterOption} FilterOption */

import { DISPLAY_TYPE_ICON_MAP } from "c/utils";

const ALLOWED_FIELD_TYPES = Object.keys(DISPLAY_TYPE_ICON_MAP);
const ALL_FILTERS = ALLOWED_FIELD_TYPES.map((key) => ({ label: key.replace(/_/g, " ").toLowerCase(), value: key, icon: DISPLAY_TYPE_ICON_MAP[key] }));

/** @returns {FilterOption[]} */
export const getAvailableFilters = (currentFields, allowedFieldTypes, filterOptions) => {
    const currentFieldTypes = new Set(currentFields.map((field) => field.type));
    const allowedFieldTypesSet = new Set(allowedFieldTypes?.length ? allowedFieldTypes : ALLOWED_FIELD_TYPES);

    /* .filter((filter) => currentFieldTypes.has(filter.value)) */
    const orderedFilters = ALL_FILTERS.map((filter) => {
        const prevFilter = filterOptions.find((filterOption) => filterOption.value === filter.value);
        return {
            ...filter,
            isDisabled: !currentFieldTypes.has(filter.value) || !allowedFieldTypesSet.has(filter.value),
            isSelected: Boolean(prevFilter?.isSelected)
        };
    });

    return orderedFilters;
};

export const getFieldTypeIcon = (fieldType) => {
    return DISPLAY_TYPE_ICON_MAP[fieldType] || "utility:question";
};

export const LOOKUP_ACTIONS = [{ name: "godeeperclick", title: "Go Deeper", icon: "utility:jump_to_right" }];
