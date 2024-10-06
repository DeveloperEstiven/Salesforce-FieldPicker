import { LightningElement, api, track } from "lwc";
import getFields from "@salesforce/apex/FieldPickerController.getFields";

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

function getAvailableFilters(currentFields, allowedFieldTypes) {
    const currentFieldTypes = new Set(currentFields.map((field) => field.type));
    const allowedFieldTypesSet = new Set(allowedFieldTypes || ALLOWED_FIELD_TYPES);

    const availableFilters = ALL_FILTERS.filter((filter) => currentFieldTypes.has(filter.value)).map((filter) => ({
        ...filter,
        isDisabled: !allowedFieldTypesSet.has(filter.value)
    }));

    return availableFilters;
}

const getIconByType = (type) => {
    return FIELD_TYPE_ICON_MAP[type] || "utility:question";
};

export default class FieldPicker extends LightningElement {
    @api selectButtonLabel = "Select a Field";
    @api isBaseObjectHidden = false;
    @api fieldTypeFilter = "BOOLEAN";
    @api depth = 3;
    @api allowedFieldTypes;
    @api isUserFilteringDisabled;

    @track isModalOpen = false;
    @track isLoading = false;
    @track fieldOptions = [];
    @track lookupFields = [];
    @track regularFields = [];
    @track lookupStack = [];
    @track selectedField = null;
    @track hoveredFieldApiName = "";
    @track hoveredFieldPath = "";
    @track searchTerm = "";
    @track filterOptions = [];

    lookupFieldActions = [{ name: "godeeperclick", title: "Go Deeper", icon: "utility:jump_to_right" }];

    connectedCallback() {
        setTimeout(() => {
            this.handleOpenModal();
        }, 1000);
    }

    handleFilterValidationError(event) {
        this.handleError(event.detail);
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase().trim();
    }

    handleFilterSelect(event) {
        const filter = event.detail;
        console.log("🟥  FieldPicker  filter:", filter);
    }

    handleSortChange(event) {
        const sort = event.detail;
        console.log("🟥  FieldPicker  sort:", sort);
    }

    @track allowLookupSelection = true; //TODO api
    _baseObject = "Account";
    _initialFieldPath = "";

    // Validation and defaults
    @api
    get baseObject() {
        return this._baseObject;
    }
    set baseObject(value) {
        if (typeof value !== "string" || !value.trim()) {
            console.warn("Invalid baseObject. Setting to default: Account");
            this._baseObject = "Account";
        } else {
            this._baseObject = value;
        }
        this.resetSelection();
    }

    @api
    get initialFieldPath() {
        return this._initialFieldPath;
    }
    set initialFieldPath(value) {
        if (typeof value !== "string") {
            console.warn("Invalid initialFieldPath. Expected a string.");
            this._initialFieldPath = "";
        } else {
            this._initialFieldPath = value;
        }
    }

    handleOpenModal() {
        this.isModalOpen = true;
        if (!this.selectedField && !this._initialFieldPath) {
            this.loadFields(this._baseObject);
        }
    }

    async loadFields(objectApiName) {
        this.isLoading = true;
        try {
            const data = await getFields({ objectApiName });
            this.fieldOptions = data.map((field) => ({
                label: field.label,
                value: field.apiName,
                type: field.type,
                isLookup: field.isLookup,
                isUpdateable: field.isUpdateable,
                referenceTo: field.lookupObjectApiName,
                iconName: getIconByType(field.type)
            }));
            this.lookupFields = this.fieldOptions.filter((field) => field.isLookup);
            this.regularFields = this.fieldOptions.filter((field) => !field.isLookup);
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
        console.log("🟥  FieldPicker  GO DEEPER");

        // const fieldValue = event.currentTarget.dataset.field;
        // const field = [...this.lookupFields, ...this.regularFields].find((f) => f.value === fieldValue);
        // if (!field.isLookup) {
        //     // throw...
        //     return;
        // }
        // this.lookupStack.push({
        //     relationshipName: field.value,
        //     objectApiName: field.referenceTo
        // });
        // this.selectedField = null;
        // this.loadFields(field.referenceTo);
    }

    handleFieldClick(event) {
        const fieldValue = event.currentTarget.dataset.field;
        const field = [...this.lookupFields, ...this.regularFields].find((f) => f.value === fieldValue);
        if (field) {
            if (field.isLookup) {
                if (this.allowLookupSelection) {
                    this.selectedField = {
                        fieldApiName: field.value,
                        fieldLabel: field.label,
                        fieldType: field.type,
                        isUpdateable: field.isUpdateable,
                        referenceTo: field.referenceTo,
                        relationshipPath: this.buildRelationshipPath(field.value)
                    };
                } else if (this.lookupStack.length < this.depth - 1) {
                    this.lookupStack.push({
                        relationshipName: field.value,
                        objectApiName: field.referenceTo
                    });
                    this.selectedField = null;
                    this.loadFields(field.referenceTo);
                }
            } else {
                this.selectedField = {
                    fieldApiName: field.value,
                    fieldLabel: field.label,
                    fieldType: field.type,
                    isUpdateable: field.isUpdateable,
                    relationshipPath: this.buildRelationshipPath(field.value)
                };
            }
        }
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
        this.dispatchEvent(new CustomEvent("fieldselected", { detail: this.selectedField }));
    }

    handleBack() {
        if (this.lookupStack.length > 0) {
            this.lookupStack.pop();
            const objectApiName = this.lookupStack.length > 0 ? this.lookupStack[this.lookupStack.length - 1].objectApiName : this._baseObject;
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

    // Method to determine if a lookup field should be disabled
    isFieldDisabled(field) {
        if (!field.isLookup) return false;
        if (this.allowLookupSelection) {
            return this.lookupStack.length >= this.depth - 1;
        }
        return this.lookupStack.length >= this.depth - 1;
    }

    resetSelection() {
        this.selectedField = null;
        this.lookupStack = [];
        this.fieldOptions = [];
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
