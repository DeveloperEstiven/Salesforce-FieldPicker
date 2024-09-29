public with sharing class FieldPickerController {
    @AuraEnabled(cacheable=true)
    public static List<ObjectOption> getAllObjects() {
      List<ObjectOption> objectOptions = new List<ObjectOption>();
      Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
  
      for (String objectName : schemaMap.keySet()) {
        Schema.DescribeSObjectResult objDescribe = schemaMap.get(objectName).getDescribe();
        if (objDescribe.isAccessible() && objDescribe.isCreateable()) {
          objectOptions.add(new ObjectOption(objDescribe.getLabel(), objDescribe.getName()));
        }
      }
  
      objectOptions.sort(new ObjectOptionComparator());
      return objectOptions;
    }
  
    @AuraEnabled(cacheable=true)
    public static List<ObjectFieldInfo> getFields(String objectApiName) {
      List<ObjectFieldInfo> fieldInfos = new List<ObjectFieldInfo>();
  
      try {
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
        if (sObjectType != null) {
          Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
  
          for (Schema.SObjectField field : fields.values()) {
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            Schema.DisplayType fieldType = fieldDescribe.getType();
  
            ObjectFieldInfo fieldInfo = new ObjectFieldInfo();
            fieldInfo.apiName = fieldDescribe.getName();
            fieldInfo.label = fieldDescribe.getLabel();
            fieldInfo.isUpdateable = fieldDescribe.isUpdateable();
            fieldInfo.isLookup = fieldType == Schema.DisplayType.Reference;
            if (fieldInfo.isLookup) {
              fieldInfo.lookupObjectApiName = String.valueOf(fieldDescribe.getReferenceTo()[0]);
              fieldInfo.relationshipName = fieldDescribe.getRelationshipName();
            }
            fieldInfo.type = fieldType.name();
            fieldInfos.add(fieldInfo);
          }
        }
      } catch (Exception e) {
        throw new AuraHandledException('Error retrieving field information: ' + e.getMessage());
      }
  
      return fieldInfos;
    }
  
    @AuraEnabled(cacheable=true)
    public static String getObjectLabel(String objectApiName) {
      try {
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
        if (sObjectType != null) {
          return sObjectType.getDescribe().getLabel();
        }
        return null;
      } catch (Exception e) {
        throw new AuraHandledException('Error retrieving object label: ' + e.getMessage());
      }
    }
  
    @AuraEnabled(cacheable=true)
    public static Map<String, String> parseRelationshipPath(String objectApiName, String relationshipPath) {
      Map<String, String> parsedFields = new Map<String, String>();
  
      String[] parts = relationshipPath.split('\\.');
      String currentObjectName = objectApiName;
  
      for (Integer i = 0; i < parts.size(); i++) {
        String relationshipName = parts[i];
  
        if (i == parts.size() - 1) {
          parsedFields.put('field', relationshipName);
          continue;
        }
  
        String apiFieldName = getApiFieldName(currentObjectName, relationshipName);
  
        if (apiFieldName == null) {
          throw new AuraHandledException('Unable to resolve API name for relationship: ' + relationshipName);
        }
  
        currentObjectName = getRelatedObjectName(currentObjectName, apiFieldName);
        if (i == 0) {
          parsedFields.put('lookupField', apiFieldName);
          parsedFields.put('lookupFieldObjectApiName', currentObjectName);
        } else if (i == 1) {
          parsedFields.put('childLookupField', apiFieldName);
          parsedFields.put('childLookupFieldObjectApiName', currentObjectName);
        }
      }
  
      return parsedFields;
    }
  
    private static String getApiFieldName(String objectName, String relationshipName) {
      Schema.DescribeSObjectResult describeSObjectResult = Schema.getGlobalDescribe().get(objectName).getDescribe();
      if (describeSObjectResult == null) {
        return null;
      }
  
      Map<String, Schema.SObjectField> fields = describeSObjectResult.fields.getMap();
      for (String fieldName : fields.keySet()) {
        Schema.DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();
        String currentRelationshipName = fieldDescribe.getRelationshipName();
        if (currentRelationshipName != null && currentRelationshipName.equalsIgnoreCase(relationshipName)) {
          return fieldDescribe.getName();
        }
      }
      return null;
    }
  
    private static String getRelatedObjectName(String objectName, String apiFieldName) {
      Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
      if (sObjectType == null) {
        return null;
      }
  
      Schema.DescribeSObjectResult describeSObjectResult = sObjectType.getDescribe();
      if (describeSObjectResult == null) {
        return null;
      }
  
      Schema.SObjectField field = describeSObjectResult.fields.getMap().get(apiFieldName);
      if (field != null) {
        return field.getDescribe().getReferenceTo().get(0).getDescribe().getName();
      }
      return null;
    }
  
    public class ObjectFieldInfo {
      @AuraEnabled
      public String apiName;
      @AuraEnabled
      public String label;
      @AuraEnabled
      public Boolean isLookup;
      @AuraEnabled
      public Boolean isUpdateable;
      @AuraEnabled
      public String lookupObjectApiName;
      @AuraEnabled
      public String relationshipName;
      @AuraEnabled
      public String type;
    }
  
    public class ObjectOption {
      @AuraEnabled
      public String label;
      @AuraEnabled
      public String apiName;
  
      public ObjectOption(String label, String apiName) {
        this.label = label;
        this.apiName = apiName;
      }
    }
  
    public class ObjectOptionComparator implements Comparator<ObjectOption> {
      public Integer compare(ObjectOption o1, ObjectOption o2) {
        return o1.label.toLowerCase().compareTo(o2.label.toLowerCase());
      }
    }
  }