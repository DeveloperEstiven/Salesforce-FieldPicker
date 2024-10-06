import { LightningElement, api } from "lwc";

export default class FieldPickerField extends LightningElement {
    //TODO: /** @type {Field} */
    @api field;
    @api additionalClass = "";
    @api actions = [];

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
