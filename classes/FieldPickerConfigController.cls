public with sharing class FieldPickerConfigController {
    @AuraEnabled(cacheable=false)
    public static List<Field_Picker_Input_Config__c> getFieldPickerConfigs() {
        return [SELECT Id, Name FROM Field_Picker_Input_Config__c ORDER BY LastModifiedDate DESC];
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> getFieldPickerConfigById(Id configId) {
        Map<String, SObjectField> fieldsMap = Field_Picker_Input_Config__c.SObjectType.getDescribe().fields.getMap();
        List<String> fieldNames = new List<String>();

        for (String fieldName : fieldsMap.keySet()) {
            if (!isSystemField(fieldName)) {
                fieldNames.add(fieldName);
            }
        }

        String fieldList = String.join(fieldNames, ', ');
        String query = 'SELECT ' + fieldList + ' FROM Field_Picker_Input_Config__c WHERE Id = :configId';
        Field_Picker_Input_Config__c record = Database.query(query);

        Map<String, Object> result = new Map<String, Object>();

        for (String fieldName : fieldNames) {
            String correctCaseFieldName = fieldsMap.get(fieldName).getDescribe().getName();
            result.put(correctCaseFieldName, record.get(fieldName));
        }

        return result;
    }

    private static Boolean isSystemField(String fieldName) {
        Set<String> systemFields = new Set<String>{ 'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate', 'SystemModstamp', 'IsDeleted', 'OwnerId', 'Id' };
        List<String> fieldList = new List<String>();
        for (String f : systemFields) {
            fieldList.add(f.toLowerCase());
        }
        return fieldList.contains(fieldName.toLowerCase());
    }

    @AuraEnabled
    public static void deleteFieldPickerConfig(Id configId) {
        delete [SELECT Id FROM Field_Picker_Input_Config__c WHERE Id = :configId];
    }
}
