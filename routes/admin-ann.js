var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var List = mongoose.model('List');
var utils = require('../utils');
var colors = require('colors');

router.get('/admin', function(req, res) {
    if (req.user.level == 1) {
        Ann.find({
            author: req.user._id
        }).sort('-update').populate('author').exec(annsfind);
    } else if (req.user.level >= 2) {
        //TODO:Hide Edit&Del Button to ann can't edit.
        Ann.find().sort('-update').populate('author').exec(annsfind);
    }
    return;

    function annsfind(err, anns) {
        if (err) console.log('[ERROR]'.red + err);
        res.render('admin', {
            title: 'Admin',
            data: anns
        });
    }
});

router.get('/new', function(req, res) {
    var empty = new Ann({
        author: null,
        title: '',
        istextcontent: true,
        content: '',
        create: Date.now(),
        update: Date.now(),
        visible: true,
        views: 0,
        ontop: false
    });
    res.render('annform', {
        title: 'Add New Announcement',
        ann: empty
    });
});

router.post('/new', function(req, res) {
    new Ann({
        author: req.user._id,
        authorcache: "",
        title: req.body.title,
        istextcontent: req.body.istextcontent != 'on',
        content: req.body.content,
        create: Date.now(),
        update: Date.now(),
        visible: req.body.visible == 'on',
        views: 0,
        ontop: req.body.ontop == 'on'
    }).save(function(err, ls, count) {
        if (err) console.log('[ERROR]'.red + err);
        else req.session.info = "新增成功";
        res.redirect('/admin/ann/admin');
    });
});

router.param('id', function(req, res, next, id) {
    Ann.findById(id, function(err, ann) {
        if (!ann) {
            req.session.error = '公告不存在';
            console.log('[WARN]'.yellow + 'ann ID: ' + id + ' is not exist!');
            res.redirect('/admin/ann/admin');
            return;
        }
        ann.populate('author', function(err, annp) {
            if (!annp.author) {
                console.log('[WARN]'.yellow + 'ann ID: ' + id + ' does\'t have author!');
                req.ann = ann;
                return next();
            }
            if (annp.author.level > req.user.level) {
                req.session.error = "權限不足";
                res.redirect('/admin/ann/admin');
                return;
            }
            if (req.user.level == 1 && req.user.name != annp.author.name) {
                req.session.error = "權限不足";
                res.redirect('/admin/ann/admin');
                return;
            }
            req.ann = ann;
            return next();
        });
    });
});

router.get('/edit/:id', function(req, res) {
    res.render('annform', {
        title: 'Edit Announcement',
        ann: req.ann
    });
});

router.post('/edit/:id', function(req, res) {
    var ann = req.ann;
    var updateDate = false;
    if (ann.title != req.body.title) {
        ann.title = req.body.title;
        updateDate = true;
    }
    if (ann.istextcontent != (req.body.istextcontent != 'on')) {
        ann.istextcontent = req.body.istextcontent != 'on';
        updateDate = true;
    }
    if (ann.content != req.body.content) {
        ann.content = req.body.content;
        updateDate = true;
    }
    if (updateDate === true) {
        ann.update = Date.now();
    }
    ann.visible = req.body.visible == 'on';
    ann.ontop = req.body.ontop == 'on';
    ann.save(function(err, ls, count) {
        if (err) console.log('[ERROR]'.red + err);
        else req.session.info = "儲存成功";
        res.redirect('/admin/ann/admin');
    });
});

router.get('/del/:id', function(req, res) {
    req.ann.remove(function(err, ann) {
        if (err) console.log('[ERROR]'.red + err);
        else req.session.info = "刪除成功";
        res.redirect('/admin/ann/admin');
    });
});

module.exports = router;
