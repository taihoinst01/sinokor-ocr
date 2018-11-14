'use strict';
var express = require('express');
var fs = require('fs');
//var debug = require('debug');
//var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');
//var multer = require("multer");
//var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var exec = require('child_process').exec;
var passport = require('passport')
    , CookieStrategy = require('passport-cookie')
    , LocalStrategy = require('passport-local').Strategy
    , RememberMeStrategy = require('passport-remember-me').Strategy;

// DB
//var mysql = require('mysql');
var oracledb = require('oracledb');
var dbConfig = require('../config/dbConfig.js');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');

// Session
//var session = require('express-session');

var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// index.html
router.get('/', function (req, res) {
    if (req.query.userId && req.query.token) { // sso 로그인
        commonDB.reqQueryParam(queryConfig.sessionConfig.ssoLoginQuery, [req.query.userId], callbackSSOLogin, req, res);

    } else { // 일반 로그인
        if (commonUtil.isNull(req.session.user)) {
            res.redirect("/logout");
        } else {
            if (req.session.user !== undefined) {
                //res.locals.currentUser = req.user;
                /*
                if (!fs.existsSync(propertiesConfig.filepath.createImgDirPath)) {
                    fs.mkdir(propertiesConfig.filepath.createImgDirPath);
                }
                if (!fs.existsSync(propertiesConfig.filepath.createImgconvertedDirPath)) {
                    fs.mkdir(propertiesConfig.filepath.createImgconvertedDirPath);
                }
                */
                res.render('user/myApproval', { currentUser: req.session.user });
            } else {
                res.render("index", {
                    messages: { error: req.flash('errors') }
                });
            }
        }
    }
});
function callbackSSOLogin(rows, req, res) {
    var userId = req.query.userId;
    var token = req.query.token;
    if (userId || token) {
        req.session.userId = userId;
        exec('java -jar C:/ICR/app/source/module/sso.jar Verify ' + token, function (error, stdout, stderr) {
            if (error !== null) {
                console.log("sso.jar exec error -> " + error);
                res.redirect("/logout");
            }

            stdout = stdout.split("koreanreId:");

            if (stdout[1]) {
                var koreanreId = stdout[1];
                if (koreanreId == userId) { // queryString으로 넘어온 아이디와 sso token을 통해 넘어온 아이디가 같으면
                    if (rows.length > 0) { // db에 정보가 있으면
                        commonDB.reqQueryParam(queryConfig.sessionConfig.lastLoginUpdateQuery, [koreanreId], function () { });

                        req.session.user = {
                            userId: userId,
                            scanApproval: rows[0].AUTH_SCAN,
                            icrApproval: rows[0].AUTH_ICR,
                            middleApproval: rows[0].AUTH_APPROVAL,
                            lastApproval: rows[0].AUTH_FINAL_APPROVAL,
                            lastLoginDate: rows[0].FINAL_LOGIN_DATE,
                            admin: rows[0].AUTH_ADMIN,
                            token: token
                        };

                    } else { // db에 정보 없으면 권한 임시 할당
                        req.session.user = {
                            userId: userId,
                            scanApproval: 'N',
                            icrApproval: 'N',
                            middleApproval: 'N',
                            lastApproval: 'N',
                            lastLoginDate: '',
                            admin: 'N',
                            token: token
                        };
                    }
                    res.redirect("/login");
                } else {
                    res.render('index', { messages: { error: "SSO 토큰과 아이디가 일치하지 않습니다" } });
                }
            } else {
                res.render('index', { messages: { error: "SSO 통신 오류가 발생 했습니다" } });
            }
        });
    } else {
        res.render('index', { messages: { error: "요청 파라미터가 없거나 유효하지 않습니다" } });
    }
}

router.get('/login', function (req, res) {
    if (req.session.user !== undefined) {
        res.redirect("/myApproval");
    } else {
        res.render('index', {
            messages: { error: req.flash('errors') }
        });
    }
});

