public with sharing class FieldPickerController {
    @AuraEnabled(cacheable=true)
    public static List<ObjectOption> getAllObjects() {
        List<ObjectOption> objectOptions = new List<ObjectOption>();
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();

        for (Schema.SObjectType sobjectType : schemaMap.values()) {
            Schema.DescribeSObjectResult describeResult = sobjectType.getDescribe();
            if (describeResult.isAccessible()) {
                objectOptions.add(new ObjectOption(describeResult.getLabel(), describeResult.getName()));
            }
        }

        objectOptions.sort();
        return objectOptions;
    }

    @AuraEnabled(cacheable=true)
    public static List<ObjectFieldInfo> getFields(String objectApiName) {
        List<ObjectFieldInfo> fieldInfos = new List<ObjectFieldInfo>();
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);

        if (sObjectType != null) {
            Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
            for (Schema.SObjectField field : fields.values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                ObjectFieldInfo fieldInfo = new ObjectFieldInfo();
                fieldInfo.apiName = fieldDescribe.getName();
                fieldInfo.label = fieldDescribe.getLabel();
                fieldInfo.type = fieldDescribe.getType().name();
                fieldInfo.type = fieldDescribe.getType().name();
                if (fieldDescribe.getType() == Schema.DisplayType.Reference) {
                    fieldInfo.referenceTo = String.valueOf(fieldDescribe.getReferenceTo()[0]);
                    fieldInfo.relationshipName = fieldDescribe.getRelationshipName();
                }
                fieldInfos.add(fieldInfo);
            }
        }
        return fieldInfos;
    }

    public class ObjectOption implements Comparable {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String apiName;

        public ObjectOption(String label, String apiName) {
            this.label = label;
            this.apiName = apiName;
        }

        public Integer compareTo(Object other) {
            ObjectOption otherOption = (ObjectOption) other;
            return this.label.toLowerCase().compareTo(otherOption.label.toLowerCase());
        }
    }

    public class ObjectFieldInfo {
        @AuraEnabled
        public String apiName;
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String referenceTo;
        @AuraEnabled
        public String relationshipName;
    }
}
