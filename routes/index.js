'use strict';
//var express = require('express');
//var appRoot = require('app-root-path').path;
//var router = express.Router();
//var passport = require('passport')
//    , LocalStrategy = require('passport-local').Strategy;

//var mysql = require('mysql');
//var dbConfig = require(appRoot + '/config/dbConfig');
//var pool = mysql.createPool(dbConfig);
//var queryConfig = require(appRoot + '/config/queryConfig.js');
//var commonDB = require(appRoot + '/public/js/common.db.js');
//var commonUtil = require(appRoot + '/public/js/common.util.js');
//var bcrypt = require('bcrypt');
var commonModule = require(require('app-root-path').path + '/public/js/import.js');
var commonUtil = commonModule.commonUtil;
var commonDB = commonModule.commonDB;
var queryConfig = commonModule.queryConfig;
var router = commonModule.router;
var passport = commonModule.passport;

// 로그인 쿼리
var loginQuery = "SELECT * FROM TBL_ICR_USER WHERE USERID = ?";

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// index.html
router.get('/', function (req, res) {
    console.log("GET / : " + req.url);
    if (req.user !== undefined) {
        console.log("GET / : user != undefiend");
        if (req.url == "/") {
            console.log("req.url로 이동합니다1 : " + req.url);
            res.redirect('/userDashboard'); // 요청된 URL이 없거나 첫 접속일 때 userDashboard로 이동
        } else {
            console.log("req.url로 이동합니다2 : " + req.url);
            res.redirect(req.url); // 요청된 URL이 있으면 해당 URL로 이동
        }
    } else {
        console.log("GET / : user == undefiend");
        res.render('index');
    }
});
router.get('/login', function (req, res) {
    console.log("GET /login");
    res.redirect('/'); 
});
// 로그인
router.post('/login', passport.authenticate('local', { failureRedirect: '/', failureFlash: true }), function (req, res) {
    console.log("POST /login");
    res.redirect('/userManagement');
});
// Log out
router.get('/logout', function (req, res) {
    console.log("GET /logout");
    req.logout();
    res.redirect('/');
});

passport.serializeUser(function (user, done) {
    console.log('serializeUser : 사용자 정보 세션 저장');  
    console.log("serializeUser user : ", JSON.stringify(user));
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    console.log('deserialize : 사용자 정보 세션에서 호출');  
    console.log("deserialize user : ", JSON.stringify(user));
    done(null, user);
});
var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        console.log("isAuthenticated 로그인 유저 ");
        return next();
    }
    console.log("isAuthenticated 로그인 아님");
    res.redirect('/');
};
passport.use(new commonModule.LocalStrategy({
    usernameField: 'userId',
    passwordField: 'userPw',
    passReqToCallback: true
}, function (req, userId, userPw, done) {
    commonModule.pool.getConnection(function (err, connection) {
        connection.query(loginQuery, userId, function (err, result) {
            if (err) {
                console.log('err :' + err);
                return done(false, null);
            } else {
                if (result.length === 0) {
                    console.log('해당 사용자가 없습니다');
                    return done(false, null);
                } else {
                    //if (!bcrypt.compareSync(userPw, result[0].userPw)) {
                    if (userPw != result[0].userPw) {
                        console.log('패스워드가 일치하지 않습니다');
                        return done(false, null);
                    } else {
                        console.log('로그인 성공');
                        return done(null, {
                            'userId': userId,
                            'auth': result[0].auth,
                            'email': result[0].email
                        });
                    }
                }
            }
        });
    });
}));

module.exports = router;