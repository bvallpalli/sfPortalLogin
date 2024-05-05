/*
Author: Bala Surendra Vallipalli
Date  : 05-05-24
*/
public without sharing class StudentLoginController {

    @AuraEnabled(cacheable=true)
    public static Student__c authenticateStudent(String rollNumber,String email,String passwordValue){
        List<Student__c> studentData=[SELECT Id,Name,Password__c, Email__c,First_Name__c, Last_Name__c  FROM Student__c
                           WHERE Name=:rollNumber AND Email__c =:email AND Password__c=:passwordValue];
        
        
        return studentData[0];
    }

}