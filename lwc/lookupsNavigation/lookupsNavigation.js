import { api, LightningElement } from "lwc";
import breadcrumbs from "./breadcrumbs.html";
import button from "./button.html";

export default class LookupsNavigation extends LightningElement {
    /** @type {'breadcrumbs' | 'button'} */
    @api variant;
    @api lookupStack;
    @api rootObject;

    render() {
        return this.variant === "breadcrumbs" ? breadcrumbs : button;
    }

    goToPreviousStackItem() {
        const lastIndex = this.lookupStack.length - 1;
        this.goBackInStack(lastIndex - 1);
    }

    handleStackNavigation(event) {
        const clickedIndex = Number(event.currentTarget.dataset.index);
        this.goBackInStack(clickedIndex);
    }

    goBackInStack(index) {
        this.selectedField = null;

        if (index < -1 || index >= this.lookupStack.length) {
            return console.warn(`Index ${index} is out of bounds:`, this.lookupStack);
        }

        if (index === -1) {
            this.dispatchEvent(new CustomEvent("navigation", { detail: { objectApiName: this.rootObject, lookupStack: [] } }));
            return;
        }

        if (index === this.lookupStack.length - 1) return;

        this.dispatchEvent(new CustomEvent("navigation", { detail: { objectApiName: this.lookupStack[index].objectApiName, lookupStack: this.lookupStack.slice(0, index + 1) } }));
    }

    get isBackDisabled() {
        return !this.lookupStack.length;
    }

    get richLookupStack() {
        return this.lookupStack.map((item, index) => {
            return {
                ...item,
                isLast: index === this.lookupStack.length - 1
            };
        });
    }
}
