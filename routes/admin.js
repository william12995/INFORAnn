var crypto = require('crypto');
var mongoose = require('mongoose');
var moment = require('moment');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var utils = require('../utils');

exports.admin = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (err) {
            console.log('[ERROR]' + err);
        }

        if (tologin == 1) {
            Ann.find({ author: user._id }).sort('-update').populate('author').exec(annsfind);
        }
        else if (tologin >= 2) {
            //Ann.find().sort('-update').populate('author').find({ 'author': { $elemMatch: { 'level': { $lte: tologin } } } }).exec(annsfind);
            //TODO:Hide Edit&Del Button to ann can't edit.
            Ann.find().sort('-update').populate('author').exec(annsfind);
        }
        return;
        function annsfind(err, anns) {
            if (err) console.log('[ERROR]' + err);
            res.render('admin', { moment: moment, title: 'Admin', session: req.session, session: req.session, menu: tologin, data: anns });
        }
    }, true);
};

exports.annnew = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        var empty = new Ann(
            {
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
        res.render('annform', { title: 'Add New Announcement', session: req.session, menu: tologin, ann: empty });
        return;
    },true);
}

exports.annnew_proc = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (tologin == 0) {
            res.redirect('/login');
            return;
        }

        new Ann({
            author: user._id,
            authorcache: "",
            title: req.body['title'],
            istextcontent: req.body['istextcontent'] != 'on',
            content: req.body['content'],
            create: Date.now(),
            update: Date.now(),
            visible: req.body['visible'] == 'on',
            views: 0,
            ontop: req.body['ontop'] == 'on'
        }).save(function (err, ls, count) {
            if (err) console.log('[ERROR]' + err);
            else req.session.info = "新增成功";
            res.redirect('/admin');
        });
    });
}

exports.annedit = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
        editper(req, res, req.params.id, function (ann) {
            res.render('annform', { title: 'Edit Announcement', session: req.session, menu: tologin, ann: ann });
        });
    }, true);
};

exports.annedit_proc = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
        editper(req, res, req.params.id, function (ann) {
            ann.title = req.body['title'];
            ann.istextcontent = req.body['istextcontent'] != 'on';
            ann.content = req.body['content'];
            ann.update = Date.now();
            ann.visible = req.body['visible'] == 'on';
            ann.ontop = req.body['ontop'] == 'on';
            ann.save(function (err, ls, count) {
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "儲存成功";
                res.redirect('/admin');
            });
        });
    }, true);
};

exports.anndelete = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
        editper(req, res, req.params.id, function (ann) {
            ann.remove(function (err, ann) {
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "刪除成功";
                res.redirect('/admin');
            });
        });
    }, true);
};

exports.usradm = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
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
        //TODO:Add Chpwd Fuction
        function admfind(err, users) {
            if (err) console.log('[ERROR]' + err);
            res.render('usradm', { moment: moment, title: 'UserManage', session: req.session, menu: tologin, data: users });
        }
    }, true);
};

exports.usrnew = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        var empty = new Admin({
            name: "",
            nick: "",
            LastLogin: null,
            enable: true,
            system: false,
            password: "",
            level: 1
        });
        res.render('usrform', { title: 'UserManage', session: req.session, head: "新增使用者", menu: tologin, usr: empty, operator: user, lock: false });
    }, true);
};

exports.usrnew_proc = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        //TODO:Detect same name user
        Admin.findOne({ name: req.body['name'] }, function (err, same) {
            if (same) {
                req.session.error = "重複的使用者名稱";
                var ldata = new Admin({
                    name: req.body['name'],
                    nick: req.body['nick'],
                    LastLogin: null,
                    enable: req.body['enable'] == 'on',
                    system: false,
                    password: "",
                    level: req.body['level']
                });
                res.render('usrform', { title: 'UserManage', session: req.session, head: "新增使用者", menu: tologin, usr: ldata, operator: user, lock: false });
            } else {
                new Admin({
                    name: req.body['name'],
                    nick: req.body['nick'],
                    LastLogin: Date.now(),
                    enable: req.body['enable'] == 'on',
                    system: false,
                    password: "",
                    level: req.body['level']
                }).save(function (err, ls, count) {
                    if (err) console.log('[ERROR]' + err);
                    else req.session.info = "新增成功";
                    res.redirect('/usradm');
                });
            }
        });
    }, true);
};

exports.usredit = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        Admin.findById(req.params.id, function (err, adm) {
            if (!adm)
            {
                req.session.error = '使用者不存在';
                console.log('[WARN]user ID: '+req.params.id+' is not exist!');
                res.redirect('/usradm');
                return;
            }
            if (tologin < adm.level) {
                req.session.error = "權限不足";
                res.redirect('/usradm');
                return;
            }
            res.render('usrform', { title: 'UserManage', session: req.session, head: "編輯使用者", menu: tologin, usr: adm, operator: user, lock: true });
        });
    }, true);
};

exports.usredit_proc = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        Admin.findById(req.params.id, function (err, adm) {
            if (!adm)
            {
                req.session.error = '使用者不存在';
                console.log('[WARN]user ID: '+req.params.id+' is not exist!');
                res.redirect('/usradm');
                return;
            }
            if (tologin < adm.level) {
                req.session.error = "權限不足";
                res.redirect('/usradm');
                return;
            }
            if (adm.system == false) {
                //adm.name = req.body['name'];
                adm.enable = req.body['enable'] == 'on';
                adm.level = req.body['level'];
            }
            adm.nick = req.body['nick'];
            adm.save(function (err, ls, count) {
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "儲存成功";
                res.redirect('/usradm');
            });
        });
    }, true);
};

