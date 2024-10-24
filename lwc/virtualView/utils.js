export const EVENT = {
    CHANGE: "itemschange"
};

export const DEFAULT_STATE = {
    viewHeight: 400,
    itemHeight: 40,
    bufferItems: 5
};

/**
 * Parses a property to a number if it's a string and validates it.
 * @param {unknown} value - The property value to parse.
 * @param {keyof DEFAULT_STATE} propertyName - The name of the property for error messages.
 * @param {boolean} isInteger - Whether the number should be an integer.
 * @returns {number} The parsed and validated number.
 */
export const parseNumberProperty = (value, propertyName, isInteger = false) => {
    let parsedValue = value;

    if (typeof value === "string") {
        parsedValue = isInteger ? parseInt(value, 10) : parseFloat(value);
    }

    if (isNaN(parsedValue) || parsedValue <= 0) {
        const defaultValue = DEFAULT_STATE[propertyName] ?? 0;
        console.warn(`Invalid ${propertyName} provided: ${value}. Falling back to default value: ${defaultValue}.`);
        parsedValue = defaultValue;
    }

    return parsedValue;
};
