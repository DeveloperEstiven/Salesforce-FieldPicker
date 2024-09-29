import { LightningElement, track, api } from "lwc";
import getAllObjects from "@salesforce/apex/FieldPickerController.getAllObjects";
import getFields from "@salesforce/apex/FieldPickerController.getFields";
import parseRelationshipPath from "@salesforce/apex/FieldPickerController.parseRelationshipPath";
import getObjectLabel from "@salesforce/apex/FieldPickerController.getObjectLabel";

import { LOOKUP_LEVEL_MAP, MODAL_CLASS, getFieldPath, mapNonLookupFields, mapLookupFields, mapChildLookupFields, getFieldTypeIcon } from "./utils";

export default class FieldPicker extends LightningElement {
    @api relationshipPath = "";
    @api fieldId = ""; //id of parent field
    @api fieldText = "";
    @api initialFieldType = "";
    @api isBaseObjectHidden = false;
    @api fieldTypeFilter = ""; // "TEXT" or "BOOLEAN"

    @track lookupField = "";
    @track lookupFieldObjectApiName = "";
    @track childLookupField = "";
    @track childLookupFieldObjectApiName = "";
    @track field = "";

    lookupRelationshipName = "";
    childLookupRelationshipName = "";

    @track searchTerm = "";
    @track filteredFields = [];

    baseObjectLabel = "";
    @track isModalOpen = false;
    @track objectOptions = [];
    @track isLoading = false;
    @track currentObject = "";
    @track hoveredField = "";
    requiresInitialization = false;

    @track lookupFieldsHierarchy = [];
    @track nonLookupFields = [];

    _baseObject = "";
    _isInternalUpdate = false;

    @api
    set baseObject(value) {
        if (!this._baseObject) {
            //initial render
            this._baseObject = value;
            return;
        }

        this._baseObject = value;
        if (this._isInternalUpdate) {
            this._isInternalUpdate = false;
        } else {
            this.handleBaseObjectChangeInParentComponent();
        }
    }

    get baseObject() {
        return this._baseObject;
    }

    handleBaseObjectChangeInParentComponent() {
        this.requiresInitialization = true;
        this.relationshipPath = "";

        this.lookupField = "";
        this.lookupFieldObjectApiName = "";
        this.childLookupField = "";
        this.childLookupFieldObjectApiName = "";
        this.field = "";
        this.lookupRelationshipName = "";
        this.childLookupRelationshipName = "";
        this.searchTerm = "";
        this.filteredFields = [];
        this.baseObjectLabel = "";
        this.currentObject = "";
        this.hoveredField = "";
        this.lookupFieldsHierarchy = [];
        this.nonLookupFields = [];
    }

    async connectedCallback() {
        if (this.baseObject && this.relationshipPath && !this.field) {
            this.requiresInitialization = true;
        }
    }

    async getApiNames() {
        try {
            const result = await parseRelationshipPath({ objectApiName: this.baseObject, relationshipPath: this.relationshipPath });
            this.lookupField = result.lookupField;
            this.lookupFieldObjectApiName = result.lookupFieldObjectApiName;
            this.childLookupField = result.childLookupField;
            this.childLookupFieldObjectApiName = result.childLookupFieldObjectApiName;
            this.field = result.field;
        } catch (error) {
            console.error("Error parsing relationship path:", JSON.stringify(error));
        }
    }

    get isSelectDisabled() {
        return !this.field;
    }

    get modalClass() {
        return MODAL_CLASS[this.baseObject ? "large" : "small"];
    }

    get currentRelationshipPath() {
        return getFieldPath(this.lookupRelationshipName, this.childLookupRelationshipName, this.field);
    }

    async handleOpenModal() {
        this.isModalOpen = true;
        if (this.baseObject) {
            await this.fetchBaseObjectLabel();
            await this.handleBaseObjectClick();
        } else {
            await this.fetchAllObjects();
        }
    }

