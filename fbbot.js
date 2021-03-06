var request = require('request');
var mongoose = require('mongoose');
var fs = require('fs');
var fb_bot = mongoose.model('fb_bot');
var debug = require('debug')('inforann:server');
var crypto = require('crypto');


var set = {
	init: init,
	MutipleSendTextMessage: MutipleSendTextMessage,
	SingleSendTextMessage: SingleSendTextMessage,
	sendGenericMessage: sendGenericMessage,
	adduser: adduser,
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

function SingleSendTextMessage(sender, text) {
	let messageData = { text:text }

	var jizz = ["MC", "星星" ,"廣廣","隨便","尤尤","01閔","大猥","妮妮","簡老大","嘻嘻"];

	var count = Math.floor((Math.random() * 10))
	if (sender == "575623689313399") return;
	console.log(count);
	text = jizz[count] + text ;
	
	
	messageData = {text:  text };
	//console.log(sender);
	//console.log("");
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
			
			console.log('Error: ', response.body.error);

		}
	})

}



function MutipleSendTextMessage(text) {
	
	
	let messageData = {text:  text };
	
	
	
	//console.log(messageData);
	fb_bot.find({}, (err, data) => {
    if(err) console.log(err)
    //console.log(data);
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

      request(options, (error, response, req) => {
        //console.log(req.body); // Print the shortened url.
        //console.log(error);
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

