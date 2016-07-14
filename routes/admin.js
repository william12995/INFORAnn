var crypto = require('crypto');
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');
var utils = require('../utils');

exports.admin = function (req, res) {
    var tologin = true;
    if(req.cookies.session)
    {+
        Session.
        findOne({cookie_id : req.cookies.session}).
        exec(function(err,result)
        {
            console.log(result);
            if(!result)
            {
                console.log('CookieError');
                return;
            }
            if(result.expire < Date.now())
            {
                result.remove(function(err,result)
                {
                    if( err ) return next( err );
                });
                console.log('CookieExpired');
                return;
            }
            tologin = false;
            res.render('admin', { title: 'Admin' });
        });
    }
    if(tologin == false)
    {
        res.redirect('/login');
    } 
    //res.render('login', { title: 'Admin Login' });
};

exports.login = function (req, res)
{
    res.render('login', { title: 'Admin Login'});
}

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
        if(err){console.log(err)};
        if(!user)
        {
            console.log(user);
            res.locals.error = '使用者不存在';
            console.log('user '+username+' is not exist!');
            res.redirect('/login');
            return;
        }
        if(pwdhash != user.password && user.password != "")
        {
            res.locals.error = '密碼錯誤';
            console.log('password for '+username+' error!');
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
                if( err ) return next( err );
            });
        }
        else
        {
            res.cookie('session',sessionid,{ expires: 0});
            new Session ({
                cookie_id : sessionid,
                admin_id : user.admin_id,
                expire : new Date(Date.now() + 1*60*60*1000)
            }).save(function ( err, ls, count ){
                if( err ) return next( err );
            });
        }
        res.redirect('/admin');
    });
};

