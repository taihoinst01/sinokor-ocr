var fs = require('fs');
var PythonShell = require('python-shell')
var sync = require('./sync.js')
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var oracle = require('./oracle.js');
const oracledb = require('oracledb');
var async = require('async');
var execSync = require('child_process').execSync;
var pythonConfig = require(appRoot + '/config/pythonConfig');
var propertiesConfig = require(appRoot + '/config/propertiesConfig');

