import { LightningElement, api } from "lwc";

export default class FieldPickerField extends LightningElement {
    @api field;
    @api additionalClass = "";
    @api actions = [];

    handleFieldHover() {
        this.dispatchEvent(new CustomEvent("fieldmouseover", { detail: this.field.value }));
    }

    handleFieldMouseOut() {
        this.dispatchEvent(new CustomEvent("fieldmouseout"));
    }

    handleActionClick(event) {
        const actionName = event.currentTarget.dataset.name;
        this.dispatchEvent(new CustomEvent(actionName, { detail: this.field }));
    }
}
