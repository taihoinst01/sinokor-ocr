'use strict';
var express = require('express');
var request = require('sync-request');

var router = express.Router();


/* GET home page. */
router.get('/', function (req, res) {
    res.render('user/result');
});
router.post('/', function (req, res) {

    var res1 = request('POST', 'http://172.16.53.143:8888/api', {
        JSON: {
            userName: req.body.userAge,
            userAge: req.body.userAge,
            userPhone: req.body.userPhone
            gggg: "gggg"
        },
    });
    var user = JSON.parse(res1.getBody('utf8'));
    console.log(user);
    res.send(res1.body);

});
router.get('/favicon.ico', function (req, res) {
    res.send();
});
module.exports = router;
