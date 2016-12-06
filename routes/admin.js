
var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var List = mongoose.model('List');
var utils = require('../utils');
var colors = require('colors');
//Sub routers
var R_ann = require('./admin-ann');
var R_user = require('./admin-user');
var R_list = require('./admin-list');


router.get('/login', function(req, res) {
    if (req.user.level > 0) {
        res.redirect('/admin/admin');
    }
    res.render('login', {
        title: 'Admin Login'
    });
});

router.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var remember = req.body.remember;
    var passwdhash = pwdhash(password);
    Admin.
    findOne({
        name: username
    }).
    exec(function(err, user) {
        if (err) {
            console.log('[ERROR]'.red + err);
        }
        if (!user) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ' + username + ' is not exist!');
            res.redirect('/admin/login');
            return;
        }
        if (user.enable === false) {
            req.session.error = '使用者被停用';
            console.log('[WARN]'.yellow + 'user ' + username + ' is disabled!');
            res.redirect('/admin/login');
            return;
        }
        if (passwdhash != user.password && user.password !== "") {
            req.session.error = '密碼錯誤';
            console.log('[WARN]'.yellow + 'password for ' + username + ' error!');
            res.redirect('/admin/login');
            return;
        }
        var sessionid = utils.uid(32);
        user.LastLogin = Date.now();
        user.save();
        if (remember == 'on') {
            res.cookie('session', sessionid, {
                expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            });
            new Session({
                cookie_id: sessionid,
                admin_id: user._id,
                expire: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                keep: true
            }).save(function(err, ls, count) {
                if (err) console.log('[ERROR]'.red + err);
                else {
                    console.log('[INFO]'.cyan + 'User ' + user.name + ' logined with "remember me".');
                    req.session.info = "登入成功";
                    res.redirect('/admin/admin');
                }
            });
        } else {
            res.cookie('session', sessionid, {
                expires: 0
            });
            new Session({
                cookie_id: sessionid,
                admin_id: user._id,
                expire: new Date(Date.now() + 1 * 60 * 60 * 1000),
                keep: false
            }).save(function(err, ls, count) {
                if (err) console.log('[ERROR]'.red + err);
                else {
                    console.log('[INFO]'.cyan + 'User ' + user.name + ' logined temporary.');
                    req.session.info = "登入成功";
                    res.redirect('/admin/admin');
                }
            });
        }
    });
});

router.use(function(req, res, next) {
    if (req.user.level === 0) {
        req.session.error = "請先登入！";
        res.redirect('/admin/login');
    } else {
        return next();
    }
});

//TODO:Add a admin overview page
router.get('/admin', function(req, res) {
    res.redirect('/admin/ann/admin');
});

router.use('/ann', R_ann);
router.use('/user', R_user);
router.use('/list', R_list);

router.get('/logout', function(req, res) {
    Session.findOne({
        cookie_id: req.cookies.session
    }).exec(function(err, result) {
        if (err) {
            next(err);
        }
        if (!result) {
            console.log('[WARN]'.yellow + 'user cookie not found');
        } else {
            result.remove(function(err, result) {
                if (err) console.log('[ERROR]'.red + err);
                else req.session.info = "登出成功";
            });
        }
        res.clearCookie('session');
        res.redirect('/admin/login');
    });
});

router.get('/chpwd', function(req, res) {
    if (req.user.level === 0) {
        res.redirect('/admin/login');
    }
    res.render('chpwd', {
        title: 'Change Admin Password'
    });
});

router.post('/chpwd', function(req, res) {
    var oldpwd = req.body.oldpwd;
    var newpwd = req.body.newpwd;
    var comfirmpwd = req.body.comfirmpwd;
    var oldhash = pwdhash(oldpwd);
    var newhash = pwdhash(newpwd);

    if (req.user.level === 0) {
        res.redirect('/admin/login');
    }

    Admin.
    findOne({
        name: req.user.name
    }).
    exec(function(err, user) {
        if (err) {
            console.log('[ERROR]'.red + err);
        }
        if (!user) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ' + req.user.name + ' is not exist!');
            res.redirect('/admin/login');
            return;
        }
        if (oldhash != user.password && user.password !== "") {
            req.session.error = '密碼錯誤';
            console.log('[WARN]'.yellow + 'password for ' + req.user.name + ' error!');
            res.redirect('/admin/chpwd');
            return;
        }

        if (newpwd != comfirmpwd) {
            req.session.error = '密碼不一致';
            console.log('[WARN]'.yellow + 'passwords for ' + req.user.name + ' are not same!');
            res.redirect('/admin/chpwd');
            return;
        }

        user.password = newhash;
        user.save(function(err, user, count) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "密碼變更完成";
            res.redirect('/');
        });
    });
});


function pwdhash(password) {
    var sha512 = crypto.createHash('sha512');
    var hash = sha512.update(password).digest('hex');
    return hash;
}

module.exports = router;
