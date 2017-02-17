
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
var CronJob = require('cron').CronJob;
var linebot = require('./linebot');
var fb_bot = require('./fbbot');

var index = require('./routes');
var admin = require('./routes/admin');
var embed = require('./routes/embed');
var Admin = mongoose.model('Admin');
var Session = mongoose.model('Session');

var app = express();


// all environments
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(bodyParser.json({ verify: fb_bot.verifyRequestSignature() }));
app.use(express.static('public'));

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
    onTick: function() {
        Session.remove({
            expire: {
                $lt: new Date()
            }
        }, function(err, count) {
            if (err) console.log('[ERROR]'.red + err);
            if (count.result.n > 0)
                console.log('[INFO]'.cyan + 'Cleaned expired ' + count.result.n + ' sessions.');
        });
    },
    runOnInit: true
});
dbclean.start();

//linebot.init();
fb_bot.init();

app.use(function(req, res, next) {
    app.locals.moment = moment;
    next();
});

//linebot callback
app.post('/callback', function(req, res, next) {
    if (linebot.enable !== true) {
        res.sendStatus(404);
        return;
    };
    linebot.verify(req, function() {
        var data = req.body;
        // ChannelSignature 正確，處理訊息
        data.events.forEach(function(result) {
            var type = result.type;
            if (type == 'follow' && result.source.type == 'user') {
                linebot.adduser(result.source.userId);
            } else if (type == 'unfollow' && result.source.type == 'user') {
                linebot.rmuser(result.source.userId);
            } else if (type == 'message') {

            }
        });
        res.sendStatus(200);
    }, function() {
        res.sendStatus(403); //ChannelSignature錯誤，回傳403
    });
});


// for facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === fb_bot.set.verify_token) {
        res.send(req.query['hub.challenge'])
        //console.log("HEY! NICE");
    } else {
        res.send('Error, wrong token')
    }
})

// to post data
// app.post('/webhook/', function (req, res) {
//     let messaging_events = req.body.entry[0].messaging;
//     console.log(messaging_events);
//     for (let i = 0; i < messaging_events.length; i++) {
//         let event = req.body.entry[0].messaging[i]
//         let sender = event.sender.id 

        
//         if (event.message && event.message.text) {
//             let text = event.message.text
//             if (text === 'Generic'){ 
//                 console.log("welcome to chatbot");
//                 fb_bot.sendGenericMessage(sender);
//                 continue;
//             }
//             //console.log(text);
//             fb_bot.sendTextMessage(true, text.substring(0, 200)) ;            
//             fb_bot.adduser(sender);
                
            
//         }
//         if (event.postback) {
//             let text = JSON.stringify(event.postback)
//             fb_bot.sendTextMessage(true, "Postback received: "+text.substring(0, 200), token)
//             continue
//         }
//     }
//     res.sendStatus(200)
// })

app.post('/webhook', function (req, res) {
  var data = req.body;
  console.log( data.messaging) ;
  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.message&& messagingEvent.message.text) {
          fb_bot.sendTextMessage(true,messagingEvent.message.text);
          fb_bot.adduser(messagingEvent.sender.id );
      }
         

        //adduser(messagingEvent);
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});



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