router.post("/login",
    function (req, res, next) {
        //console.log("login...");
        
        var sess;
        sess = req.session;
        var loginMessage;
        var isValid = true;
        if (!req.body.userId) {
            isValid = false;
            loginMessage = "Username is required!";
        }
        if (!req.body.userPw) {
            isValid = false;
            loginMessage = "Password is required!";
        }
        // remember-me (아이디 저장) 체크시 on, 체크 안할 시 undefined
        if (isValid) {
            // ID 저장하기
            if (req.body.remember_me == "on") {
                res.cookie('ocr_userid', req.body.userId, { maxAge: 604800000 }); // save cookie 7days
            }
            commonDB.reqQueryParam(queryConfig.sessionConfig.loginQuery, [req.body.userId], callbackLogin, req, res);            
            sess.userId = req.body.userId;
            //next();
        } else {
            res.redirect("/login");
        }
    },
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true
    })
);
function callbackLogin(rows, req, res) {
    if (rows.length > 0) {
        if (req.body.userPw == rows[0].EMP_PW) {
            req.session.user = {
                userId: req.body.userId,
                scanApproval: rows[0].AUTH_SCAN,
                icrApproval: rows[0].AUTH_ICR,
                middleApproval: rows[0].AUTH_APPROVAL,
                lastApproval: rows[0].AUTH_FINAL_APPROVAL,
                lastLoginDate: rows[0].FINAL_LOGIN_DATE,
                admin: rows[0].AUTH_ADMIN
            };
            commonDB.reqQueryParam(queryConfig.sessionConfig.lastLoginUpdateQuery, [req.body.userId], callbackUpdate, req, res);
            
        } else {
            res.render('index', { messages: { error: "비밀번호가 일치하지 않습니다" } });
        }
    } else {
        res.render('index', { messages: { error: "해당 사용자가 존재하지 않습니다" } });
    }
}

function callbackUpdate(rows, req, res) {
    res.redirect("/login");
}
// Log out
router.get('/logout', function (req, res) {
    var sess = req.session;
    if (sess.user) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.clearCookie('ocr_userid', { path: '/' });
                //req.logout();
                res.redirect('/login');
            }
        });
    } else {
        //req.logout();
        res.redirect('/login');
    }
});

/******************************************************************************************
                                        Deprecate Logic
*******************************************************************************************/

