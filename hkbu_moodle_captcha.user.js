// ==UserScript==
// @name         HKBU Moodle captcha autofill
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Autofill captcha with Tesseract
// @author       makfc
// @homepage     https://github.com/makfc/hkbu-moodle-captcha-solver-userscript
// @updateURL    https://github.com/makfc/hkbu-moodle-captcha-solver-userscript/raw/master/hkbu_moodle_captcha.user.js
// @downloadURL  https://github.com/makfc/hkbu-moodle-captcha-solver-userscript/raw/master/hkbu_moodle_captcha.user.js
// @match        https://buelearning.hkbu.edu.hk/login/index.php
// @connect      buelearning.hkbu.edu.hk
// @connect      ec2-18-139-209-106.ap-southeast-1.compute.amazonaws.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function () {
    'use strict';

    function GetCaptchaAns(urlData) {//data:image/png;base64,xyz=
        let width = 120;
        let height = 70;
        let x = 0;
        let y = 0;
        var img = new Image();
        var canvas = document.createElement('canvas');
        img.src = urlData;
        img.onload = function (e) {
            canvas.width = width === 0 ? img.width : width;
            canvas.height = height === 0 ? img.height : height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, x, y);
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://ec2-18-139-209-106.ap-southeast-1.compute.amazonaws.com:61239/hkbuMoodleCaptcha",
                dataType: "json",
                responseType: "json",
                data: JSON.stringify({"data": urlData.split(',')[1]}),
                onload: function (response) {
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
                    }
                },
                contentType: "application/json"
            });
        };
    }

    var imgcode = document.getElementById('imgcode');
    imgcode.onclick = function () {
        GM_xmlhttpRequest({
            method: "POST",
            dataType: 'json',
            responseType: "json",
            url: "https://buelearning.hkbu.edu.hk/bucaptcha/refreshcaptcha.php",
            onload: function (response) {
                GetCaptchaAns(response.response.imgsrc);
            }
        });
    };

    GetCaptchaAns(imgcode.src);

})();
