
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
var request = require('request');
var CronJob = require('cron').CronJob;

var index = require('./routes');
var admin = require('./routes/admin');
var embed = require('./routes/embed');
var Admin = mongoose.model('Admin');
var Line = mongoose.model('Line');
var Session = mongoose.model('Session');

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

var dbclean = new CronJob({
    cronTime: '00 */30 * * * *',
    onTick: function(){
    Session.remove({expire: {$lt: new Date() }}, function(err, count){
        if (err) console.log('[ERROR]'.red + err);
        if (count.result.n > 0)
            console.log('[INFO]'.cyan + 'Cleaned expired ' + count.result.n + ' sessions.');
    });},
    runOnInit: true
});
dbclean.start();

global.linebot = {};

function disable() {
    console.log('[WARN]'.yellow + 'unable to read linebot config');
    console.log('[WARN]'.yellow + 'will disable linebot function');
    linebot.cfg = {
        enable: false,
        token: "",
        secret: ""
    };
}
try {
    var data = fs.readFileSync('linebot.json', {
        encoding: 'utf-8',
        flag: 'r'
    });
    linebot.cfg = JSON.parse(data);
    if (linebot.cfg.token && linebot.cfg.secret) {
        if(!linebot.cfg.enable)
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
    return hash;
}

function adduser(lineid) {
    Line.findOne({
        id: lineid
    }).exec(function(err, result) {
        if (result) {
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
        if (!result) {
            console.log('[ERROR]'.yellow + '[LINEBot]'.green + 'Line id ' + lineid + ' doesn\'t exist.');
            return;
        }
        result.remove(function(err, r) {
            if (err) console.log(err);
        });
    });
}

function multicast(messageData) {
    request({
            uri: 'https://api.line.me/v2/bot/message/multicast',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer {" + linebot.cfg.token + "}"
            },
            method: 'POST',
            json: messageData
        },
        function(error, response, body) {
            //Check for error
            if (error) {
                return console.log('[ERROR]'.red, error);
            }
            //Check for right status code
            if (response.statusCode !== 200) {
                return console.log('[ERROR]'.red + 'Invalid Status Code Returned:', response.statusCode, response.statusMessage);
            }
            //All is good. Print the body
            if (linebot.cfg.debug === true) {
                console.log('[DEBUG]'.cyan + '[LINEBot]'.green + 'req.body'); // Show the HTML for the Modulus homepage.
                console.log(body);
            }
        }
    );
}

function sendmes(message) {
    var data = {
        to: [],
        messages: []
    };
    Line.find().select('id').exec(function(err, lineid) {
        var ids = lineid.map(function(res) {
            return res.id;
        });
        data.to = ids;
        data.messages.push({
            "type": "text",
            "text": message
        });
        multicast(data);
    });
}
if (linebot.cfg.enable === true) {
    app.post('/callback', function(req, res) {
        var data = req.body;
        if (linebot.cfg.debug === true) {
            console.log('[DEBUG]'.cyan + '[LINEBot]'.green + req.get("x-line-signature"));
            console.log('[DEBUG]'.cyan + '[LINEBot]'.green + getSign(req));
            console.log('[DEBUG]'.cyan + '[LINEBot]'.green + 'req.body');
            console.log(data);
        }
        if (getSign(req) == req.get("x-line-signature")) {
            // ChannelSignature 正確，處理訊息
            data.events.forEach(function(result) {
                var type = result.type;
                if (type == 'follow' && result.source.type == 'user') {
                    adduser(result.source.userId);
                } else if (type == 'unfollow' && result.source.type == 'user') {
                    rmuser(result.source.userId);
                } else if (type == 'message') {

                }
            });
            res.sendStatus(200);
        } else
            res.sendStatus(403); //ChannelSignature錯誤，回傳403
    });
}

linebot.fun = {};
linebot.fun.sendmes = sendmes;

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
