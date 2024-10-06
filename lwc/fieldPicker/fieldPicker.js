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
const INITIAL_FILTER = "BOOLEAN";
const MAXIMUM_DEPTH = 3;

const INITIAL_BASE_OBJECT = "Account";
// TODO: add depth validation

const IS_DEBUG = true; //TODO: remove in prod

export default class FieldPicker extends LightningElement {
    /** The label of "Select Field" button */
    @api selectButtonLabel = BTN_LABEL;

    /** Hides the Base Object from UI */
    @api isBaseObjectHidden = false;

    /** Filter regular fields. If provided, initial field is applied */
    @api fieldTypeFilter = INITIAL_FILTER;

    /** @type {number} Determines the maximum depth of field selection.
     * If depth=1, then user can select a field on base object only: Field_A__c.
     * If depth=2, then user can select a field on base object or in child record: Field_B__r.Field_A__c.
     * If depth=3, then user can select a field on base object or in child record or in child of child: Field_B__r.Field_C__r.Field_A__c.
     * And so on
     */
    @api depth = MAXIMUM_DEPTH;

    /** @type {string[]}. Determines the allowed field types for selection. For example [CURRENCY, BOOLEAN] means that user can select only Currency field or Checkbox */
    @api allowedFieldTypes;

    /** @type {boolean} If true, disables the Filter button. The initial filter will be applied, but user will not be able to change it */
    @api isUserFilteringDisabled = false;

    /** @type {Field[]} First column. List of lookup fields for the current object */
    @track lookupFields = [];

    /** @type {Field[]} Second column. List of regular fields for the current object */
    @track regularFields = [];

    /** @type {LookupStack} Stores the path to the current object. if the depth > 1, then new entry is added when user goes deeper to child object. */
    @track lookupStack = [];

    /** @type {SelectedField|null} Stores information about currently selected field */
    @track selectedField = null;

    /** @type {string} API Name of the currently hovered field */
    @track hoveredFieldApiName = "";

    /** @type {string} User's input to searchbar */
    @track searchTerm = "";

    /** @type {FilterOption[]} Array of available filters for current object. Computed based on all regularFields and allowedFieldTypes */
    @track filterOptions = [];

    @track isModalOpen = false;
    @track isLoading = false;

    @track allowLookupSelection = true; //TODO: this should be converted to @api for prod. Currently @track for testing

    /** Adds "Go Deeper" button for lookup field */
    lookupFieldActions = LOOKUP_ACTIONS;

    /** @type {string} The API Name of the initial object, from which user can select a field.
     * For example, if 'Account', then user can select only Account field.
     * If user goes deeper to any child object, this field remains the same and is not changeable.
     * If changed from parent, then the component's state is reset */
    _baseObject = INITIAL_BASE_OBJECT;

    /** @type {string} The  API Name of the current object. Changes when user walks through child lookups */
    @track currentObject = "";

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

    connectedCallback() {
        IS_DEBUG && setTimeout(() => this.handleOpenModal(), 1000); //! DEBUG ONLY
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase().trim();
        // TODO: implement searching
    }

    /** Executes if Filter component receives invalid initial filter (fieldTypeFilter) */
    handleFilterValidationError(event) {
        this.handleError(event.detail);
    }

    handleFilterSelect(event) {
        /** @type {string|null} - one of SF field types (e.g. 'BOOLEAN', 'CURRENCY', ...). null if filter is not selected  */
        const filter = event.detail;
        // TODO: implement filtering
    }

    handleSortChange(event) {
        /** @type {SortValue} - object of type {sortBy: 'Field' | 'Type', dir: 'ASC' | 'DESC'}. Cannot be null  */
        const sort = event.detail;
        // TODO: implement sorting
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
            this.lookupFields = allFieldOptions.filter((field) => Boolean(field.referenceTo));
            this.regularFields = allFieldOptions.filter((field) => !field.referenceTo);
            this.filterOptions = getAvailableFilters(this.regularFields, this.allowedFieldTypes);
        } catch (error) {
            this.handleError(error);
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

        if (this.lookupStack.length >= this.depth - 1) {
            console.warn("Max allowed depth is ", this.depth);
            return;
        }
        this.lookupStack.push({
            relationshipName: field.relationshipName,
            objectApiName: field.referenceTo
        });
        this.selectedField = null;
        this.loadFields(field.referenceTo);
    }

    handleFieldClick(event) {
        /** @type {Field} */
        const field = event.detail;
        if (field.referenceTo) {
            if (this.allowLookupSelection) {
                this.selectedField = this.fieldWithRelationshipPath(field);
            }
        } else {
            this.selectedField = this.fieldWithRelationshipPath(field);
        }
    }

    /**
     * @param {Field} field
     * @returns {SelectedField}
     */
    fieldWithRelationshipPath(field) {
        return { ...field, relationshipPath: this.buildRelationshipPath(field.apiName) };
    }

    buildRelationshipPath(fieldApiName = "") {
        const relationshipNames = this.lookupStack.map((lookup) => lookup.relationshipName);
        if (fieldApiName) {
            relationshipNames.push(fieldApiName);
        }
        return relationshipNames.join(".");
    }

    handleSelect() {
        this.isModalOpen = false;
    }

    handleBack() {
        if (this.lookupStack.length > 0) {
            this.lookupStack.pop();
            const objectApiName = this.lookupStack.length > 0 ? this.lookupStack[this.lookupStack.length - 1].objectApiName : this.baseObject;
            this.loadFields(objectApiName);
            this.selectedField = null;
        }
    }

    get isBackDisabled() {
        return this.lookupStack.length === 0;
    }

    get isSelectDisabled() {
        return !this.selectedField;
    }

    get isGoDeeperVisible() {
        return this.allowLookupSelection;
    }

    get isGoDeeperDisabled() {
        return !this.selectedField || this.selectedField.fieldType !== "REFERENCE" || this.lookupStack.length >= this.depth - 1;
    }

    get selectedFieldPath() {
        return this.selectedField ? this.selectedField.relationshipPath : "";
    }

    get hasLookupFields() {
        return this.lookupFields.length > 0;
    }

    get hasRegularFields() {
        return this.regularFields.length > 0;
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

    handleError(error) {
        console.error("Error:", error);
    }
}