// passport login (deprecate : 2018-11-13)
// Passport module
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
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
    oracledb.getConnection(dbConfig, function (err, connection) {
        //todo
        connection.execute(queryConfig.sessionConfig.loginQuery, [userId], function (err, result) {
            result = result.rows;
            if (err) {
                console.log('err :' + err);
                return done(false, null);
            } else {
                if (commonUtil.isNull(userId)) {
                    req.flash("errors", "사용자 ID를 입력해주세요.");
                    return done(false, null);
                } else if (result.length === 0) {

                    /*
                    var child = exec('java -jar C:/ICR/app/source/module/sso.jar Login ' + userId + ' ' + userPw,
                        function (error, stdout, stderr) {
                            if (error !== null) {
                                console.log("Error -> " + error);
                                req.flash("errors", "해당 사용자가 존재하지 않습니다.");
                                return done(false, null);
                            }

                            stdout = stdout.split("token:");

                            if (stdout[1]) {
                                connection.execute(queryConfig.userMngConfig.insertUser, [userId, userPw,'','auth sso','Y','Y','Y','Y'], function (err, result) {
                                    var sessionInfo = {
                                        userId: userId,
                                        email: result[0].EMAIL,
                                        auth: 'USER',
                                        scanApproval: 'Y',
                                        icrApproval: 'Y',
                                        middleApproval: 'Y',
                                        lastApproval: 'Y',
                                        admin: 'N',
                                        token:stdout[1]
                                    };
                                    return done(null, sessionInfo);
                                });
                            } else {
                                req.flash("errors", "해당 사용자가 존재하지 않습니다.");
                                return done(false, null);
                            }

                        });
                    */
                    req.flash("errors", "해당 사용자가 존재하지 않습니다.");
                    return done(false, null);

                } else {
                    //if (!bcrypt.compareSync(userPw, result[0].userPw)) {
                    if (commonUtil.isNull(userPw)) {
                        req.flash("errors", "비밀번호를 입력해주세요.");
                        return done(false, null);
                    } else if (userPw != result[0].EMP_PW) {
                        req.flash("errors", "비밀번호가 일치하지 않습니다.");
                        return done(false, null);
                    } else {
                        /*
                        var child = exec('java -jar C:/ICR/app/source/module/sso.jar Login ' + userId + ' ' + userPw,
                            function (error, stdout, stderr) {
                                if (error !== null) {
                                    console.log("Error -> " + error);
                                }

                                stdout = stdout.split("token:");

                                if (stdout[1]) {
                                    var sessionInfo = {
                                        userId: userId,
                                        email: result[0].EMAIL,
                                        auth: result[0].AUTH,
                                        scanApproval: result[0].SCANAPPROVAL,
                                        icrApproval: result[0].ICRAPPROVAL,
                                        middleApproval: result[0].MIDDLEAPPROVAL,
                                        lastApproval: result[0].LASTAPPROVAL,
                                        lastLoginDate: result[0].LASTLOGINDATE,
                                        admin: result[0].ADMIN,
                                        token:stdout[1]
                                    };

                                    return done(null, sessionInfo);
                                } else {
                                    var sessionInfo = {
                                        userId: userId,
                                        email: result[0].EMAIL,
                                        auth: result[0].AUTH,
                                        scanApproval: result[0].SCANAPPROVAL,
                                        icrApproval: result[0].ICRAPPROVAL,
                                        middleApproval: result[0].MIDDLEAPPROVAL,
                                        lastApproval: result[0].LASTAPPROVAL,
                                        lastLoginDate: result[0].LASTLOGINDATE,
                                        admin: result[0].ADMIN
                                    };
                                    return done(null, sessionInfo);
                                }

                            });
                        */
                        var sessionInfo = {
                            userId: userId,
                            // email: result[0].EMAIL,
                            // auth: result[0].AUTH,
                            scanApproval: result[0].AUTH_SCAN,
                            icrApproval: result[0].AUTH_ICR,
                            middleApproval: result[0].AUTH_APPROVAL,
                            lastApproval: result[0].AUTH_FINAL_APPROVAL,
                            lastLoginDate: result[0].FINAL_LOGIN_DATE,
                            admin: result[0].AUTH_ADMIN,
                            token: 'tokenTest'
                        };
                        return done(null, sessionInfo);
                    }
                }
            }
        });
    });
}
));

// passport sso login (deprecate : 2018-11-13)
router.get('/test', passport.authenticate("cookie", {
    successRedirect: "/myApproval", failureRedirect: "/login", failureFlash: true, session: true
}), function (req, res) {
    if (commonUtil.isNull(req.user)) {
        //res.redirect("/logout");
        res.send();
    } else {
        var sess = req.session;

        if (req.isAuthenticated()) {
            //res.locals.currentUser = req.user;
            if (!fs.existsSync(propertiesConfig.filepath.createImgDirPath)) {
                fs.mkdir(propertiesConfig.filepath.createImgDirPath);
            }
            if (!fs.existsSync(propertiesConfig.filepath.createImgconvertedDirPath)) {
                fs.mkdir(propertiesConfig.filepath.createImgconvertedDirPath);
            }
            res.render('user/myApproval', { currentUser: req.user });
        } else {
            res.render("index", {
                messages: { error: req.flash('errors') }
            });
        }
    }
});

