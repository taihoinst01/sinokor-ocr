'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var appRoot = require('app-root-path').path;

var index = require('./routes/index');
//user
var userDashboard = require('./routes/user/userDashboard')
var ocrFormAnalysis = require('./routes/user/ocrFormAnalysis');
var adminLearning = require('./routes/user/adminLearning');
var uiLearning = require('./routes/user/uiLearning');
var ocrHistorySearch = require('./routes/user/ocrHistorySearch');
var newDocLearning = require('./routes/user/newDocLearning');
//admin
var adminDashboard = require('./routes/admin/adminDashboard')
var userManagement = require('./routes/admin/userManagement');

var app = express();

app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/excel', express.static(__dirname + '/excel'));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
//user
app.use('/userDashboard', userDashboard);
app.use('/ocrFormAnalysis', ocrFormAnalysis);
app.use('/adminLearning', adminLearning);
app.use('/uiLearning', uiLearning);
app.use('/ocrHistorySearch', ocrHistorySearch);
app.use('/newDocLearning', newDocLearning);

//admin
app.use('/adminDashboard', adminDashboard);
app.use('/userManagement', userManagement);

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Server Start!! port : ' + server.address().port);
});
