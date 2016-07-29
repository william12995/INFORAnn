var crypto = require('crypto');
var mongoose = require('mongoose');
var moment = require('moment');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var utils = require('../utils');

exports.admin = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
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
            res.render('admin', { moment: moment, title: 'Admin', menu: tologin, data: anns });
        }
    }, true);
};

exports.annnew = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        var empty = new Ann(
            {
                author: '',
                title: '',
                istextcontent: true,
                content: '',
                create: Date.now(),
                update: Date.now(),
                visible: true,
                views: 0,
                ontop: false
            });
        res.render('annform', { title: 'Add New Announcement', menu: tologin, ann: empty });
        return;
    },true);
}

exports.annnew_proc = function (req, res) {
    levelfind(req, function (err, tologin, name, user) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (tologin == 0) {
            res.redirect('/login');
            return;
        }

        new Ann({
            author: user._id,
            title: req.body['title'],
            istextcontent: req.body['istextcontent'] != 'on',
            content: req.body['content'],
            create: Date.now(),
            update: Date.now(),
            visible: req.body['visible'] == 'on',
            views: 0,
            ontop: req.body['ontop'] == 'on'
        }).save(function (err, ls, count) {
            if (err) return next(err);
            res.redirect('/admin');
        });
    });
}

exports.annedit = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        editper(req, res, req.params.id, function (ann) {
            res.render('annform', { title: 'Edit Announcement', menu: tologin, ann: ann });
        });
    }, true);
};

exports.annedit_proc = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        editper(req, res, req.params.id, function (ann) {
            ann.title = req.body['title'];
            ann.istextcontent = req.body['istextcontent'] != 'on';
            ann.content = req.body['content'];
            ann.update = Date.now();
            ann.visible = req.body['visible'] == 'on';
            ann.ontop = req.body['ontop'] == 'on';
            ann.save(function (err, ls, count) {
                if (err) return next(err);
                res.redirect('/admin');
            });
        });
    }, true);
};

exports.anndelete = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        editper(req, res, req.params.id, function (ann) {
            ann.remove(function (err, ann) {
                if (err) {
                    console.log('[ERROR]' + err);
                }
                res.redirect('/admin');
            });
        });
    }, true);
};

exports.usradm = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (tologin <= 2) {
            res.redirect('/admin');
        }
        if (tologin == 3) {
            Admin.find({
                level: { $lte: 3 }
            }, admfind);
        } else if (tologin >= 4) {
            Admin.find({}, admfind);
        }
        function admfind(err, users) {
            if (err) return next(err);
            res.render('usradm', { moment: moment, title: 'UserManage', menu: tologin, data: users });
        }
    }, true);
};

exports.login = function (req, res) {
    levelfind(req, function (err, tologin, name) {
        if (tologin > 0) {
            res.redirect('/admin');
        }
        res.render('login', { title: 'Admin Login', menu: tologin, errmsg: req.session.error });
        req.session.error = null;
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
            req.session.error = '使用者不存在';
            console.log('[WARN]user '+username+' is not exist!');
            res.redirect('/login');
            return;
        }
        if (user.enable == false) {
            req.session.error = '使用者被停用';
            console.log('[WARN]user ' + username + ' is disabled!');
            res.redirect('/login');
            return;
        }
        if(pwdhash != user.password && user.password != "")
        {
            req.session.error = '密碼錯誤';
            console.log('[WARN]password for '+username+' error!');
            res.redirect('/login');
            return;
        }
        var sessionid = utils.uid(32);
        user.LastLogin = Date.now();
        user.save();
        if(remember == 'on')
        {
            res.cookie('session',sessionid,{ expires: new Date(Date.now() + 14*24*60*60*1000)});
            new Session ({
                cookie_id : sessionid,
                admin_id : user._id,
                expire : new Date(Date.now() + 14*24*60*60*1000),
                keep : true
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
                expire : new Date(Date.now() + 1*60*60*1000),
                keep : false
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
        res.render('chpwd', { title: 'Change Admin Password', menu: tologin, errmsg: req.session.error });
        req.session.error = null;
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
                req.session.error = '使用者不存在';
                console.log('[WARN]user '+name+' is not exist!');
                res.redirect('/login');
                return;
            }
            if (oldhash != user.password && user.password != "")
            {
                req.session.error = '密碼錯誤';
                console.log('[WARN]password for '+name+' error!');
                res.redirect('/chpwd');
                return;
            }

            if (newpwd != comfirmpwd) {
                req.session.error = '密碼不一致';
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
function levelfind(req, callback, refuse) {
    Session.findOne({ cookie_id: req.cookies.session }).exec(function (err, result) {
        refuse = refuse || false;
        if (err) {
            callback(err, null);
        }
        //console.log(result);
        if (!result) {
            console.log('[INFO]user cookie not found');
            if (refuse == true) {
                res.redirect('/login');
                return;
            }
            callback(null, 0);
            return;
        }
        if (result.expire < Date.now()) {
            result.remove(function (err, result) {
                if (err) return next(err);
            });
            console.log('[WRAN]user cookie expired');
            req.session.error = "Cookie資訊已過期，請重新登入。";
            if (refuse == true) {
                res.redirect('/login');
                return;
            }
            callback(null, 0);
            return;
        }
        Admin.
        findById(result.admin_id, function (err, user) {
            if (!user) {
                if (refuse == true) {
                    res.redirect('/login');
                    return;
                }
                callback(null, 0);
                return;
            }
            if(result.keep == true) {
                result.expire = new Date(Date.now() + 14*24*60*60*1000);
                result.save();
            } else {
                result.expire = new Date(Date.now() + 1*60*60*1000);
                result.save();
            }//Add Keeping
            callback(err, user.level, user.name, user);
            return;
        });
    });
}

function editper(req, res, id, callback) {
    levelfind(req, function (err, tologin, name) {
        Ann.findById(id, function (err, ann) {
            ann.populate('author').exec(function (err, author) {
                if (author.level > tologin) {
                    res.redirect('/admin');
                    return;
                }
                if (tologin == 1 && name != author.name) {
                    res.redirect('/admin');
                    return;
                }
                callback(ann);
            });
        });
    });
}

