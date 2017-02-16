var request = require('request');
var mongoose = require('mongoose');
var fs = require('fs');
var fb_bot = mongoose.model('fb_bot');
var debug = require('debug')('inforann:server');
var crypto = require('crypto');


var set = {
	init: init,
	sendTextMessage: sendTextMessage,
	sendGenericMessage: sendGenericMessage,
	adduser: adduser,
	verifyRequestSignature: verifyRequestSignature,
	page_token:'',
	verify_token:'',
	appSecret:'',
	serverURL:''
};

exports = module.exports = set;

function init(){
	try{
		var data = fs.readFileSync('fb_bot.json', {
            encoding: 'utf-8',
            flag: 'r'
        });
        var cfg = JSON.parse(data);

        if (cfg.page_token && cfg.verify_token) {
            set.token = cfg.page_token;
            set.verify = cfg.verify_token;
            set.appSecret = cfg.appSecret;
            set.serverURL = cfg.serverURL;
            console.log('[INFO]'.cyan + 'FBbot config had successfully loaded!');
        } else {
            debug('[FB_Bot]'.green + 'The token or the secret is not found.');
            disable();
        }


	}catch(err){
		debug('[FBBot]'.green + 'Error occurred:');
        debug(err);
	}

};

function sendTextMessage(text) {
	

	let messageData = { text:text }
	console.log(messageData);
	fb_bot.find({}, (err, data) => {
    if(err) console.log(err)

    data.forEach((i) => {
      if(i.id == "575623689313399") return;
      var options = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
	 	qs: {access_token:set.token},
	 	method: 'POST',
	 	json: {
	 		recipient: {id:i.id},
	 		message: messageData,
	 	}
      }

      //console.log(options)

      request(options, (error, response, body) => {
        console.log(body); // Print the shortened url.
        console.log(error);
      });

    })

  })


};

function sendGenericMessage(sender) {
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": "First card",
					"subtitle": "Element #1 of an hscroll",
					"image_url": "http://messengerdemo.parseapp.com/img/rift.png",
					"buttons": [{
						"type": "web_url",
						"url": "https://www.messenger.com",
						"title": "web url"
					}, {
						"type": "postback",
						"title": "Postback",
						"payload": "Payload for first element in a generic bubble",
					}],
				}, {
					"title": "Second card",
					"subtitle": "Element #2 of an hscroll",
					"image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
					"buttons": [{
						"type": "postback",
						"title": "Postback",
						"payload": "Payload for second element in a generic bubble",
					}],
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:set.token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function adduser(sender) {
    fb_bot.findOne({
        id: sender
    }).exec(function(err, result) {
        if (result) {
            console.log( ' id  has already existed.');
            return;
        }
        new fb_bot({
            id: sender
        }).save(function(err, r) {
            if (err) console.log(err);
        });
    });
}

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', set.appSecret)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}