var crypto = require('crypto');
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var utils = require('../utils');

exports.admin = function (req, res) {
    levelfind(req, function (err, tologin) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (req.cookies.session) {
            if (tologin > 0) {
                res.render('admin', { title: 'Admin', menu: tologin });
            }
        }
        if (tologin == 0) {
            res.redirect('/login');
        }
    });
};

exports.login = function (req, res) {
    levelfind(req, function (err, tologin) {
        if (tologin > 0) {
            res.redirect('/admin');
        }
        res.render('login', { title: 'Admin Login', menu: tologin });
    });
};

exports.login_proc = function (req, res) 
{
    var username = req.body['username'];
    var password = req.body['password'];
    var remember = req.body['remember'];
    var sha512 = crypto.createHash('sha512');
    var pwdhash = sha512.update(password).digest('hex');
    
    Admin.
    findOne({ name : username}).
    exec( function( err, user )
    {
        if(err){console.log('[ERROR]' + err)};
        if(!user)
        {
            res.locals.error = '使用者不存在';
            console.log('[WARN]user '+username+' is not exist!');
            res.redirect('/login');
            return;
        }
        if(pwdhash != user.password && user.password != "")
        {
            res.locals.error = '密碼錯誤';
            console.log('[WARN]password for '+username+' error!');
            res.redirect('/login');
            return;
        }
        var sessionid = utils.uid(32);
        if(remember)
        {
            res.cookie('session',sessionid,{ expires: new Date(Date.now() + 14*24*60*60*1000)});
            new Session ({
                cookie_id : sessionid,
                admin_id : user._id,
                expire : new Date(Date.now() + 14*24*60*60*1000)
            }).save(function ( err, ls, count ){
                if (err) return next(err);
                res.redirect('/admin');
            });
        }
        else
        {
            res.cookie('session',sessionid,{ expires: 0});
            new Session ({
                cookie_id : sessionid,
                admin_id : user._id,
                expire : new Date(Date.now() + 1*60*60*1000)
            }).save(function ( err, ls, count ){
                if (err) return next(err);
                res.redirect('/admin');
            });
        }
    });
};

exports.logout = function (req, res) {
    Session.findOne({ cookie_id: req.cookies.session }).exec(function (err, result) {
        if (err) {
            next(err);
        }
        if (!result) {
            console.log('[WARN]user cookie not found');
        } else {
            result.remove(function (err, result) {
                if (err) return next(err);
            });
        }
        res.clearCookie('session');
        res.redirect('/login');
    });
};


exports.levelfind = levelfind;
function levelfind(req, callback) {
    Session.findOne({ cookie_id: req.cookies.session }).exec(function (err, result) {
        if (err) {
            callback(err, null);
        }
        //console.log(result);
        if (!result) {
            console.log('[INFO]user cookie not found');
            callback(null, 0);
            return;
        }
        if (result.expire < Date.now()) {
            result.remove(function (err, result) {
                if (err) return next(err);
            });
            console.log('[WRAN]user cookie expired');
            callback(null, 0);
            return;
        }
        Admin.
        findById(result.admin_id, function (err, user) {
            if (!user) {
                callback(null, 0);
                return;
            }
            callback(err, user.level);
        });
    });
}

