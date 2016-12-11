var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var List = mongoose.model('List');
var utils = require('../utils');
var colors = require('colors');

router.get('/', function(req, res) {
    Ann.find({
        visible: true
    }).limit(10).sort('-ontop').sort('-update').populate('author').exec(function(err, anns) {
        req.session.listurl = '';
        res.render('embeddedlist', {
            data: anns,
            list: {
                name: '最新消息',
                introduce: ''
            }
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

router.get('/ann/:id', function(req, res) {
    Ann.findById(req.params.id).populate('author').exec(function(err, ann) {
        if (err) console.log('[ERROR]'.red + err);
        if (!ann) {
            console.log('[WARN]'.yellow + 'ann ID: ' + req.params.id + ' is not exist!');
            res.end();
            return;
        }
        if (!req.viewed) {
            ann.views++;
            ann.save(function(err, ann, count) {
                if (err) console.log('[ERROR]'.red + err);
            });
        }
        res.render('embeddedview', {
            ann: ann,
            listurl: req.session.listurl || ''
        });
    });
});

router.param('lsid', function(req, res, next, id) {
    List.findById(id).populate('creator').exec(function(err, ls) {
        if (!ls) {
            console.log('[WARN]'.yellow + 'list ID: ' + id + ' is not exist!');
            res.end();
            return;
        }
        req.list = ls;
        return next();
    });
});

router.get('/list/:lsid', function(req, res) {
    Ann.find({
        visible: true,
        lists: req.params.lsid
    }).limit(10).sort('-ontop').sort('-update').populate('author').exec(function(err, anns) {
        req.session.listurl = '/list/' + req.params.lsid;
        res.render('embeddedlist', {
            data: anns,
            list: req.list
        });
    });
});

module.exports = router;
