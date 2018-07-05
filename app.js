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
var commonModule = require(require('app-root-path').path + '/public/js/import.js');
var flash = require('connect-flash');
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
// Session
//var cookieSession = require('cookie-session');
var expressSession = require('express-session');
var flash = require('connect-flash');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');

var app = commonModule.express();

app.use('/uploads', commonModule.express.static(__dirname + '/uploads'));
app.use('/excel', commonModule.express.static(__dirname + '/excel'));
app.set('views', commonModule.path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(commonModule.logger('dev'));
app.use(commonModule.express.static(commonModule.path.join(__dirname, 'public')));
app.use(commonModule.cookieParser());
app.use(commonModule.bodyParser.json());
app.use(commonModule.bodyParser.urlencoded({ extended: false }));

// login
//app.use(cookieSession({
//    keys: ['koreanreocr'],
//    cookie: {
//        maxAge: 1000 * 60 * 180 // 3 hour
//    }
//}));
app.use(expressSession({
    secret: 'koreanre-ocr',
    resave: true,
    saveUninitialized: true
}));
app.use(flash()); // login 실패 시 session clear
app.use(passport.initialize());
app.use(passport.session());

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
    commonModule.debug('Server Start!! port : ' + server.address().port);
});
