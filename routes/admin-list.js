var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var List = mongoose.model('List');
var utils = require('../utils');
var colors = require('colors');

router.get('/admin', function(req, res) {
    if (req.user.level <= 1) {
        req.session.error = "權限不足";
        res.redirect('/admin/admin');
    }
    List.find({}, listshow).populate('creator').populate('anns');
    return;

    function listshow(err, lists) {
        if (err) console.log('[ERROR]'.red + err);
        res.render('listadm', {
            moment: moment,
            title: 'ListManage',
            session: req.session,
            menu: req.user.level,
            data: lists
        });
    }
});

router.get('/new', function(req, res) {
    if (req.user.level <= 1) {
        req.session.error = "權限不足";
        res.redirect('/admin/admin');
    }
    var empty = new List({
        name: '',
        introduce: '',
        public: true,
        create: null,
        creator: null,
        anns: []
    });
    res.render('listform', {
        title: 'ListManage',
        session: req.session,
        head: "新增列表",
        menu: req.user.level,
        list: empty
    });
});

router.post('/new', function(req, res) {
    if (req.user.level <= 1) {
        req.session.error = "權限不足";
        res.redirect('/admin/admin');
    }
    List.findOne({
        name: req.body.name
    }, function(err, same) {
        if (err) console.log('[ERROR]'.red + err);
        if (same) {
            req.session.error = "重複的列表名稱";
            var ldata = new List({
                name: req.body.name,
                introduce: req.body.introduce,
                public: req.body.public,
                create: null,
                creator: null,
                anns: []
            });
            res.render('listform', {
                title: 'ListManage',
                session: req.session,
                head: "新增列表",
                menu: req.user.level,
                list: ldata
            });
        } else {
            new List({
                name: req.body.name,
                introduce: req.body.introduce,
                public: req.body.public,
                create: Date.now(),
                creator: req.user._id,
                anns: []
            }).save(function(err, ls, count) {
                if (err) console.log('[ERROR]'.red + err);
                else req.session.info = "新增成功";
                res.redirect('/admin/list/admin');
            });
        }
    });
});
//TODO:uncompleted

module.exports = router;
