/** @typedef {import('c/fieldPickerFilter/utils').FilterOption} FilterOption */

const FIELD_TYPE_ICON_MAP = {
    STRING: "utility:text",
    TEXTAREA: "utility:textarea",
    PICKLIST: "utility:picklist_choice",
    MULTIPICKLIST: "utility:multi_picklist",
    DATE: "utility:date_input",
    DATETIME: "utility:date_time",
    TIME: "utility:clock",
    CURRENCY: "utility:currency",
    PERCENT: "utility:percent",
    INTEGER: "utility:number_input",
    DOUBLE: "utility:number_input",
    EMAIL: "utility:email",
    PHONE: "utility:call",
    URL: "utility:link",
    ID: "utility:key",
    REFERENCE: "utility:record_lookup",
    ADDRESS: "utility:checkin",
    GEOLOCATION: "utility:location",
    RICH_TEXT_AREA: "utility:display_rich_text",
    IMAGE: "utility:image",
    ENCRYPTED_STRING: "utility:lock",
    TEXT: "utility:text",
    BOOLEAN: "utility:multi_select_checkbox"
};

const ALLOWED_FIELD_TYPES = Object.keys(FIELD_TYPE_ICON_MAP);
const ALL_FILTERS = ALLOWED_FIELD_TYPES.map((key) => ({ label: key.replace(/_/g, " ").toLowerCase(), value: key, icon: FIELD_TYPE_ICON_MAP[key] }));

/** @returns {FilterOption[]} */
export const getAvailableFilters = (currentFields, allowedFieldTypes) => {
    const currentFieldTypes = new Set(currentFields.map((field) => field.type));
    const allowedFieldTypesSet = new Set(allowedFieldTypes?.length ? allowedFieldTypes : ALLOWED_FIELD_TYPES);

    const availableFilters = ALL_FILTERS.filter((filter) => currentFieldTypes.has(filter.value)).map((filter) => ({
        ...filter,
        isDisabled: !allowedFieldTypesSet.has(filter.value)
    }));

    return availableFilters;
};

export const getFieldTypeIcon = (fieldType) => {
    return FIELD_TYPE_ICON_MAP[fieldType] || "utility:question";
};

export const LOOKUP_ACTIONS = [{ name: "godeeperclick", title: "Go Deeper", icon: "utility:jump_to_right" }];
