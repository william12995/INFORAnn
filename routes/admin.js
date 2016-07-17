var crypto = require('crypto');
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var utils = require('../utils');

exports.admin = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }       
        if (tologin == 0) {
            res.redirect('/login');
            return;
        }
        if (tologin == 1) {
            Ann.find({ author: name }).sort('-update').exec(annsfind);
        }
        else if (tologin >= 2) {
            Ann.find().sort('-update').exec(annsfind);
        }
        return;
        function annsfind(err, anns) {
            if (err) return next(err);
            res.render('admin', { title: 'Admin', menu: tologin, data:anns });
        }
    });
};

exports.annnew = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (tologin == 0) {
            res.redirect('/login');
            return;
        }
        var empty = new Ann(
            {
                author: '',
                title: '',
                istextcontent: false,
                content: '',
                create: Date.now(),
                update: Date.now(),
                visible: true,
                views: 0,
                ontop: false
            });
        res.render('annform', { title: 'Add New Announcement', menu: tologin, ann: empty });
        return;
    });
}

exports.login = function (req, res) {
    levelfind(req, function (err, tologin, name) {
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
        if(remember == 'on')
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

exports.chpwd = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (tologin == 0) {
            res.redirect('/login');
        }
        res.render('chpwd', { title: 'Change Admin Password', menu: tologin });
    });
}

exports.chpwd_proc = function (req, res) {
    var oldpwd = req.body['oldpwd'];
    var newpwd = req.body['newpwd'];
    var comfirmpwd = req.body['comfirmpwd'];
    var oldsha512 = crypto.createHash('sha512');
    var oldhash = oldsha512.update(oldpwd).digest('hex');
    var newsha512 = crypto.createHash('sha512');
    var newhash = newsha512.update(newpwd).digest('hex');

    levelfind(req, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (tologin == 0) {
            res.redirect('/login');
        }

        Admin.
        findOne({ name: name }).
        exec(function (err, user) {
            if (err){console.log('[ERROR]' + err)};
            if (!user)
            {
                res.locals.error = '使用者不存在';
                console.log('[WARN]user '+name+' is not exist!');
                res.redirect('/login');
                return;
            }
            if (oldhash != user.password && user.password != "")
            {
                res.locals.error = '密碼錯誤';
                console.log('[WARN]password for '+name+' error!');
                res.redirect('/chpwd');
                return;
            }

            if (newpwd != comfirmpwd) {
                res.locals.error = '密碼不一致';
                console.log('[WARN]passwords for ' + name + ' are not same!');
                res.redirect('/chpwd');
                return;
            }

            user.password = newhash;
            user.save(function (err, user, count) {
                if (err) { console.log('[ERROR]' + err) };
                res.redirect('/');
            });
        });
    });
}

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
            callback(err, user.level, user.name);
            return;
        });
    });
}

