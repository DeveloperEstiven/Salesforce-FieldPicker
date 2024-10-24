import { LightningElement, api, track } from "lwc";
import getFields from "@salesforce/apex/FieldPickerController.getFields";
import { getAvailableFilters, getFieldTypeIcon, LOOKUP_ACTIONS } from "./utils";

/** @typedef {import('c/fieldPickerFilter/utils').FilterOption} FilterOption */
/** @typedef {import('c/fieldPickerSorter/utils').SortValue} SortValue */

/**
 * @typedef {Object} RawField
 * @property {string} apiName - The API Name of the field.
 * @property {string} label - The Label of the field.
 * @property {string} type - The Type of the field. One of DisplayType enum values. See Docs [https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_enum_Schema_DisplayType.htm]
 * @property {string|undefined} referenceTo - API Name of the object to which this field looks. Populated only if field is a lookup
 * @property {string|undefined} relationshipName - Name of the child-to-parent relationship. Populated only if field is a lookup
 * @property {string} icon - The icon name associated with the filter option.
 */

/**
 * @typedef {Object} Field
 * @extends RawField
 * @property {string} icon - The utility icon name based on field type.
 */

/**
 * @typedef {Object} SelectedField
 * @extends Field
 * @property {string} relationshipPath - The path to the field. Built using relationship names. Valid part of SOQL to get field's value. E.g. Field_B__r.Field_C__r.Field_A__c
 */

const BTN_LABEL = "Select a Field";
const MAXIMUM_DEPTH = 2;

const INITIAL_BASE_OBJECT = "Account";
// TODO: add depth validation

const IS_DEBUG = false; //TODO: remove in prod

/**
 * @param {Field} field
 * @param {LookupStack} lookupStack
 * @returns {SelectedField}
 */
const fieldWithRelationshipPath = (field, lookupStack) => {
    return { ...field, relationshipPath: buildRelationshipPath(field.apiName, lookupStack) };
};

// TODO LookupStack type
// TODO: bug Created By id > Delegated approver Id > Select any field
// disable go deeper for fields that doen't havve relationship path
// TODO: initial state
// TODO: interface to get field value
// TODO: concatenation and formatting

/**
 * @param {string} fieldApiName
 * @param {LookupStack} lookupStack
 * @returns {string}
 * */
const buildRelationshipPath = (fieldApiName = "", lookupStack) => {
    return [...lookupStack.map((lookup) => lookup.relationshipName), fieldApiName].join(".");
};

/**
 * @param {Field} a
 * @param {Field} b
 * @param {SortValue} fieldSort
 * @returns {0|1|-1}
 * */
const compareFields = (a, b, fieldSort) => {
    const getValue = (field) => {
        const sortByMapping = {
            Field: () => field.label.toLowerCase(),
            Type: () => field.type.toLowerCase()
        };
        return sortByMapping[fieldSort.sortBy]?.() ?? "";
    };

    const valueA = getValue(a);
    const valueB = getValue(b);
    return valueA === valueB ? 0 : (valueA < valueB ? -1 : 1) * (fieldSort.dir === "ASC" ? 1 : -1);
};

const REFERENCE = "REFERENCE";
const DEBOUNCE = 500;

export default class FieldPicker extends LightningElement {
    /** The label of "Select Field" button */
    @api selectButtonLabel = BTN_LABEL;

    /** Hides the Base Object from UI */
    @api isBaseObjectHidden = false;

    @api fieldSort = null;

    /** @type {number} Determines the maximum depth of field selection.
     * If depth=0, then user can select a field on base object only: Field_A__c.
     * If depth=1, then user can select a field on base object or in child record: Field_B__r.Field_A__c.
     * If depth=2, then user can select a field on base object or in child record or in child of child: Field_B__r.Field_C__r.Field_A__c.
     * And so on
     */
    _depth = MAXIMUM_DEPTH;

    @api
    set depth(value) {
        if (value < 0) {
            console.warn("depth cannot be less than 0");
            this._depth = 0;
        } else if (value > MAXIMUM_DEPTH) {
            console.warn(`depth cannot be greater than ${MAXIMUM_DEPTH}`);
            this._depth = MAXIMUM_DEPTH;
        } else {
            this._depth = value;
        }
    }

    get depth() {
        return this._depth;
    }

