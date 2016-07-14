var crypto = require('crypto');
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');
var Ann = mongoose.model('Ann');

exports.admin = function (req, res) {
    res.redirect('/login');
    //res.render('login', { title: 'Admin Login' });
};

exports.login = function (req, res)
{
    res.render('login', { title: 'Admin Login' });
}

exports.login_proc = function (req, res) 
{
    var username = req.body['username'];
    var password = req.body['password'];
    var remember = req.body['remember'];
    var sha512 = crypto.createHash('sha512');
    var pwdhash = sha512.update(password).digest('hex');
    
    Admin.
    find({ name : username}).
    exec( function( err, user )
    {
        if(err){console.log(err)};
        if(!user.length)
        {
            res.locals.error = '使用者不存在';
            res.redirect('/login');
            return;
        }
        if(pwdhash != user.password)
        {
            res.locals.error = '密碼錯誤';
            res.redirect('/login');
            return;
        }

        res.redirect('/admin');
    });
};

