
/**
 * Module dependencies.
 */
require('./db');
var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var path = require('path');
var engine = require('ejs-locals');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var debug = require('debug')('inforann:server');
var colors = require('colors');
var moment = require('moment');

var index = require('./routes');
var admin = require('./routes/admin');
var embed = require('./routes/embed');
var Admin = mongoose.model('Admin');
var Line = mongoose.model('Line');

var app = express();

// all environments
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(session({
    secret: 'S4gznk%^MdGfxAEXT?N*WcD5tD!w@BC+',
    resave: true,
    saveUninitialized: true
    //!!!!!IMPORTANT!!!!! CHANGE SECRET ABOVE BEFORE YOU USE THE SYSTEM!!!!!
}));

Admin.findOne({
    name: "root"
}).exec(function(err, result) {
    if (!result) {
        console.log("[WARN]".yellow + "can't find admin account \"root\"!");
        console.log("[WARN]".yellow + "will auto create a passwordless root account.");
        new Admin({
            name: "root",
            nick: "System Admin",
            LastLogin: Date.now(),
            enable: true,
            system: true,
            password: "",
            level: 4
        }).save(function(err, r) {
            if (err) console.log(err);
        });
        console.log('[INFO]'.cyan + 'root account initialized!');
    }
});

global.linebot = {};

function disable() {
    console.log('[WARN]'.yellow + 'unable to read linebot config');
    console.log('[WARN]'.yellow + 'will disable linbot function');
    linebot.cfg = {
        enable: false,
        token: "",
        secret: ""
    };
}
try {
    var data = fs.readFileSync('linebot.json', {
        encoding: 'utf-8',
        flag: 'r+'
    });
    linebot.cfg = JSON.parse(data);
    if (linebot.cfg.token && linebot.cfg.secret) {
        linebot.cfg.enable = true;
        if (!linebot.cfg.debug) linebot.cfg.debug = false;
        console.log('[INFO]'.cyan + 'Linebot config had successfully loaded!');
    } else {
        disable();
    }
} catch (err) {
    disable();
}

app.use(function(req, res, next) {
    app.locals.moment = moment;
    next();
});

//linebot callback
function getSign(data) {
    var crypto = require('crypto');
    var body = new Buffer(JSON.stringify(data.body), 'utf8');
    // secret 為您的 Channel secret
    var hash = crypto.createHmac('sha256', linebot.cfg.secret).update(body).digest('base64');
    return hash
}
function adduser(lineid) {
    Line.findOne({
        id: lineid
    }).exec(function(err, result) {
        if(result){
            console.log('[ERROR]'.yellow + '[LINEBot]'.green + 'Line id ' + lineid + ' has already existed.');
            return;
        }
        new Line({
            id: lineid
        }).save(function(err, r) {
            if (err) console.log(err);
        });
    });
}
function rmuser(lineid) {
    Line.findOne({
        id: lineid
    }).exec(function(err, result) {
        if(!result){
            console.log('[ERROR]'.yellow + '[LINEBot]'.green + 'Line id ' + lineid + ' doesn\'t exist.');
            return;
        }
        result.remove(function(err, r) {
            if (err) console.log(err);
        });
    });
}
if (linebot.cfg.enable === true) {
    app.post('/callback', function(req, res) {
        var data = req.body;
        if (linebot.cfg.debug === true) {
            console.log('[DEBUG]'.cyan + '[LINEBot]'.green + req.get("X-LINE-ChannelSignature"));
            console.log('[DEBUG]'.cyan + '[LINEBot]'.green + getSign(req));
            console.log('[DEBUG]'.cyan + '[LINEBot]'.green + data);
        }
        if (getSign(req) == req.get("X-LINE-ChannelSignature")) {
            // ChannelSignature 正確，處理訊息
            data.events.forEach(function(result) {
                var type = result.type;
                if (type == 'follow') {
                    adduser(result.source.userId);
                } else if (type == 'unfollow') {
                    rmuser(result.source.userId);
                } else if (type == 'message') {

                }
            });
            res.sendStatus(200);
        } else
            res.sendStatus(403); //ChannelSignature錯誤，回傳403
    });
}

app.use('/embed', embed);
app.use('/', index);
app.use('/index', index);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        if (err.status != 404)
            console.log('[ERROR]'.red + err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            title: 'Error Occurred',
            error: err
        });
    });
}

module.exports = app;

debug('app.js initialized.');