    /**
     * @type {string[]}. Determines the allowed field types for selection. For example [CURRENCY, BOOLEAN] means that user can select only Currency field or Checkbox
     * If not provided, any field type can be selected
     * If REFERENCE provided, then user can select a lookup field from the left panel
     */
    @api allowedFieldTypes = [];

    /** @type {boolean} If true, disables the Filter button. The initial filter will be applied, but user will not be able to change it */
    @api isUserFilteringDisabled = false;

    /** @type {string} The valid Relationship API Name (e.g. Field_B__r.Field_C__r.Field_A__c) path to the initial selected field. If provided, then the component auto-initializes. */
    @api initialFieldPath = "";

    @api
    get baseObject() {
        return this._baseObject;
    }
    set baseObject(value) {
        this._baseObject = typeof value !== "string" || !value.trim() ? INITIAL_BASE_OBJECT : value;
        this.resetSelection();
    }

    /** @type {Field[]} First column. List of lookup fields for the current object */
    @track lookupFields = [];

    /** @type {Field[]} List of regular fields for the current object */
    @track regularFields = [];

    /** @type {Field[]} Second column. List of filtered regular fields for the current object */
    @track displayedRegularFields = [];

    /** @type {LookupStack} Stores the path to the current object. if the depth > 1, then new entry is added when user goes deeper to child object. */
    @track lookupStack = [];

    /** @type {SelectedField|null} Stores information about currently selected field */
    @track selectedField = null;

    /** @type {string} API Name of the currently hovered field */
    hoveredFieldApiName = "";

    /** @type {string} User's input to searchbar */
    searchTerm = "";

    debounceTimer;

    @track visibleItems = [];

    handleVisibleItemsChange(event) {
        this.visibleItems = event.detail;
    }

    /** @type {FilterOption[]} Array of available filters for current object. Computed based on all regularFields and allowedFieldTypes */
    @track filterOptions = [];

    isModalOpen = false;
    isLoading = false;

    /** Adds "Go Deeper" button for lookup field */
    lookupFieldActions = LOOKUP_ACTIONS;

    /** @type {string} The API Name of the initial object, from which user can select a field.
     * For example, if 'Account', then user can select only Account field.
     * If user goes deeper to any child object, this field remains the same and is not changeable.
     * If changed from parent, then the component's state is reset */
    _baseObject = INITIAL_BASE_OBJECT;

    /** @type {string} The  API Name of the current object. Changes when user walks through child lookups */
    currentObject = "";

    connectedCallback() {
        IS_DEBUG && setTimeout(() => this.handleOpenModal(), 1000); //! DEBUG ONLY
    }

    handleSearchChange(event) {
        clearTimeout(this.debounceTimer);
        this.searchTerm = event.target.value.toLowerCase();

        // this.debounceTimer = setTimeout(() => {
        this.applyFilters();
        // }, DEBOUNCE);
    }

    /** Executes if Filter component receives invalid filter */
    handleValidationError(event) {
        this.handleError(event.detail);
    }

    handleFilterSelect(event) {
        /** @type {FilterOption[]} - SF field types (e.g. 'BOOLEAN', 'CURRENCY', ...). [] if filter is not selected  */
        const filterOptions = event.detail;
        this.filterOptions = filterOptions;

        this.applyFilters();
    }

    handleSortChange(event) {
        /** @type {SortValue | null} */
        const sort = event.detail;
        this.fieldSort = sort;
        this.applyFilters();
    }

    handleOpenModal() {
        this.isModalOpen = true;
        if (!this.selectedField && !this.initialFieldPath) {
            this.loadFields(this.baseObject);
        }
    }

    async loadFields(objectApiName) {
        this.currentObject = objectApiName;
        this.isLoading = true;
        try {
            /** @type {RawField[]} */
            const data = await getFields({ objectApiName });

            /** @type {Field[]} */
            const allFieldOptions = data.map((field) => ({
                ...field,
                icon: getFieldTypeIcon(field.type)
            }));

            const fieldGroups = allFieldOptions.reduce((acc, field) => (acc[field.referenceTo ? "lookupFields" : "regularFields"].push(field), acc), {
                lookupFields: [],
                regularFields: []
            });

            this.lookupFields = fieldGroups.lookupFields;
            this.regularFields = fieldGroups.regularFields;

            this.filterOptions = getAvailableFilters(this.regularFields, this.allowedFieldTypes, this.filterOptions);
            this.applyFilters();
        } catch (error) {
            this.handleError("loadFields", error);
        } finally {
            this.isLoading = false;
        }
    }

