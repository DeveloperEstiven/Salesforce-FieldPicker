export const LOOKUP_LEVEL_MAP = {
  PARENT: "lookup-",
  CHILD: "child-lookup-",
  NONE: "NONE"
};

const FIELD_TYPE_ICON_MAP = {
  STRING: "utility:text",
  TEXTAREA: "utility:textarea",
  PICKLIST: "utility:picklist_choice",
  MULTIPICKLIST: "utility:multi_picklist",
  BOOLEAN: "utility:multi_select_checkbox",
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
  TEXT: "utility:text"
};

export const getFieldTypeIcon = (fieldType) => {
  return FIELD_TYPE_ICON_MAP[fieldType] || "utility:question";
};

export const MODAL_CLASS = {
  large: "slds-modal slds-fade-in-open slds-modal_large",
  small: "slds-modal slds-fade-in-open slds-modal_small"
};

const adjustFieldName = (apiName) => (apiName.endsWith("__c") ? apiName.replace("__c", "__r") : apiName);

export const getFieldPath = (lookupFieldName, childLookupFieldName, selectedField) => {
  let path = "";
  if (lookupFieldName) path += adjustFieldName(lookupFieldName);
  if (childLookupFieldName) path += `.${adjustFieldName(childLookupFieldName)}`;
  if (selectedField) path += `${path ? "." : ""}${selectedField}`;
  return path;
};

export const mapNonLookupFields = (fields) => {
  return fields
    .filter((field) => !field.isLookup)
    .map((field) => ({
      isUpdateable: field.isUpdateable,
      label: field.label,
      value: field.apiName,
      type: field.type,
      iconName: getFieldTypeIcon(field.type)
    }));
};

export const mapLookupFields = (fields, level) => {
  const lookupFields = fields.filter((field) => field.isLookup);

  if (level === LOOKUP_LEVEL_MAP.PARENT) {
    return lookupFields.map((field) => ({
      ...field,
      key: `${LOOKUP_LEVEL_MAP.PARENT}${field.apiName}`,
      isDisabled: !field.relationshipName,
      isExpanded: false,
      childLookupFields: []
    }));
  }
  if (level === LOOKUP_LEVEL_MAP.CHILD) {
    return lookupFields;
  }
};

export const mapChildLookupFields = (childFields) => {
  return childFields.map((field) => ({
    ...field,
    key: `${LOOKUP_LEVEL_MAP.CHILD}${field.apiName}`,
    isDisabled: !field.relationshipName,
    isExpanded: false
  }));
};