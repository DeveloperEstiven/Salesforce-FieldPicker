import { LightningElement, api, track } from "lwc";
import { parseNumberProperty, EVENT, DEFAULT_STATE } from "./utils";

export default class VirtualView extends LightningElement {
    @api viewHeight = DEFAULT_STATE.viewHeight;
    @api itemHeight = DEFAULT_STATE.itemHeight;
    @api bufferItems = DEFAULT_STATE.bufferItems;

    @track offsetY = 0;

    totalHeight = 0;
    totalItems = 0;
    visibleItemCount = 0;
    startIndex = 0;
    _items = [];

    connectedCallback() {
        this.validateApiProperties();
    }

    /**
     * Validates the @api properties and parses them to numbers if they are strings.
     */
    validateApiProperties() {
        this.viewHeight = parseNumberProperty(this.viewHeight, "viewHeight");
        this.itemHeight = parseNumberProperty(this.itemHeight, "itemHeight");
        this.bufferItems = parseNumberProperty(this.bufferItems, "bufferItems", true);
    }

    // Getter and Setter for items with initialization logic
    @api
    get items() {
        return this._items;
    }
    set items(value) {
        this._items = Array.isArray(value) ? value : [];
        this.initializeItems();
    }

    /**
     * Initializes the component state based on the items array.
     */
    initializeItems() {
        this.totalItems = this._items.length;
        this.totalHeight = this.calculateTotalHeight();
        this.updateVisibleData(true);
    }

    /**
     * Handles scroll events and updates visible items.
     */
    scrollHandler() {
        this.updateVisibleData(false);
    }

    /**
     * Calculates visible data based on scroll position or initialization.
     * @param {boolean} isFirstRender - Whether it's the first render or not.
     */
    updateVisibleData(isFirstRender) {
        if (!isFirstRender) {
            const scrollTop = this.getScrollTop();
            const newStartIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferItems);
            if (this.startIndex === newStartIndex) {
                return;
            }
            this.startIndex = newStartIndex;
        }

        const itemsInView = Math.ceil(this.viewHeight / this.itemHeight);
        this.visibleItemCount = Math.min(this.totalItems - this.startIndex, itemsInView + 2 * this.bufferItems);
        this.offsetY = this.startIndex * this.itemHeight;
        this.dispatchEvent(new CustomEvent(EVENT.CHANGE, { detail: this.getVisibleItems() }));
    }

    /**
     * Gets the currently visible items.
     * @returns {Array} The visible items.
     */
    getVisibleItems() {
        return this._items.slice(this.startIndex, this.startIndex + this.visibleItemCount);
    }

    /**
     * Gets the current scroll position of the virtual container.
     * @returns {number} The scroll position.
     */
    getScrollTop() {
        return this.refs.virtualContainer.scrollTop || 0;
    }

    /**
     * Calculates the total height based on the number of items.
     * @returns {number} The total height.
     */
    calculateTotalHeight() {
        return this.totalItems * this.itemHeight;
    }

    // Computed styles for transform, content height, and viewport
    get transformStyle() {
        return `transform: translateY(${this.offsetY}px);`;
    }

    get contentStyle() {
        return `height: ${this.totalHeight}px;`;
    }

    get viewportStyle() {
        return `max-height: ${this.viewHeight}px; overscroll-behavior: none; overflow-y: scroll;`;
    }
}