exports.usrdel = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        Admin.findById(req.params.id, function (err, adm) {
            if (!adm)
            {
                req.session.error = '使用者不存在';
                console.log('[WARN]user ID: '+req.params.id+' is not exist!');
                res.redirect('/usradm');
                return;
            }
            if (tologin < adm.level) {
                req.session.error = "權限不足";
                res.redirect('/usradm');
                return;
            }
            if (adm.system == true) {
                req.session.error = "不可刪除系統帳戶";
                res.redirect('/usradm');
                return;
            }
            //if (adm._id == user._id) {
            if (adm._id.equals(user._id)) {
                req.session.error = "不可刪除自己";
                res.redirect('/usradm');
                return;
            }
            adm.remove(function (err, result) {
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "刪除成功";
            });
            res.redirect('/usradm');
        });
    }, true);
};

exports.usrpwd = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        Admin.findById(req.params.id, function (err, adm) {
            if (!adm)
            {
                req.session.error = '使用者不存在';
                console.log('[WARN]user ID: '+req.params.id+' is not exist!');
                res.redirect('/usradm');
                return;
            }
            if (tologin < adm.level) {
                req.session.error = "權限不足";
                res.redirect('/usradm');
                return;
            }
            res.render('usrpwd', { title: 'ChangeUserPassword', session: req.session, head: "設定使用者密碼", menu: tologin, usr: adm, operator: user });
        });
    }, true);
}

exports.usrpwd_proc = function (req, res) {
    levelfind(req, res, function (err, tologin, name, user) {
        if (tologin <= 2) {
            req.session.error = "權限不足";
            res.redirect('/admin');
        }
        Admin.findById(req.params.id, function (err, adm) {
            if (!adm)
            {
                req.session.error = '使用者不存在';
                console.log('[WARN]user ID: '+req.params.id+' is not exist!');
                res.redirect('/usradm');
                return;
            }
            if (tologin < adm.level) {
                req.session.error = "權限不足";
                res.redirect('/usradm');
                return;
            }
            var newpwd = req.body['newpwd'];
            var comfirmpwd = req.body['comfirmpwd'];
            var newhash = pwdhash(newpwd);

            if (newpwd != comfirmpwd) {
                req.session.error = '密碼不一致';
                console.log('[WARN]passwords for ' + name + ' are not same!');
                res.redirect('/usrpwd/'+req.params.id);
                return;
            }
            user.password = newhash;
            user.save(function (err, user, count) {
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "密碼變更完成";
                res.redirect('/usradm');
            });
        });
    }, true);
}

exports.login = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
        if (tologin > 0) {
            res.redirect('/admin');
        }
        res.render('login', { title: 'Admin Login', menu: tologin, session: req.session });
    });
};

exports.login_proc = function (req, res) 
{
    var username = req.body['username'];
    var password = req.body['password'];
    var remember = req.body['remember'];
    var passwdhash = pwdhash(password);
    
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
        if(passwdhash != user.password && user.password != "")
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
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "登入成功";
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
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "登入成功";
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
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "登出成功";
            });
        }
        res.clearCookie('session');
        res.redirect('/login');
    });
};

exports.chpwd = function (req, res) {
    levelfind(req, res, function (err, tologin, name) {
        if (err) {
            console.log('[ERROR]' + err);
        }
        if (tologin == 0) {
            res.redirect('/login');
        }
        res.render('chpwd', { title: 'Change Admin Password', session: req.session, menu: tologin, session: req.session });
    });
}

exports.chpwd_proc = function (req, res) {
    var oldpwd = req.body['oldpwd'];
    var newpwd = req.body['newpwd'];
    var comfirmpwd = req.body['comfirmpwd'];
    var oldhash = pwdhash(oldpwd);
    var newhash = pwdhash(newpwd);

    levelfind(req, res, function (err, tologin, name) {
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
                if (err) console.log('[ERROR]' + err);
                else req.session.info = "密碼變更完成";
                res.redirect('/');
            });
        });
    });
}

exports.levelfind = levelfind;
function levelfind(req, res, callback, refuse) {
    Session.findOne({ cookie_id: req.cookies.session }).exec(function (err, result) {
        refuse = refuse || false;
        if (err) {
            callback(err, null);
        }
        //console.log(result);
        if (!result) {
            console.log('[INFO]user cookie not found');
            req.session.error = "請先登入！";
            if (refuse == true) {
                res.redirect('/login');
                return;
            }
            callback(null, 0);
            return;
        }
        if (result.expire < Date.now()) {
            result.remove(function (err, result) {
                if (err) console.log('[ERROR]' + err);
            });
            console.log('[WRAN]user cookie expired');
            req.session.error = "登入資訊已過期，請重新登入。";
            if (refuse == true) {
                res.redirect('/login');
                return;
            }
            callback(null, 0);
            return;
        }
        Admin.
        findById(result.admin_id, function (err, user) {
            if (err) console.log('[ERROR]' + err);
            if (!user) {
                if (refuse == true) {
                    req.session.error = "使用者不存在。";
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
    levelfind(req, res, function (err, tologin, name) {
        Ann.findById(id, function (err, ann) {
            if (!ann)
            {
                req.session.error = '公告不存在';
                console.log('[WARN]ann ID: '+id+' is not exist!');
                res.redirect('/admin');
                return;
            }
            ann.populate('author', function (err, annp) {
                if (annp.author.level > tologin) {
                    req.session.error = "權限不足";
                    res.redirect('/admin');
                    return;
                }
                if (tologin == 1 && name != annp.author.name) {
                    req.session.error = "權限不足";
                    res.redirect('/admin');
                    return;
                }
                callback(ann);
            });
        });
    }, true);
}

function pwdhash(password){
    var sha512 = crypto.createHash('sha512');
    var hash = sha512.update(password).digest('hex');
    return hash;
}
