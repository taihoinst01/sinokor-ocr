'use strict';

var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var request = require('request');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var oracle = require('../util/oracle.js');

const defaults = {
    encoding: 'utf8',
};


/***************************************************************
 * Router
 * *************************************************************/

// [POST] LOCAL OCR API (request binary data)
exports.localOcr = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var returnObj;
        var fileName = req;

        try {
            fs.readFile(propertiesConfig.filepath.convertedImagePath + fileName, function (err, data) {
                if (err) throw err;

                var buffer;
                var base64 = new Buffer(data, 'binary').toString('base64');
                var binaryString = new Buffer(base64, 'base64').toString('binary');
                buffer = new Buffer(binaryString, "binary");

                var params = {
                    'language': 'unk',
                    'detectOrientation': 'true'
                };

                request({
                    headers: {
                        'Ocp-Apim-Subscription-Key': propertiesConfig.ocr.subscriptionKey,
                        'Content-Type': 'application/octet-stream'
                    },
                    uri: propertiesConfig.ocr.uri + '?' + 'language=' + params.language + '&detectOrientation=' + params.detectOrientation,
                    body: buffer,
                    method: 'POST'
                }, function (err, response, body) {
                    if (err) { // request err
                        throw err;
                    } else {
                        if ((JSON.parse(body)).code) { // ocr api error
                            return done(null, { code: parseInt((JSON.parse(body)).code), message: (JSON.parse(body)).message });
                        } else { // 성공
                            return done(null, { code: 200, message: JSON.parse(body) });
                        }
                    }
                });
            });

        } catch (err) {
            reject(err);
            return done(null, { code: 500, message: err });
        } finally {           
        }
    });
};

// [POST] PROXY OCR API (request binary data)
exports.proxyOcr = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var fileName = req;

        try {
            var formData = {
                file: {
                    value: fs.createReadStream(fileName),
                    options: {
                        filename: fileName,
                        contentType: 'image/jpeg'
                    }
                }
            };

            request.post({ url: propertiesConfig.proxy.serverUrl + '/ocr/api', formData: formData }, function (err, httpRes, body) {
                var data = JSON.parse(body);
                //console.log(data);
                return done(null, ocrJson(data.regions));
            });

        } catch (err) {
            reject(err);
        } finally {
        }
    });
};

exports.proxyOcrCMD = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var fileName = req;

        try {
            var formData = {
                file: {
                    value: fs.createReadStream(fileName),
                    options: {
                        filename: fileName,
                        contentType: 'image/jpeg'
                    }
                }
            };

            request.post({ url: propertiesConfig.proxy.serverUrl + '/ocr/api', formData: formData }, function (err, httpRes, body) {
                var data = JSON.parse(body);
                var resIns = oracle.insertOcrData(filename, body);
                //console.log(data);
                return done(null, ocrJson(data.regions));
            });

        } catch (err) {
            reject(err);
        } finally {
        }
    });
};

function ocrJson(regions) {
    var data = [];
    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            data.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
        }
    }
    return data;
}