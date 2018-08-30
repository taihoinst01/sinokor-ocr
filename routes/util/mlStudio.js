var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig');
var execSync = require('child_process').execSync;
var fs = require('fs');
var request = require("request");
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var sync = require('./sync.js');


exports.train = function (req, done) {
    return new Promise(async function (resolve, reject) {
        try {
            var ogCompanySid = [];
            var ctnmSid = [];
            var formData = {
                flmdata: [],
                fmData: [],
                cmData: []
            }

            for (var i in req.data) {
                var item = req.data[i];
                formData.cmData.push({ 'data': item.sid, 'class': item.colLbl });
            }

            /*
            var formData = {
                flmdata: [],
                fmData: [],
                cmData: []
            };

            for (var i in req.data) {
                var item = req.data[i];
                var classNum = 3;
                if (item.colLbl == 0) {
                    classNum = 1;
                    ogCompanySid.push(item.sid);
                } else if (item.colLbl == 1) {
                    classNum = 2;
                    ctnmSid.push(item.sid);
                }
                formData.flmdata.push({ 'data': item.sid, 'class': classNum });
                formData.cmData.push({ 'data': req.docCategory.DOCTYPE + ',' + item.sid, 'class': item.colLbl });
            }                            

            if (ogCompanySid && ctnmSid) {
                if (ogCompanySid.length == 1 && ctnmSid.length == 1) { // 1:1
                    formData.fmData.push({ 'data': ogCompanySid[0] + ',' + ctnmSid[0], 'class': req.docCategory.DOCTYPE });
                } else if (ogCompanySid.length == 1 && ctnmSid.length > 1) { // 1:N
                    for (var i in ctnmSid) {
                        formData.fmData.push({ 'data': ogCompanySid[0] + ',' + ctnmSid[i], 'class': req.docCategory.DOCTYPE });
                    }
                } else if (ogCompanySid.length > 1 && ctnmSid.length == 1) { // N;1
                    for (var i in ogCompanySid) {
                        formData.fmData.push({ 'data': ogCompanySid[i] + ',' + ctnmSid[0], 'class': req.docCategory.DOCTYPE });
                    }
                }
            } else {
                formData.fmData = [];
            }
            */

            request.post('http://sinokor-rest.azurewebsites.net/ml/train', { json: true, body: formData }, function (err, httpRes, body) {
                return done(null, body);
            });
            /*
            request.post(propertiesConfig.proxy.serverUrl +'/ml/train', { json: true, body: formData }, function (err, httpRes, body) {
                return done(null, body);
            });
            */

        } catch (err) { 
            reject(err);
        } finally {
            
        }
    });
};

exports.run = function (req, type, done) {
    return new Promise(async function (resolve, reject) {
        try {
            let conn;
            let result;
            conn = await oracledb.getConnection(dbConfig);

            var formData = {
                data: req,
                type: type
            };

            /*
            request.post('http://localhost:3001/ml/api', { json: true, body: formData }, function (err, httpRes, body) {
                return done(null, body);
            });
            */
            
            request.post('http://sinokor-rest.azurewebsites.net/ml/api', { json: true, body: formData }, function (err, httpRes, body) {
                return done(null, body);
            });
            
        } catch (err) {
            reject(err);
        } finally {

        }
    });
};