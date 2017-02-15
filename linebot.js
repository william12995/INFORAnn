var fs = require('fs');
var request = require('request');
var mongoose = require('mongoose');
var crypto = require('crypto');
var Line = mongoose.model('Line');
var debug = require('debug')('inforann:server');

var ex = {
    verify: verify,
    adduser: adduser,
    rmuser: rmuser,
    broadcast: broadcast,
    init: init,
    enable: false,
    token: '',
    secret: ''
};
exports = module.exports = ex;

function disable() {
    console.log('[WARN]'.yellow + 'unable to read linebot config');
    console.log('[WARN]'.yellow + 'will disable linebot function');
}

function reqsend(target, messageData) {
    request({
            uri: target,
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer {" + ex.token + "}"
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
            debug('[LINEBot]'.green + 'req.body'); // Show the HTML for the Modulus homepage.
            debug(body);
        }
    );
}

function init() {
    try {
        var data = fs.readFileSync('linebot.json', {
            encoding: 'utf-8',
            flag: 'r'
        });
        var cfg = JSON.parse(data);
        if (cfg.token && cfg.secret) {
            ex.enable = cfg.enable;
            ex.token = cfg.token;
            ex.secret = cfg.secret;
            console.log('[INFO]'.cyan + 'Linebot config had successfully loaded!');
        } else {
            debug('[LINEBot]'.green + 'The token or the secret is not found.');
            disable();
        }
    } catch (err) {
        debug('[LINEBot]'.green + 'Error occurred:');
        debug(err);
        disable();
    }
};

function verify(req, onSucceed, onFailed) {
    var body = new Buffer(JSON.stringify(req.body), 'utf8');
    var hash = crypto.createHmac('sha256', ex.secret).update(body).digest('base64');
    debug('[LINEBot]'.green + 'Signature:' + req.get("x-line-signature"));
    debug('[LINEBot]'.green + 'Hash:' + hash);
    debug('[LINEBot]'.green + 'req.body');
    debug(req.body);
    if (hash == req.get("x-line-signature")) {
        onSucceed();
    } else {
        if (onFailed)
            onFailed();
    }
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
            debug('LINEUser: ' + lineid + ' had been added.');
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
            debug('LINEUser: ' + lineid + ' had been removed.');
            if (err) console.log(err);
        });
    });
}

function broadcast(message) {
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
        reqsend('https://api.line.me/v2/bot/message/multicast', data);
    });
}