    async handleChangeField() {
        this.isModalOpen = true;
        if (this.requiresInitialization) {
            await this.initializeSelectedFields();
        } else {
            this.isModalOpen = true;
            if (this.lookupField) {
                this.expandLookupField(`${LOOKUP_LEVEL_MAP.PARENT}${this.lookupField}`);

                if (this.childLookupField) {
                    this.expandChildLookupField(`${LOOKUP_LEVEL_MAP.CHILD}${this.childLookupField}`, this.lookupField);
                }
            }
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                this.highlightInitialFields();
            }, 500);
        }
    }

    async fetchAllObjects() {
        this.isLoading = true;
        try {
            const data = await getAllObjects();
            this.objectOptions = data.map(({ label, apiName }) => ({ label, value: apiName }));
        } catch (error) {
            console.log("🟥  fetchAllObjects  error:", JSON.stringify(error));
        } finally {
            this.isLoading = false;
        }
    }

    async initializeSelectedFields() {
        this.isLoading = true;
        try {
            await this.getApiNames();

            if (!this.baseObjectLabel) {
                await this.fetchBaseObjectLabel();
            }

            await this.fetchFields(this.baseObject);

            if (this.lookupField) {
                const lookupField = this.expandLookupField(`${LOOKUP_LEVEL_MAP.PARENT}${this.lookupField}`);
                const childLookupFields = await this.fetchFields(lookupField.lookupObjectApiName, LOOKUP_LEVEL_MAP.CHILD);
                lookupField.childLookupFields = mapChildLookupFields(childLookupFields);

                if (this.childLookupField) {
                    const childLookupField = this.expandChildLookupField(`${LOOKUP_LEVEL_MAP.CHILD}${this.childLookupField}`, this.lookupField);
                    await this.fetchFields(childLookupField.lookupObjectApiName, LOOKUP_LEVEL_MAP.NONE);
                }
            }

            this.highlightInitialFields();

            this.requiresInitialization = false;
        } catch (error) {
            console.error("Error initializing selected fields:", error);
            this.requiresInitialization = true;
        } finally {
            this.isLoading = false;
        }
    }

    async fetchBaseObjectLabel() {
        this.isLoading = true;
        try {
            // if (this.baseObjectLabel) return;
            const label = await getObjectLabel({ objectApiName: this.baseObject });
            this.baseObjectLabel = label || "";
        } catch (error) {
            console.error("Error fetching base object label:", error);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchFields(objectApiName, level = LOOKUP_LEVEL_MAP.PARENT) {
        this.isLoading = true;

        this.searchTerm = "";
        this.currentObject = objectApiName;
        try {
            const data = await getFields({ objectApiName });
            this.nonLookupFields = mapNonLookupFields(data);
            this.filterFields(); // Apply filtering based on updated data
            if (level !== LOOKUP_LEVEL_MAP.NONE) {
                const lookupFields = mapLookupFields(data, level);
                if (level === LOOKUP_LEVEL_MAP.PARENT) {
                    this.lookupFieldsHierarchy = lookupFields;
                }
                return lookupFields;
            }
            return null;
        } catch (error) {
            console.error("Error fetching object fields:", error);
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    expandLookupField(fieldKey) {
        const lookupField = this.lookupFieldsHierarchy.find((field) => field.key === fieldKey);
        if (lookupField) {
            lookupField.isExpanded = true;
        }
        this.lookupRelationshipName = lookupField.relationshipName;
        this.lookupField = lookupField.apiName;
        this.lookupFieldObjectApiName = lookupField.lookupObjectApiName;
        return lookupField;
    }

    expandChildLookupField(fieldKey, compareTo) {
        const parentField = this.lookupFieldsHierarchy.find((field) => field.apiName === compareTo);
        if (!parentField) {
            return null;
        }
        const childLookupField = parentField.childLookupFields.find((childLookup) => childLookup.key === fieldKey);
        if (childLookupField) {
            childLookupField.isExpanded = true;
        }
        this.childLookupRelationshipName = childLookupField.relationshipName;
        this.childLookupField = childLookupField.apiName;
        this.childLookupFieldObjectApiName = childLookupField.lookupObjectApiName;
        return childLookupField;
    }

    highlightInitialFields() {
        if (this.lookupField) {
            this.toggleActiveClass(`${LOOKUP_LEVEL_MAP.PARENT}${this.lookupField}`);
        } else {
            this.toggleActiveClass(this.baseObject);
        }

        if (this.childLookupField) {
            this.toggleActiveClass(`${LOOKUP_LEVEL_MAP.CHILD}${this.childLookupField}`);
        }

        // This should be at the bottom
        this.toggleActiveClass(this.field, ".check-item");
    }

    toggleActiveClass(id, el = "div", className = "is-selected") {
        const prevActive = this.template.querySelector(`${el}.${className}`);
        prevActive?.classList.remove(className);

        const lookup = this.template.querySelector(`${el}[data-field="${id}"]`);
        lookup?.classList.add(className);
    }

    handleFieldClick(event) {
        const selectedField = event.currentTarget.dataset.field;
        if (this.field === selectedField) {
            this.clearSelectedField();
            return;
        }

        this.clearSelectedField();
        this.field = selectedField;
        event.currentTarget.classList.add("is-selected");
    }

    clearSelectedField() {
        this.field = "";
        const prevSelected = this.template.querySelector(".check-item.is-selected");
        if (prevSelected) {
            prevSelected.classList.remove("is-selected");
        }
    }

    closeAllLookupFields() {
        this.lookupFieldsHierarchy.forEach((field) => {
            field.isExpanded = false;
            field.childLookupFields?.forEach((child) => (child.isExpanded = false));
        });
    }

    async handleLookupClick(event) {
        const selectedField = event.currentTarget.dataset.field;
        this.childLookupRelationshipName = "";
        this.clearSelectedField();

        if (selectedField === `${LOOKUP_LEVEL_MAP.PARENT}${this.lookupField}` && !this.childLookupField) {
            await this.handleBaseObjectClick();
            return;
        }

        this.closeAllLookupFields();
        this.toggleActiveClass(selectedField);

        const lookupField = this.expandLookupField(selectedField);
        const childLookupFields = await this.fetchFields(lookupField.lookupObjectApiName, LOOKUP_LEVEL_MAP.CHILD);
        lookupField.childLookupFields = mapChildLookupFields(childLookupFields);
    }

    collapseChildLookupFields() {
        this.lookupFieldsHierarchy.forEach((field) => {
            if (field.apiName === this.lookupField) {
                field.childLookupFields.forEach((child) => (child.isExpanded = false));
            }
        });
    }

    async handleChildLookupClick(event) {
        const selectedField = event.currentTarget.dataset.field;
        this.clearSelectedField();
        this.field = "";
        if (selectedField === `${LOOKUP_LEVEL_MAP.CHILD}${this.childLookupField}`) {
            this.collapseChildLookupFields();
            this.handleBaseObjectClick();
            return;
        }

        this.collapseChildLookupFields();
        this.toggleActiveClass(selectedField);
        const lookupField = this.expandChildLookupField(selectedField, this.lookupField);
        await this.fetchFields(lookupField.lookupObjectApiName, LOOKUP_LEVEL_MAP.NONE);
    }

    async handleBaseObjectClick() {
        this.lookupRelationshipName = "";
        this.childLookupRelationshipName = "";
        if (this.currentObject === this.baseObject) {
            return;
        }
        this.toggleActiveClass(this.baseObject);
        this.closeAllLookupFields();
        this.clearSelectedField();

        await this.fetchFields(this.baseObject);
    }

    handleObjectChange(event) {
        this._isInternalUpdate = true;
        this.baseObject = event.detail.value;
        this.baseObjectLabel = event.target.options.find((opt) => opt.value === this.baseObject).label;
        this.handleBaseObjectClick();
    }

    handleCloseModal() {
        this.searchTerm = "";
        this.filteredFields = this.nonLookupFields;
        this.isModalOpen = false;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase().trim();
        this.filterFields();
    }

    filterFields() {
        this.filteredFields = this.nonLookupFields.filter((field) => {
            let matchesFilter = true;

            if (this.fieldTypeFilter === "TEXT") {
                matchesFilter = field.type !== "BOOLEAN"; // Allow all fields except BOOLEAN types
            } else if (this.fieldTypeFilter === "BOOLEAN") {
                matchesFilter = field.type === "BOOLEAN"; // Only allow BOOLEAN types
            }

            const matchesSearch = this.searchTerm?.trim()
                ? field.label.toLowerCase().includes(this.searchTerm.toLowerCase()) || field.value.toLowerCase().includes(this.searchTerm.toLowerCase())
                : true;

            return matchesFilter && matchesSearch;
        });
    }

    get fieldTypeIcon() {
        if (!this.fieldType && !this.initialFieldType) return "";
        return getFieldTypeIcon(this.fieldType || this.initialFieldType);
    }

    get fieldType() {
        return this.filteredFields.find((field) => field.value === this.field)?.type;
    }

    get isFieldUpdateable() {
        return this.filteredFields.find((field) => field.value === this.field)?.isUpdateable;
    }

    handleHoverField(event) {
        const fieldKey = event.currentTarget.dataset.field;
        let cleanedFieldKey = fieldKey;
        if (cleanedFieldKey.startsWith(LOOKUP_LEVEL_MAP.PARENT)) {
            cleanedFieldKey = cleanedFieldKey.replace(LOOKUP_LEVEL_MAP.PARENT, "");
        } else if (cleanedFieldKey.startsWith(LOOKUP_LEVEL_MAP.CHILD)) {
            cleanedFieldKey = cleanedFieldKey.replace(LOOKUP_LEVEL_MAP.CHILD, "");
        }
        this.hoveredField = cleanedFieldKey;
    }

    handleHoverOut() {
        this.hoveredField = "";
    }

    handleFieldSelect() {
        this.isModalOpen = false;
        this.relationshipPath = this.currentRelationshipPath;

        const selectedEvent = new CustomEvent("fieldselected", {
            detail: {
                fieldId: this.fieldId,
                fieldText: this.fieldText,
                object: this.baseObject,
                field: this.field,
                fieldType: this.fieldType,
                isUpdateable: this.isFieldUpdateable,
                lookup: this.lookupField,
                lookupObjectApiName: this.lookupFieldObjectApiName,
                childLookup: this.childLookupField,
                childLookupObjectApiName: this.childLookupFieldObjectApiName,
                relationship: this.relationshipPath
            }
        });
        this.dispatchEvent(selectedEvent);
    }

    get fieldSelectionMessage() {
        if (!this.fieldTypeFilter) {
            return "";
        }
        if (this.fieldTypeFilter === "TEXT") {
            return "Any field except Checkboxes can be selected.";
        } else if (this.fieldTypeFilter === "BOOLEAN") {
            return "Only Checkbox fields can be selected.";
        }
        return `Only ${this.fieldTypeFilter} fields can be selected.`;
    }
}
