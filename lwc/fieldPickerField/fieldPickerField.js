import { LightningElement, api } from "lwc";

//TODO: /** @type {Field} */
export default class FieldPickerField extends LightningElement {
    @api field;
    @api isDisabled = false;
    @api actionsDisabled = false;
    @api actions = [];
    @api searchTerm = "";

    get labelParts() {
        const label = this.field.label || "";
        const searchTerm = this.searchTerm.toLowerCase();

        if (!searchTerm) {
            return [{ text: label, class: "" }];
        }

        const lowerLabel = label.toLowerCase();
        const startIndex = lowerLabel.indexOf(searchTerm);

        if (startIndex === -1) {
            return [{ text: label, class: "" }];
        }

        const beforeMatch = label.substring(0, startIndex);
        const match = label.substring(startIndex, startIndex + searchTerm.length);
        const afterMatch = label.substring(startIndex + searchTerm.length);

        return [
            { text: beforeMatch, class: "" },
            { text: match, class: "highlight" },
            { text: afterMatch, class: "" }
        ];
    }

    get actionsVisible() {
        return this.actions.length && !this.actionsDisabled;
    }

    handleFieldHover() {
        this.dispatchEvent(new CustomEvent("fieldmouseover", { detail: this.field.apiName }));
    }

    handleFieldMouseOut() {
        this.dispatchEvent(new CustomEvent("fieldmouseout"));
    }

    handleActionClick(event) {
        const actionName = event.currentTarget.dataset.name;
        this.dispatchEvent(new CustomEvent(actionName, { detail: this.field }));
    }

    handleFieldClick() {
        this.dispatchEvent(new CustomEvent("fieldclick", { detail: this.field }));
    }
}
