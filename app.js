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
var flash = require('connect-flash');
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
var userDashboard = require('./routes/user/userDashboard');
var ocrFormAnalysis = require('./routes/user/ocrFormAnalysis');
var adminLearning = require('./routes/user/adminLearning');
var batchLearning = require('./routes/user/batchLearning');
var uiLearning = require('./routes/user/uiLearning');
var ocrHistorySearch = require('./routes/user/ocrHistorySearch');
var newDocLearning = require('./routes/user/newDocLearning');
//admin
var adminDashboard = require('./routes/admin/adminDashboard');
var userManagement = require('./routes/admin/userManagement');
//proxy
var proxy = require('./routes/proxy/proxy');
// etc
var xlsx = require('xlsx');

// 
app.use('/uploads', express.static(__dirname + '/uploads'));
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
app.use('/userDashboard', userDashboard);
app.use('/ocrFormAnalysis', ocrFormAnalysis);
app.use('/adminLearning', adminLearning);
app.use('/batchLearning', batchLearning);
app.use('/uiLearning', uiLearning);
app.use('/ocrHistorySearch', ocrHistorySearch);
app.use('/newDocLearning', newDocLearning);
// admin
app.use('/adminDashboard', adminDashboard);
app.use('/userManagement', userManagement);
//proxy
app.use('/proxy', proxy);
// server 
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function () {
    console.log('Server Start!! port : ' + server.address().port);
});
