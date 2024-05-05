/*
Author: Bala Surendra Vallipalli
Date  : 05-05-24
*/
import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import STUDENT_BG from "@salesforce/resourceUrl/studentbg";
import authenticateStudentInfo from '@salesforce/apex/StudentLoginController.authenticateStudent';
export default class StudentSalesforcePortalLogin extends LightningElement {
    @api sideLogo = STUDENT_BG;
    @track email = '';
    @track password = '';
    @track isAuthenticated;
    @track studentData;
    @track rollNumber;
    @track isrollNumberValid;
    @track isCookieExists = false;
    @track showSpinner;
    @track showLoginPage = false;
    @track fullName = '';
    @track cookie1;
    @track cookie2;
    @track cookie3;

    renderedCallback() {
        this.showSpinner = false
    }

    connectedCallback() {
        this.showSpinner = true
        this.isAuthenticated = false;
        this.rollNumber = this.getCookie('UserName');
        this.password = this.getCookie('pwd');
        this.email = this.getCookie('email');
        if (this.rollNumber && this.email && this.password) {
            this.isCookieExists = true;
            this.isEmailValid = true;
            this.isPasswordValid = true;
            this.handleLogin();
        } else {
            //this.showSpinner=false;
            this.isCookieExists = false;
            this.showLoginPage = true;
        }
        console.log('rollNumber ' + this.rollNumber);
        console.log('password ' + this.password);
        console.log('email ' + this.email);
    }

    handleEmailChange(event) {
        this.email = event.target.value;
        this.isEmailValid = this.validateEmail(this.email);
    }

    handlePasswordChange(event) {
        this.password = event.target.value;
        this.isPasswordValid = this.validatePassword(this.password);
    }
    handleRollNumberChange(event) {
        try {
            this.isrollNumberValid = false;
            this.rollNumber = event.target.value;
            if (this.rollNumber) {
                this.isrollNumberValid = true;
            }
        } catch (e) {
            console.log('Error :' + JSON.stringify(e));
        }
    }

    handleLogin() {
        this.showSpinner = true;
        console.log('Email ' + this.email);
        console.log('Password ' + this.password);
        console.log('ROll Number ' + this.rollNumber);
        if (this.isEmailValid && this.isPasswordValid) {
            authenticateStudentInfo({ rollNumber: this.rollNumber.toString(), email: this.email.toString(), passwordValue: this.password.toString() })
                .then(result => {                    
                    console.log('Result ' + JSON.stringify(result));
                    if (result) {
                        if (this.isCookieExists === false) {
                            //hours in last param indicates the cookie expiration in Hours
                            this.setCookie('UserName', this.rollNumber, 2);
                            this.setCookie('pwd', this.password, 2);
                            this.setCookie('email', this.email, 2);
                        }
                        this.showLoginPage = false;
                        this.isAuthenticated = true;
                        this.studentData = result;
                        this.fullName = 'Welcome ' + this.studentData.First_Name__c + ',' + this.studentData.Last_Name__c;
                        // Show Authenticated Toast Message
                        if (this.isCookieExists === false) {
                            this.showToast('Success', 'Successfully Authenticated', 'success');
                        }
                        this.showSpinner = false;
                    } else {
                        this.showLoginPage = true;
                        this.isAuthenticated = false;
                        this.showSpinner = false;
                        // Show Invalid Username or Password Toast Message
                        this.showToast('Error', 'Invalid Username or Password', 'error');
                    }
                })
                .catch(error => {
                    this.showLoginPage = true;
                    this.isAuthenticated = false;
                    this.showToast('Error', 'Invalid Username or Password', 'error');
                    // Handle any errors that occur during the Apex call
                    console.error('Authentication Error:', error);

                });
        } else {
            this.showToast('Error', 'Invalid Username or Password', 'error');
            console.error('Invalid email or password');
        }
    }

    validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    validatePassword(password) {
        // Add your password validation logic here
        // For example, you can check for minimum length
        return password.length >= 6;
    }

    get isSubmitDisabled() {
        return !(this.isEmailValid && this.isPasswordValid && this.isrollNumberValid);
    }
    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }
    handleClickData(event) {
        // Access the id of the clicked div
        const clickedDivId = event.target.id;
        console.log('Clicked div id:' + clickedDivId);
    }

    sessionGet(key) {
        let stringValue = window.sessionStorage.getItem(key)
        if (stringValue !== null) {
            let value = JSON.parse(stringValue)
            let expirationDate = new Date(value.expirationDate)
            if (expirationDate > new Date()) {
                return value.value
            } else {
                window.sessionStorage.removeItem(key)
            }
        }
        return null
    }

    // add into session
    sessionSet(key, value, expirationInMin) {
        expirationInMin=10;
        let expirationDate = new Date(new Date().getTime() + (60000 * expirationInMin))
        let newValue = {
            value: value,
            expirationDate: expirationDate.toISOString()
        }
        window.sessionStorage.setItem(key, JSON.stringify(newValue))
    }

    // Set a Cookie
    setCookie(cName, cValue, hours) {
        let date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
        if (cName == 'UserName') {
            this.cookie1 = document.cookie
        }
        if (cName== 'email') {
            this.cookie2 = document.cookie
        }
        if (cName == 'pwd') {
            this.cookie3 = document.cookie
        }
    }
    getCookieValue(username) {
        const name = username + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return '';
    }

    getCookie(name) {
        const cookieName = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        if (name == 'UserName') {
            this.cookie1 = decodedCookie
        }
        if (name== 'email') {
            this.cookie2 =decodedCookie
        }
        if (name == 'pwd') {
            this.cookie3 = decodedCookie
        }
        const cookieArray = decodedCookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return null;
    }

    handleLogOut(event) {
        this.setCookie('UserName','', 0);
        this.setCookie('email','', 0);
        this.setCookie('pwd','', 0);
        location.reload()
    }

}