passport.use(new CookieStrategy({
    passReqToCallback: true
},
    function (req, token, done) {
        var token = req.cookies.ssotoken;
        //운영
        /*
        var child = exec('java -jar C:/ICR/app/source/module/sso.jar Verify ' + token,
            function (error, stdout, stderr) {
                if (error !== null) {
                    console.log("Error -> " + error);
                    res.redirect("/logout");
                }

                stdout = stdout.split("koreanreId:");

                if (stdout[1]) {
                    var koreanreId = stdout[1];
                    commonDB.reqQueryParam(`UPDATE TBL_CO_EMP_REG SET FINAL_LOGIN_DATE = sysdate WHERE EMP_NO = :empNo `, [koreanreId], function () { });

                    oracledb.getConnection(dbConfig, function (err, connection) {
                        connection.execute(`SELECT * FROM TBL_CO_EMP_REG WHERE EMP_NO = :empNo `, [koreanreId], function (err, result) {
                            if (result.rows.length > 0) {

                                var sessionInfo = {
                                    userId: koreanreId,
                                    auth: result.rows[0].AUTH_ADMIN,
                                    scanApproval: result.rows[0].AUTH_SCAN,
                                    icrApproval: result.rows[0].AUTH_ICR,
                                    middleApproval: result.rows[0].AUTH_APPROVAL,
                                    lastApproval: result.rows[0].AUTH_FINAL_APPROVAL,
                                    lastLoginDate: result.rows[0].FINAL_LOGIN_DATE,
                                    admin: result.rows[0].AUTH_ADMIN,
                                    token: token
                                };

                                return done(null, sessionInfo);
                            } else {
                                return done(null, false);
                            }
                        });
                    });
                } else {
                    return done(null, false);
                }
            });
        */
        //개발

        commonDB.reqQueryParam(`UPDATE TBL_CO_EMP_REG SET FINAL_LOGIN_DATE = sysdate WHERE EMP_NO = :empNo `, [token], function () { });

        oracledb.getConnection(dbConfig, function (err, connection) {
            connection.execute(`SELECT * FROM TBL_CO_EMP_REG WHERE EMP_NO = :empNo `, [token], function (err, result) {
                if (result.rows.length > 0) {
                    var sessionInfo = {
                        userId: token,
                        auth: result.rows[0].AUTH_ADMIN,
                        scanApproval: result.rows[0].AUTH_SCAN,
                        icrApproval: result.rows[0].AUTH_ICR,
                        middleApproval: result.rows[0].AUTH_APPROVAL,
                        lastApproval: result.rows[0].AUTH_FINAL_APPROVAL,
                        lastLoginDate: result.rows[0].FINAL_LOGIN_DATE,
                        admin: result.rows[0].AUTH_ADMIN,
                        token: 'tokenTest'
                    };
                    return done(null, sessionInfo);
                } else {
                    return done(null, false);
                }
            });
        });

    }
));

// Auto login (deprecate : 2018-07-05)
/* Fake, in-memory database of remember me tokens */
var tokens = {}
function consumeRememberMeToken(token, fn) {
    var uid = tokens[token];
    // invalidate the single-use token
    delete tokens[token];
    return fn(null, uid);
}
function saveRememberMeToken(token, uid, fn) {
    tokens[token] = uid;
    return fn();
}
passport.use(new RememberMeStrategy(
    function (token, done) {
        consumeRememberMeToken(token, function (err, uid) {
            if (err) { return done(err); }
            if (!uid) { return done(null, false); }
            // Auto login 
            pool.getConnection(function (err, connection) {
                connection.query(queryConfig.sessionConfig.loginQuery, uid, function (err, result) {
                    if (err) { return done(err); }
                    if (!result) { return done(null, false); }
                    var sessionInfo = {
                        userId: uid,
                        //email: result[0].email,
                        //auth: result[0].auth
                    };
                    return done(null, sessionInfo);
                });
            });
            // /Auto login
        });
    },
    issueToken
));
function issueToken(userId, done) {
    var token = randomString(64);
    saveRememberMeToken(token, userId, function (err) {
        if (err) { return done(err); }
        return done(null, token);
    });
}
function randomString(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;
    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }
    return buf.join('');
};
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;