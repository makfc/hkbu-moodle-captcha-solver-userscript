// ==UserScript==
// @name         HKBU Moodle captcha autofill
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Autofill captcha with Tesseract. Due to the "security measures" on chrome, you need to click anywhere on the page, otherwise the autofilled username and password will be empty. (Details: https://stackoverflow.com/questions/36336135/submit-autofill-password-input-field)
// @author       makfc
// @downloadURL  https://raw.githubusercontent.com/makfc/hkbu-moodle-captcha-solver-userscript/master/hkbu_moodle_captcha.user.js
// @match        https://buelearning.hkbu.edu.hk/login/index.php
// @connect      buelearning.hkbu.edu.hk
// @connect      ec2-18-139-209-106.ap-southeast-1.compute.amazonaws.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(async function() {
    'use strict';

    // base64 urlData
    function GetCaptchaAns(urlData) {
        let width = 120;
        let height = 70;
        let x = 0;
        let y = 0;
        var img = new Image();
        var canvas = document.createElement('canvas');
        img.src = urlData;
        img.onload = function(e) {
            canvas.width = width === 0 ? img.width : width;
            canvas.height = height === 0 ? img.height : height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, x, y);
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://ec2-18-139-209-106.ap-southeast-1.compute.amazonaws.com:61239/hkbuMoodleCaptcha",
                dataType: "json",
                responseType: "json",
                contentType: "application/json",
                data: JSON.stringify({
                    "data": urlData.split(',')[1]
                }),
                onload: function(response) {
                    console.log(response.response);

                    document.getElementById("usercaptcha").value = response.response.captcha;
                    ctx.font = "12px Comic Sans MS";
                    ctx.fillStyle = "white";
                    ctx.textAlign = "center";
                    ctx.fillText("Autofill with", canvas.width / 2, img.height + 15);
                    ctx.fillText("Tesseract OCR", canvas.width / 2, img.height + 33);
                    document.getElementById("imgcode").src = canvas.toDataURL();
                    if (response.response.captcha.length !== 4) {
                        document.getElementById("imgcode").click();
                    } else {
                        var loginerrormessage = document.getElementById("loginerrormessage");
                        if (loginerrormessage == null) {
                            document.getElementById("loginbtn").click();
                        } else {
                            let errorCount = GM_getValue("errorCount", 0);
                            errorCount++;
                            if (errorCount <= 2) {
                                GM_setValue("errorCount", errorCount);
                                document.getElementById("loginbtn").click();
                            } else {
                                GM_setValue("errorCount", 0);
                                var text = "<div style=\"color:red;white-space:pre-wrap;\">\
                                            From HKBU Moodle captcha autofill UserScript:<br>\
                                            Due to the \"security measures\" on chrome, you need to click anywhere on the page, otherwise the autofilled username and password will be empty.<br>\
                                            (Details: <a href=\"https://stackoverflow.com/questions/36336135/submit-autofill-password-input-field\">https://stackoverflow.com/questions/36336135/submit-autofill-password-input-field</a>)</div>";
                                document.getElementById("page-content").insertAdjacentHTML('afterbegin', text);
                            }
                        }
                    }
                }
            });
        };
    }

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