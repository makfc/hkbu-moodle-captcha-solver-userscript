// ==UserScript==
// @name         HKBU Moodle captcha autofill
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Autofill captcha with Tesseract. Set your username and password in the Values tab to auto-populate.
// @author       makfc
// @downloadURL  https://raw.githubusercontent.com/makfc/hkbu-moodle-captcha-solver-userscript/master/hkbu_moodle_captcha.user.js
// @match        https://buelearning.hkbu.edu.hk/login/index.php
// @connect      buelearning.hkbu.edu.hk
// @connect      ec2-13-250-40-22.ap-southeast-1.compute.amazonaws.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(async function() {
    'use strict';

    var username = GM_getValue("username", "");
    if (username === "") {
        GM_setValue("username", username);
    } else {
        document.getElementById("username").value = username;
    }

    var password = GM_getValue("password", "");
    if (password === "") {
        GM_setValue("password", password);
    } else {
        document.getElementById("password").value = password;
    }
    
    // urlData: base64 string
    function GetCaptchaAns(urlData) {
        var img = new Image();
        img.src = urlData;
        var canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 70;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://ec2-13-250-40-22.ap-southeast-1.compute.amazonaws.com:61239/hkbuMoodleCaptcha",
            dataType: "json",
            responseType: "json",
            contentType: "application/json",
            data: JSON.stringify({
                "data": urlData.split(',')[1]
            }),
            onload: function(response) {
                console.log(response.response);

                document.getElementById("usercaptcha").value = response.response.captcha;

                // Add text to captcha
                ctx.font = "12px Comic Sans MS";
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.fillText("Autofill with", canvas.width / 2, img.height + 15);
                ctx.fillText("Tesseract OCR", canvas.width / 2, img.height + 33);
                document.getElementById("imgcode").src = canvas.toDataURL();

                if (response.response.captcha.length !== 4) {
                    document.getElementById("imgcode").click();
                    return;
                }

                var loginerrormessage = document.getElementById("loginerrormessage");
                if (loginerrormessage == null) {
                    document.getElementById("loginbtn").click();
                    return;
                }

                let errorCount = GM_getValue("errorCount", 0);
                errorCount++;
                if (errorCount < 2) {
                    GM_setValue("errorCount", errorCount);
                    document.getElementById("loginbtn").click();
                    return;
                }

                GM_setValue("errorCount", 0);
                var text = "<div style=\"color:red;white-space:pre-wrap;\">\
                                From HKBU Moodle captcha autofill UserScript:<br>\
                                Please manually click the login button.<br>\
                                Due to the \"security measures\" on chrome, you need to click anywhere on the page, otherwise the autofilled username and password will be empty.<br>\
                                (Details: <a href=\"https://stackoverflow.com/questions/36336135/submit-autofill-password-input-field\">https://stackoverflow.com/questions/36336135/submit-autofill-password-input-field</a>)</div>";
                document.getElementById("page-content").insertAdjacentHTML('afterbegin', text);
            }
        });
    }

    // Click "Other Eligible User" button
    document.getElementById("bu_std_login").style.display = "none";
    document.getElementById("bu_oth_login").style.display = "block";

    var imgcode = document.getElementById('imgcode');
    imgcode.onclick = function() {
        GM_xmlhttpRequest({
            method: "POST",
            dataType: 'json',
            responseType: "json",
            url: "https://buelearning.hkbu.edu.hk/bucaptcha/refreshcaptcha.php",
            onload: function(response) {
                GetCaptchaAns(response.response.imgsrc);
            }
        });
    };

    GetCaptchaAns(imgcode.src);

})();
