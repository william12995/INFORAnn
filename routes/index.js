var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var querystring = require('querystring');
var Ann = mongoose.model('Ann');
var admin = require('./admin');
var Session = mongoose.model('Session');
var Admin = mongoose.model('Admin');
var List = mongoose.model('List');
var colors = require('colors');

router.use(function(req, res, next) {
    /** init views engine variable && middleware variable **/
    req.user = {
        name: '',
        nick: '',
        LastLogin: null,
        enable: false,
        system: false,
        password: '',
        level: 0
    };
    res.locals.menu = 0;
    res.locals.session = req.session;

    /** Login authentication **/
    Session.findOne({
        cookie_id: req.cookies.session
    }).exec(function(err, result) {
        if (err) {
            console.log('[ERROR]'.red + err);
        }
        if (!result) {
            //console.log('[INFO]'.cyan + 'user cookie not found');
            res.clearCookie('session');
            return next();
        }
        if (result.expire < Date.now()) {
            result.remove(function(err, result) {
                if (err) console.log('[ERROR]'.red + err);
                console.log('[WRAN]'.yellow + 'user cookie expired');
                req.session.error = "登入資訊已過期，請重新登入。";
                res.redirect('/admin/login');
            });
            return;
        }
        Admin.
        findById(result.admin_id, function(err, user) {
            if (err) console.log('[ERROR]'.red + err);
            if (!user) {
                console.log('[WARN]'.yellow + 'userid: ' + result.admin_id + ' is not exist!');
                result.remove(function(err, result) {
                    if (err) console.log('[ERROR]'.red + err);
                    next();
                });
                return;
            }
            if (user.enable === false) {
                req.session.error = '使用者被停用';
                console.log('[WARN]'.yellow + 'user ' + username + ' is disabled!');
                result.remove(function(err, result) {
                    if (err) console.log('[ERROR]'.red + err);
                    next();
                });
                return;
            }
            /** Renew Login Session **/
            if (result.keep === true) {
                result.expire = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                result.save();
            } else {
                result.expire = new Date(Date.now() + 1 * 60 * 60 * 1000);
                result.save();
            }
            req.user = user;
            res.locals.menu = user.level;
            next();
        });
    });
});

router.get('/', function(req, res) {
    var qudata = querystring.parse(req.url.query);
    var page = parseInt(req.query.p) || 1;

    var que = Ann.find({
        visible: true
    }, function(err, anns) {
        if (err) console.log('[ERROR]'.red + err);

        var totalpage = Math.ceil(anns.length / 10);
        if (totalpage === 0) totalpage = 1;
        if (page < 1 || page > totalpage) {
            res.redirect("?p=1");
            return;
        }

        que.skip((page - 1) * 10).limit(10).sort('-ontop').sort('-update').populate('author').exec(function(err, sanns) {
            res.render('index', {
                title: 'INFOR Ann System',
                data: sanns,
                list: {
                    name: '最新消息',
                    introduce: ''
                },
                page: page,
                tpage: totalpage
            });
        });
    });
});

router.param('lsid', function(req, res, next, id) {
    List.findById(id).populate('creator').exec(function(err, ls) {
        if (!ls) {
            console.log('[WARN]'.yellow + 'list ID: ' + id + ' is not exist!');
            res.render('index', {
                title: 'INFOR Ann System',
                data: [],
                list: {
                    name: '查無列表',
                    introduce: '無此列表'
                },
                page: 0,
                tpage: 0
            });
            return;
        }
        if (ls.public != true) {
            res.render('index', {
                title: 'INFOR Ann System',
                data: [],
                list: {
                    name: '存取被拒',
                    introduce: '此清單尚未被公開'
                },
                page: 0,
                tpage: 0
            });
            return;
        }
        req.list = ls;
        return next();
    });
});

router.get('/list/:lsid', function(req, res) {
    var qudata = querystring.parse(req.url.query);
    var page = parseInt(req.query.p) || 1;

    var que = Ann.find({
        visible: true,
        lists: req.params.lsid
    }, function(err, anns) {
        if (err) console.log('[ERROR]'.red + err);

        var totalpage = Math.ceil(anns.length / 10);
        if (totalpage === 0) totalpage = 1;
        if (page < 1 || page > totalpage) {
            res.redirect("?p=1");
            return;
        }

        que.skip((page - 1) * 10).limit(10).sort('-ontop').sort('-update').populate('author').exec(function(err, sanns) {
            res.render('index', {
                title: 'INFOR Ann System',
                data: sanns,
                list: req.list,
                page: page,
                tpage: totalpage
            });
        });
    });
});

router.param('id', function(req, res, next, id) {
    if (!req.session.viewed) {
        req.session.viewed = [];
    }
    if (req.session.viewed.indexOf(id) == -1) {
        req.session.viewed.push(id);
        req.viewed = false;
    } else {
        req.viewed = true;
    }
    return next();
});

router.get('/content/:id', function(req, res) {
    Ann.findById(req.params.id).populate('author').exec(function(err, ann) {
        if (err) console.log('[ERROR]'.red + err);
        if (!ann) {
            req.session.error = '公告不存在';
            console.log('[WARN]'.yellow + 'ann ID: ' + req.params.id + ' is not exist!');
            res.redirect('/');
            return;
        }
        if (!req.viewed) {
            ann.views++;
            ann.save(function(err, ann, count) {
                if (err) console.log('[ERROR]'.red + err);
            });
        }
        res.render('content', {
            title: ann.title + ' - INFOR Ann System',
            ann: ann
        });
    });
});

module.exports = router;
