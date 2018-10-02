'use strict';
var express = require('express');
var fs = require('fs');
var debug = require('debug');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');

// Session
var session = require('express-session');
var flash = require('connect-flash');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , RememberMeStrategy = require('passport-remember-me').Strategy;
var app = express();
// routes
var routes = require('./routes');
var index = require('./routes/index');
//user
var invoiceRegistration = require('./routes/user/invoiceRegistration');
var myApproval = require('./routes/user/myApproval');
var uiLearning = require('./routes/user/uiLearning');
var batchLearning = require('./routes/user/batchLearning');
var documentCheck = require('./routes/user/documentCheck');
var invoiceProcessingStatus = require('./routes/user/invoiceProcessingStatus');

var adminLearning = require('./routes/user/adminLearning');
var ocrFormAnalysis = require('./routes/user/ocrFormAnalysis');
var ocrHistorySearch = require('./routes/user/ocrHistorySearch');
var newDocLearning = require('./routes/user/newDocLearning');
var result = require('./routes/user/result');//jmh

//admin
var adminDashboard = require('./routes/admin/adminDashboard');
var userManagement = require('./routes/admin/userManagement');

//proxy
var proxy = require('./routes/proxy/proxy');
//util
var common = require('./routes/util/common');
// etc
var xlsx = require('xlsx');
//var listProc = require('./routes/util/listProc'); // legacy interface

// 
app.use('/tif', express.static(path.join(propertiesConfig.filepath.answerFileFrontPath)));
app.use('/jpg', express.static(path.join(propertiesConfig.filepath.doc_sampleImagePath)));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/sample', express.static(__dirname + '/sample'));
app.use('/excel', express.static(__dirname + '/excel'));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
//
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Custom Middlewares
app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    next();
});
// login
app.use(session({
    secret: 'koreanre-ocr',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// app.use(passport.authenticate('remember-me')); // Auto login
// routes
app.use('/', routes);
// user
app.use('/invoiceRegistration', invoiceRegistration);
app.use('/myApproval', myApproval);
app.use('/uiLearning', uiLearning);
app.use('/batchLearning', batchLearning);
app.use('/documentCheck', documentCheck);
app.use('/invoiceProcessingStatus', invoiceProcessingStatus);

app.use('/adminLearning', adminLearning);
app.use('/ocrFormAnalysis', ocrFormAnalysis);
app.use('/ocrHistorySearch', ocrHistorySearch);
app.use('/newDocLearning', newDocLearning); 
app.use('/result', result);//jmh

// admin
app.use('/adminDashboard', adminDashboard);
app.use('/userManagement', userManagement);

//proxy
app.use('/proxy', proxy);
//util
app.use('/common', common);
//etc
//app.use('/listProc', listProc);

// server 
app.set('port', process.env.PORT || 80);
var server = app.listen(app.get('port'), function () {
    console.log('Server Start!! port : ' + server.address().port);
});

