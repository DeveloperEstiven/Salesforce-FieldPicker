import { LightningElement, track } from "lwc";

export default class FieldPickerPresentation extends LightningElement {
    fieldPicker1 = null;
    fieldPicker2 = null;
    fieldPicker3 = null;
    fieldPicker4 = null;
    fieldPicker5 = null;
    fieldPicker6 = null;
    fieldPicker7 = null;
    fieldPicker8 = null;
    fieldPicker9 = null;
    fieldPicker10 = null;
    fieldPicker11 = null;
    fieldPicker12 = null;
    fieldPicker13 = null;

    connectedCallback() {
        this.fieldPicker1 = {
            selectButtonLabel: "Hidden Base Object",
            isBaseObjectHidden: true
        };

        this.fieldPicker2 = {
            selectButtonLabel: "Visible Base Object",
            isBaseObjectHidden: false
        };

        this.fieldPicker3 = {
            selectButtonLabel: "Filtered PICKLISTS",
            fieldTypeFilter: "PICKLIST"
        };

        this.fieldPicker4 = {
            selectButtonLabel: "Allowed types: BOOLEAN + STRING + CURRENCY",
            allowedFieldTypes: ["BOOLEAN", "STRING", "CURRENCY"] //fixme
        };

        this.fieldPicker5 = {
            selectButtonLabel: "Filtering Disabled",
            isUserFilteringDisabled: true
        };

        this.fieldPicker6 = {
            selectButtonLabel: "BOOLEAN Filtered + Filtering Disabled",
            isUserFilteringDisabled: true,
            fieldTypeFilter: "BOOLEAN"
        };

        this.fieldPicker7 = {
            selectButtonLabel: "BOOLEAN Filtered + Allowed TYPE doesn't match",
            isUserFilteringDisabled: false,
            fieldTypeFilter: "BOOLEAN",
            allowedFieldTypes: ["STRING", "CURRENCY"]
        };

        this.fieldPicker8 = {
            selectButtonLabel: "Contact Base Object", //fix
            baseObject: "Contact"
        };

        this.fieldPicker9 = {
            selectButtonLabel: "Sorted by Field ASC",
            fieldSort: { sortBy: "Field", dir: "ASC" }
        };

        this.fieldPicker10 = {
            selectButtonLabel: "Sorted by Type DESC",
            fieldSort: { sortBy: "Type", dir: "DESC" }
        };

        this.fieldPicker11 = {
            selectButtonLabel: "DEPTH = 3",
            depth: 3
        };

        this.fieldPicker12 = {
            selectButtonLabel: "DEPTH = 0",
            depth: 0
        };

        this.fieldPicker13 = {
            selectButtonLabel: "RICH",
            isBaseObjectHidden: true,
            fieldTypeFilter: "STRING",
            fieldSort: { sortBy: "Field", dir: "DESC" },
            depth: 1,
            allowedFieldTypes: ["STRING", "BOOLEAN"], //TODO: works without fieldTypeFilter?
            isUserFilteringDisabled: true,
            baseObject: "Lead"
        };
    }
}
