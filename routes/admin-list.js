var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var List = mongoose.model('List');
var utils = require('../utils');
var colors = require('colors');

router.use(function(req, res, next) {
    if (req.user.level <= 1) {
        req.session.error = "權限不足";
        res.redirect('/admin');
    } else {
        return next();
    }
});

router.get('/admin', function(req, res) {
    List.find({}, listshow).populate('creator').populate('anns');
    return;

    function listshow(err, lists) {
        if (err) console.log('[ERROR]'.red + err);
        res.render('listadm', {
            title: 'ListManage',
            data: lists
        });
    }
});

router.get('/new', function(req, res) {
    var empty = new List({
        name: '',
        introduce: '',
        public: true,
        create: null,
        creator: null
    });
    res.render('listform', {
        title: 'ListManage',
        head: "新增列表",
        list: empty
    });
});

router.post('/new', function(req, res) {
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
                creator: null
            });
            res.render('listform', {
                title: 'ListManage',
                head: "新增列表",
                list: ldata
            });
        } else {
            new List({
                name: req.body.name,
                introduce: req.body.introduce,
                public: req.body.public == 'on',
                create: Date.now(),
                creator: req.user._id
            }).save(function(err, ls, count) {
                if (err) console.log('[ERROR]'.red + err);
                else req.session.info = "新增成功";
                res.redirect('/admin/list/admin');
            });
        }
    });
});

router.param('id', function(req, res, next, id) {
    List.findById(id).populate('creator').exec(function(err, ls) {
        if (!ls) {
            req.session.error = '列表不存在';
            console.log('[WARN]'.yellow + 'list ID: ' + id + ' is not exist!');
            res.redirect('/admin/list/admin');
            return;
        }
        if (req.user.level == 2 && req.user.name != ls.creator.name) {
            req.session.error = "權限不足";
            res.redirect('/admin/list/admin');
            return;
        }
        next();
    });
});

router.get('/edit/:id', function(req, res) {
    List.findById(req.params.id).populate('creator').exec(function(err, ls) {
        if (err) console.log('[ERROR]'.red + err);
        res.render('listform', {
            title: 'ListManage',
            head: "編輯列表",
            list: ls
        });
    });
});

router.post('/edit/:id', function(req, res) {
    List.findById(req.params.id).populate('creator').exec(function(err, ls) {
        ls.name = req.body.name;
        ls.introduce = req.body.introduce;
        ls.public = req.body.public == 'on';
        ls.save(function(err, ls, count) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "儲存成功";
            res.redirect('/admin/list/admin');
        });
    });
});

router.get('/del/:id', function(req, res) {
    List.findById(req.params.id, function(err, ls) {
        ls.remove(function(err, ls) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "刪除成功";
            res.redirect('/admin/list/admin');
        });
    });
});

module.exports = router;