    handleFieldHover(event) {
        this.hoveredFieldApiName = event.detail;
    }

    handleFieldMouseOut() {
        this.hoveredFieldApiName = "";
    }

    handleGoDeeper(event) {
        /** @type {Field} */
        const field = event.detail;

        if (this.isMaximumDepth) {
            return console.warn("Max allowed depth is ", this.depth);
        }
        this.lookupStack = [
            ...this.lookupStack,
            {
                relationshipName: field.relationshipName,
                objectApiName: field.referenceTo
            }
        ];
        this.selectedField = null;
        this.loadFields(field.referenceTo);
    }

    handleFieldClick(event) {
        /** @type {Field} */
        const field = event.detail;
        if (!field.referenceTo || this.isLookupSelectionAllowed) {
            this.selectedField = fieldWithRelationshipPath(field, this.lookupStack);
        }
    }

    handleSelect() {
        this.isModalOpen = false;
    }

    handleNavigate(event) {
        const { objectApiName, lookupStack } = event.detail;
        this.lookupStack = lookupStack;
        this.loadFields(objectApiName);
    }

    applyFilters() {
        let fields = [...this.regularFields];

        fields = this.applyFieldTypeFilter(fields);
        fields = this.applySearchFilter(fields);
        fields = this.applySort(fields);

        this.displayedRegularFields = fields;
    }

    /** @param {Field[]} fields */
    applyFieldTypeFilter(fields) {
        if (this.filterOptions.some((filterOption) => filterOption.isSelected)) {
            return fields.filter((field) => this.filterOptions.some((filterOption) => filterOption.isSelected && filterOption.value === field.type));
        }
        if (this.allowedFieldTypes?.length) {
            return fields.filter((field) => this.allowedFieldTypes.includes(field.type));
        }
        return fields;
    }

    /** @param {Field[]} fields */
    applySearchFilter(fields) {
        if (!this.searchTerm) {
            return fields;
        }
        const searchTermLower = this.searchTerm.toLowerCase();
        return fields.filter((field) => field.label.toLowerCase().includes(searchTermLower) || field.apiName.toLowerCase().includes(searchTermLower));
    }

    /** @param {Field[]} fields */
    applySort(fields) {
        if (!this.fieldSort) {
            return fields;
        }
        return fields.sort((a, b) => compareFields(a, b, this.fieldSort));
    }

    get isSelectDisabled() {
        return !this.selectedField;
    }

    get isLeftPanelVisible() {
        return this.depth || this.isLookupSelectionAllowed;
    }

    get isRightPanelVisible() {
        return true;
    }

    get isOneSectionVisible() {
        return this.isLeftPanelVisible !== this.isRightPanelVisible;
    }

    get isLookupSelectionAllowed() {
        return !this.allowedFieldTypes.length || this.allowedFieldTypes.includes(REFERENCE);
    }

    get modalClass() {
        return `slds-modal slds-fade-in-open slds-modal_${this.isOneSectionVisible ? "small" : "medium"}`;
    }

    get sectionSize() {
        if (this.isRightPanelVisible && this.isLeftPanelVisible) {
            return {
                lookup: 4,
                fields: 8
            };
        }
        if (this.isRightPanelVisible) {
            return {
                fields: 12
            };
        }
        if (this.isLeftPanelVisible) {
            return {
                lookup: 12
            };
        }
        return {
            lookup: 6,
            fields: 6
        };
    }

    get isLookupDisabled() {
        return !this.isLookupSelectionAllowed;
    }

    get isMaximumDepth() {
        return this.lookupStack.length >= this.depth;
    }

    get selectedFieldPath() {
        return this.selectedField ? this.selectedField.relationshipPath : "";
    }

    get isFilteringDisabled() {
        return this.isUserFilteringDisabled || !this.filterOptions.length;
    }

    resetSelection() {
        this.selectedField = null;
        this.lookupStack = [];
        this.lookupFields = [];
        this.regularFields = [];
    }

    handleCloseModal() {
        this.isModalOpen = false;
    }

    handleError(methodName, error) {
        console.error(`[fieldPicker] [${methodName}] Error:`, error);
    }
}
