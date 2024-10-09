import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getFieldPickerConfigs from "@salesforce/apex/FieldPickerConfigController.getFieldPickerConfigs";
import getFieldPickerConfigById from "@salesforce/apex/FieldPickerConfigController.getFieldPickerConfigById";
import deleteRecord from "@salesforce/apex/FieldPickerConfigController.deleteFieldPickerConfig";
import { RefreshEvent } from "lightning/refresh";

export default class FieldPickerPresentation extends LightningElement {
    @track config = {};
    @track configOptions = [];
    @track selectedConfigId;
    @track showFieldPicker = true;

    fieldNames = ["Name", "selectButtonLabel__c", "allowedFieldTypes__c", "allowLookupSelection__c", "baseObject__c", "depth__c", "fieldSort__c", "fieldTypeFilter__c", "initialFieldPath__c", "isBaseObjectHidden__c", "isUserFilteringDisabled__c"];

    connectedCallback() {
        this.loadConfigOptions();
    }

    loadConfigOptions() {
        getFieldPickerConfigs()
            .then((configs) => {
                this.configOptions = configs.map((config) => {
                    return { label: config.Name, value: config.Id };
                });

                if (configs.length > 0) {
                    this.selectedConfigId = configs[0].Id;
                    this.loadConfig(this.selectedConfigId);
                } else {
                    this.selectedConfigId = null;
                    this.config = {};
                    this.refreshFieldPicker();
                }
            })
            .catch((error) => {
                this.showToast("Error loading configurations", error.body.message, "error");
            });
    }

    loadConfig(configId) {
        getFieldPickerConfigById({ configId })
            .then((config) => {
                try {
                    this.config = {
                        ...config,
                        fieldSort__c: config.fieldSort__c ? JSON.parse(config.fieldSort__c) : null,
                        allowedFieldTypes__c: config.allowedFieldTypes__c ? config.allowedFieldTypes__c.split(";") : []
                    };
                } catch (error) {
                    console.log("🟥 error:", error.message);
                    console.log("🟥 config.fieldSort__c:", config.fieldSort__c);
                    this.showToast("Error", JSON.stringify(error), "error");
                    return;
                }

                this.refreshFieldPicker();
            })
            .catch((error) => {
                this.showToast("Error loading configuration", error.body.message, "error");
            });
    }

    handleConfigChange(event) {
        this.selectedConfigId = event.detail.value;
        this.loadConfig(this.selectedConfigId);
    }

    handleSaveSuccess() {
        this.loadConfigOptions();
        this.showToast("Success", "Configuration saved successfully", "success");
        this.refreshFieldPicker();
    }

    handleDelete() {
        deleteRecord({ configId: this.selectedConfigId })
            .then(() => {
                this.showToast("Success", "Configuration deleted successfully", "success");
                this.selectedConfigId = null;
                this.config = {};
                this.loadConfigOptions();
                this.refreshFieldPicker();
            })
            .catch((error) => {
                this.showToast("Error deleting configuration", error.body.message, "error");
            });
    }

    handleCreateNew() {
        this.selectedConfigId = null;
        this.config = {};
        this.refreshFieldPicker();
    }

    refreshFieldPicker() {
        this.dispatchEvent(new RefreshEvent());
    }

    get label() {
        return this.selectedConfigId ? "Update" : "Create";
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(evt);
    }
}
