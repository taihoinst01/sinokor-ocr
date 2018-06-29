'use strict';
/*
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieparser = require('cookie-parser');
var bodyparser = require('body-parser');
var approot = require('app-root-path').path;
*/
var commMoudle = require(require('app-root-path').path + '/public/js/import.js');
var index = require('./routes/index');
//user
var userDashboard = require('./routes/user/userDashboard')
var ocrFormAnalysis = require('./routes/user/ocrFormAnalysis');
var adminLearning = require('./routes/user/adminLearning');
var batchLearning = require('./routes/user/batchLearning');
var uiLearning = require('./routes/user/uiLearning');
var ocrHistorySearch = require('./routes/user/ocrHistorySearch');
var newDocLearning = require('./routes/user/newDocLearning');
//admin
var adminDashboard = require('./routes/admin/adminDashboard')
var userManagement = require('./routes/admin/userManagement');

var app = importjs.express();

app.use('/uploads', importjs.express.static(__dirname + '/uploads'));
app.use('/excel', importjs.express.static(__dirname + '/excel'));
app.set('views', importjs.path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(importjs.logger('dev'));
app.use(importjs.bodyParser.json());
app.use(importjs.bodyParser.urlencoded({ extended: false }));
app.use(importjs.cookieParser());
app.use(importjs.express.static(importjs.path.join(__dirname, 'public')));

app.use('/', index);
//user
app.use('/userDashboard', userDashboard);
app.use('/ocrFormAnalysis', ocrFormAnalysis);
app.use('/adminLearning', adminLearning);
app.use('/batchLearning', batchLearning);
app.use('/uiLearning', uiLearning);
app.use('/ocrHistorySearch', ocrHistorySearch);
app.use('/newDocLearning', newDocLearning);

//admin
app.use('/adminDashboard', adminDashboard);
app.use('/userManagement', userManagement);

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    importjs.debug('Server Start!! port : ' + server.address().port);
});
