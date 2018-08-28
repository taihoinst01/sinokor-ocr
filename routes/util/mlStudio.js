var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig');
var execSync = require('child_process').execSync;
var fs = require('fs');
var request = require("request");
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var request = require('sync-request');
var sync = require('./sync.js');


exports.train = function (req, type, done) {
    return new Promise(async function (resolve, reject) {
        try {
            var formData = {
                data: [],
                type: type
            };
            for (var i in req) {
                data.push({ 'data' : req[i].sid, 'class' : req[i].colLbl });
            }
            request.post('http://localhost:3001/ml/train', { json: true, body: formData }, function (err, httpRes, body) {
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
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};