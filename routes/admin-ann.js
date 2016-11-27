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
            moment: moment,
            title: 'Admin',
            session: req.session,
            menu: req.user.level,
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
        session: req.session,
        menu: req.user.level,
        ann: empty
    });
    return;
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
        res.redirect('/admin/admin');
    });
});

router.get('/edit/:id', function(req, res) {
    console.log('[INFO]'.cyan + req.params.id);
    editper(req, res, req.params.id, function(ann) {
        res.render('annform', {
            title: 'Edit Announcement',
            session: req.session,
            menu: req.user.level,
            ann: ann
        });
    });
});

router.post('/edit/:id', function(req, res) {
    editper(req, res, req.params.id, function(ann) {
        ann.title = req.body.title;
        ann.istextcontent = req.body.istextcontent != 'on';
        ann.content = req.body.content;
        ann.update = Date.now();
        ann.visible = req.body.visible == 'on';
        ann.ontop = req.body.ontop == 'on';
        ann.save(function(err, ls, count) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "儲存成功";
            res.redirect('/admin/admin');
        });
    });
});

router.get('/del/:id', function(req, res) {
    editper(req, res, req.params.id, function(ann) {
        ann.remove(function(err, ann) {
            if (err) console.log('[ERROR]'.red + err);
            else req.session.info = "刪除成功";
            res.redirect('/admin/admin');
        });
    });
});

function editper(req, res, id, callback) {
    Ann.findById(id, function(err, ann) {
        if (!ann) {
            req.session.error = '公告不存在';
            console.log('[WARN]'.yellow + 'ann ID: ' + id + ' is not exist!');
            res.redirect('/admin/admin');
            return;
        }
        ann.populate('author', function(err, annp) {
            if (!annp.author) {
                callback(ann);
                return;
            }
            if (annp.author.level > req.user.level) {
                req.session.error = "權限不足";
                res.redirect('/admin/admin');
                return;
            }
            if (req.user.level == 1 && req.user.name != annp.author.name) {
                req.session.error = "權限不足";
                res.redirect('/admin/admin');
                return;
            }
            callback(ann);
        });
    });
}

module.exports = router;
