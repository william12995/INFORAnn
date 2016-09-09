var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var querystring = require('querystring');
var Ann = mongoose.model('Ann');
var admin = require('./admin');
var moment = require('moment');
var Session = mongoose.model('Session');
var Admin = mongoose.model('Admin');

/*
 * GET home page.
 */

router.all('*', function(req, res, next)
{
    req.user = {
        name: '',
        nick: '',
        LastLogin : null,
        enable : false,
        system : false,
        password : '',
        level : 0
    };
    Session.findOne({ cookie_id: req.cookies.session }).exec(function (err, result) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (!result) {
            console.log('[INFO]user cookie not found');
            next();
        }
        if (result.expire < Date.now()) {
            result.remove(function (err, result) {
                if (err) console.log('[ERROR]' + err);
            });
            console.log('[WRAN]user cookie expired');
            req.session.error = "登入資訊已過期，請重新登入。";
            res.redirect('/admin/login');
            next();
        }
        console.log(result);
        console.log(result.admin_id);
        Admin.
        findById(result.admin_id, function (err, user) {
            if (err) console.log('[ERROR]' + err);
            if (!user) {
                next();
            }
            if(result.keep == true) {
                result.expire = new Date(Date.now() + 14*24*60*60*1000);
                result.save();
            } else {
                result.expire = new Date(Date.now() + 1*60*60*1000);
                result.save();
            }
            req.user = user;
            next();
        });
    });
});

router.get('/', function (req, res, next) 
{
    var qudata = querystring.parse(req.url.query);
    Ann.find({ visible: true }).sort('-ontop').sort('-update').populate('author').exec(function (err, anns) {
        if (err) console.log('[ERROR]' + err);
        var sanns = [];
        var page = parseInt(req.query.p) || 1;
        var totalpage = Math.ceil(anns.length / 10);
        if(totalpage == 0)totalpage = 1;
        if(page < 1 || page > totalpage){
            res.redirect("?p=1");
            return;
        }
        var i = 0, c = 0;
        for(i = (page-1)*10; i < anns.length; i++){
            if(c >= 10) break;
            sanns.push(anns[i]);
            c++;
        }

        res.render('index', {
            moment: moment, 
            title: 'INFOR Ann System',
            session: req.session ,
            data: sanns,
            page: page,
            tpage: totalpage,
            menu: req.user.level || 0
        });
    });
});

router.get('/content/:id', function (req, res) {
    console.log('[INFO]'+req.params.id);
    Ann.findById(req.params.id).populate('author').exec(function (err, ann) {
        if (err) console.log('[ERROR]' + err);
        ann.views++;
        ann.save(function (err, ann, count) {
            if (err) console.log('[ERROR]' + err);
        });
        res.render('content', {moment: moment, title: ann.title +' - INFOR Ann System', session: req.session, ann: ann, menu: req.user.level || 0});
    });
});

module.exports = router;
