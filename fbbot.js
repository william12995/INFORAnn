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

function sendTextMessage(status,text) {
	var status = status;
	var count = 0 ;
	let messageData = {text:  text };
	if (status){
		switch(count % 3){
			case 0 :
				text = "垃圾 1"+ text ;				
				count += 1 ;
				console.log("dd 1");
				break;
			case 1 :
				text = "垃圾 2"+ text ;				
				count += 1 ;
				console.log("dd 2");
				break;
			case 2 :
				text = "垃圾 3"+ text ;				
				count += 1 ;
				console.log("dd 3");
				break;
			default:
				console.log("Count Error");
		} 
		 messageData = {text:  text };
	}
	else{
		 messageData = {text: text };
	}
	
	
	//console.log(messageData);
	fb_bot.find({}, (err, data) => {
    if(err) console.log(err)
    //console.log(data);
    data.forEach((i) => {
    	console.log(i);
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

