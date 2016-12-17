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

router.use(function(req, res, next) {
    if (req.user.level <= 2) {
        req.session.error = "權限不足";
        res.redirect('/admin');
    } else {
        return next();
    }
});

router.get('/admin', function(req, res) {
    if (req.user.level == 3) {
        Admin.find({
            level: {
                $lte: 3
            }
        }, admfind);
    } else if (req.user.level >= 4) {
        Admin.find({}, admfind);
    }

    function admfind(err, users) {
        if (err) console.log('[ERROR]'.red + err);
        res.render('usradm', {
            title: 'UserManage',
            data: users
        });
    }
});

router.get('/new', function(req, res) {
    var empty = new Admin({
        name: "",
        nick: "",
        LastLogin: null,
        enable: true,
        system: false,
        password: "",
        level: 1
    });
    res.render('usrform', {
        title: 'UserManage',
        head: "新增使用者",
        usr: empty,
        operator: req.user
    });
});

router.post('/new', function(req, res) {
    if (req.body.level > 4) req.body.level = 4;
    if (req.user.level <= 3) {
        if (req.body.level > 3) req.body.level = 3;
    }
    if (req.body.level < 1) req.body.level = 1;

    Admin.findOne({
        name: req.body.name
    }, function(err, same) {
        if (same) {
            req.session.error = "重複的使用者名稱";
            var ldata = new Admin({
                name: req.body.name,
                nick: req.body.nick,
                LastLogin: null,
                enable: req.body.enable == 'on',
                system: false,
                password: "",
                level: req.body.level
            });
            res.render('usrform', {
                title: 'UserManage',
                head: "新增使用者",
                usr: ldata,
                operator: req.user
            });
        } else {
            new Admin({
                name: req.body.name,
                nick: req.body.nick !== '' ? req.body.nick : null,
                LastLogin: Date.now(),
                enable: req.body.enable == 'on',
                system: false,
                password: "",
                level: req.body.level
            }).save(function(err, ls, count) {
                if (err) console.log('[ERROR]'.red + err);
                else req.session.info = "新增成功";
                res.redirect('/admin/user/admin');
            });
        }
    });
});

router.get('/edit/:id', function(req, res) {
    Admin.findById(req.params.id, function(err, adm) {
        if (!adm) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ID: ' + req.params.id + ' is not exist!');
            res.redirect('/admin/user/admin');
            return;
        }
        if (req.user.level < adm.level && !req.user.system) {
            req.session.error = "權限不足";
            res.redirect('/admin/user/admin');
            return;
        }
        adm.nick = req.body.nick ? req.body.nick : '';
        res.render('usrform', {
            title: 'UserManage',
            head: "編輯使用者",
            usr: adm,
            operator: req.user
        });
    });
});

router.post('/edit/:id', function(req, res) {
    Admin.findById(req.params.id, function(err, adm) {
        if (!adm) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ID: ' + req.params.id + ' is not exist!');
            res.redirect('/admin/user/admin');
            return;
        }
        if (req.user.level < adm.level && !req.user.system) {
            req.session.error = "權限不足";
            res.redirect('/admin/user/admin');
            return;
        }
        if (req.body.level > 4) req.body.level = 4;
        if (req.user.level <= 3) {
            if (req.body.level > 3) req.body.level = 3;
        }
        if (req.body.level < 1) req.body.level = 1;
        if (adm.system === false) {
            adm.enable = req.body.enable == 'on';
            adm.level = req.body.level;
            adm.name = req.body.name;
        }
        adm.nick = req.body.nick !== '' ? req.body.nick : null;
        adm.save(function(err, ls, count) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "儲存成功";
            res.redirect('/admin/user/admin');
        });
    });
});

router.get('/del/:id', function(req, res) {
    Admin.findById(req.params.id, function(err, adm) {
        if (!adm) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ID: ' + req.params.id + ' is not exist!');
            res.redirect('/admin/user/admin');
            return;
        }
        if (req.user.level < adm.level && !req.user.system) {
            req.session.error = "權限不足";
            res.redirect('/admin/user/admin');
            return;
        }
        if (adm.system === true) {
            req.session.error = "不可刪除系統帳戶";
            res.redirect('/admin/user/admin');
            return;
        }
        if (adm._id.equals(req.user._id)) {
            req.session.error = "不可刪除自己";
            res.redirect('/admin/user/admin');
            return;
        }
        adm.remove(function(err, result) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "刪除成功";
            res.redirect('/admin/user/admin');
        });
    });
});

router.get('/pwd/:id', function(req, res) {
    Admin.findById(req.params.id, function(err, adm) {
        if (!adm) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ID: ' + req.params.id + ' is not exist!');
            res.redirect('/admin/user/admin');
            return;
        }
        if (req.user.level < adm.level) {
            req.session.error = "權限不足";
            res.redirect('/admin/user/admin');
            return;
        }
        res.render('usrpwd', {
            title: 'ChangeUserPassword',
            head: "設定使用者密碼",
            usr: adm,
            operator: req.user
        });
    });
});

router.post('/pwd/:id', function(req, res) {
    Admin.findById(req.params.id, function(err, adm) {
        if (!adm) {
            req.session.error = '使用者不存在';
            console.log('[WARN]'.yellow + 'user ID: ' + req.params.id + ' is not exist!');
            res.redirect('/admin/user/admin');
            return;
        }
        if (req.user.level < adm.level) {
            req.session.error = "權限不足";
            res.redirect('/admin/user/admin');
            return;
        }
        var newpwd = req.body.newpwd;
        var comfirmpwd = req.body.comfirmpwd;
        var newhash = pwdhash(newpwd);

        if (newpwd != comfirmpwd) {
            req.session.error = '密碼不一致';
            console.log('[WARN]'.yellow + 'passwords for ' + req.user.name + ' are not same!');
            res.redirect('/admin/user/pwd/' + req.params.id);
            return;
        }
        adm.password = newhash;
        adm.save(function(err, user, count) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "密碼變更完成";
            res.redirect('/admin/user/admin');
        });
    });
});

function pwdhash(password) {
    var sha512 = crypto.createHash('sha512');
    var hash = sha512.update(password).digest('hex');
    return hash;
}

module.exports = router;
