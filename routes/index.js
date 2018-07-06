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
// DB
var mysql = require('mysql');
var dbConfig = require(appRoot + '/config/dbConfig');
var pool = mysql.createPool(dbConfig);
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
// Session
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

// 로그인 쿼리
var loginQuery = "SELECT * FROM TBL_ICR_USER WHERE USERID = ?";

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// index.html
router.get('/', function (req, res) {
    if (commonUtil.isNull(req.user)) {
        res.redirect("/logout");
    } else {
        var sess = req.session;
        if (req.isAuthenticated()) {
            //res.locals.currentUser = req.user;
            res.render('user/userDashboard', { currentUser: req.user });
        } else {
            res.render("index", {
                messages: { error: req.flash('errors') }
            });
        }
    }
});
router.get('/login', function (req, res) {
    if (req.user !== undefined) {
        res.redirect("/");
    } else {
        res.render('index', {
            messages: { error: req.flash('errors') }
        });
    }
});
// 로그인
//router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function (req, res) {
//    console.log("POST /login"); 
//    res.redirect('/');
//});
router.post("/login",
    function (req, res, next) {
        var sess;
        sess = req.session;
        var loginMessage = {};
        var isValid = true;
        if (!req.body.userId) {
            isValid = false;
            loginMessage = "Username is required!";
        }
        if (!req.body.userPw) {
            isValid = false;
            loginMessage = "Password is required!";
        }
        if (isValid) {
            sess.userId = req.body.userId;
            next();
        } else {
            res.redirect("/login");
        }
    },
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true
    }
));
// Log out
router.get('/logout', function (req, res) {
    var sess = req.session;
    if (sess.username) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                req.logout();
                res.redirect('/login');
            }
        });
    } else {
        req.logout();
        res.redirect('/login');
    }
});

passport.serializeUser(function (user, done) {
    var sessionInfo = user;
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    var sessionInfo = JSON.parse(JSON.stringify(user));
    done(null, user);
});
var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.currentUser = req.user;
        return next();
    }
    res.redirect('/login');
};
passport.use(new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'userPw',
    passReqToCallback: true
}, function (req, userId, userPw, done) {
    pool.getConnection(function (err, connection) {
        connection.query(loginQuery, userId, function (err, result) {
            if (err) {
                console.log('err :' + err);
                return done(false, null);
            } else {
                if (result.length === 0) {
                    console.log('해당 사용자가 없습니다');
                    req.flash("errors", "해당 사용자가 존재하지 않습니다.");
                    return done(false, null);
                } else {
                    //if (!bcrypt.compareSync(userPw, result[0].userPw)) {
                    if (userPw != result[0].userPw) {
                        console.log('패스워드가 일치하지 않습니다');
                        req.flash("errors", "패스워드가 일치하지 않습니다.");
                        return done(false, null);
                    } else {
                        var sessionInfo = {
                            userId: userId,
                            email: result[0].email,
                            auth: result[0].auth
                        };
                        return done(null, sessionInfo);
                    }
                }
            }
        });
    });
}));

module.exports = router;