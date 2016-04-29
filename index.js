(function() {
    "use strict";
    var TelegramBot = require('node-telegram-bot-api');
	try {
		var Promise = Promise;
	} catch(err) {
		var Promise = require('promise/lib/es6-extensions');
	}


    var env = process.env,
        token = env.BOTAPIKEY,
        port = env.OPENSHIFT_NODEJS_PORT,
        host = env.OPENSHIFT_NODEJS_IP,
        domain = env.OPENSHIFT_APP_DNS,
        env_name = (env.OPENSHIFT_APP_DNS) ? 'openshift' : 'dev',
	// TelegramBot instance
		bot,
	/* Configuration 
	* */
	// These text routes are called for every text message and are run through; the first match get to respond.
		textRoutes = [
			// examples: if someone says "mamma mia"...
			[/mamma mia/i, function(msg) { bot.sendMessage(msg.chat.id, "It's me, Mario!"); }],
			// ... in any other case, pick randomly one of the responses.
			[/.*/, makeResponder([
				"This is Bot.",
				"Bot is here to listen."
			])]
		],
	// called upon a message containing a picture
		onPhoto,
	// called upon every update.
		onUpdate;
	
    if (env_name == 'dev') {
        console.log('Starting TelegramBot, polling');
        bot = new TelegramBot(token, {polling: true});
        bot.setWebHook();  // disable webhook
    } else {
        console.log('Starting TelegramBot, webHook = %s:%s', host, port);
        bot = new TelegramBot(token, {webHook: {port: port, host: host}});
        // OpenShift enroutes :443 request to OPENSHIFT_NODEJS_PORT
        bot.setWebHook(domain+':443/bot'+token);
    }

    function makeResponder(responses) {
        return function(msg) {
            var resp = responses[msg.message_id % responses.length];
            if (resp) {
				
                bot.sendMessage(msg.chat.id, templatesub(resp, msg.from));
            }
        }
    }
    
    function templatesub(str, data) {
        var re = /\{([\w\-\_]+)\}/g;
        return str.replace(re, function(match, key) {
            return data[key] || '';
        });
    }
    
	bot.on('message', function(msg) {
		if (msg.text && msg.from) {
			for (var i = 0, l = textRoutes.length; i++; i < l) {
				var re = textRoutes[0],
					fn = textRoutes[1];
				if (msg.text.match(re)) {
					fn(msg);
					break;
				}
			}
		} else if (msg.photo && onPhoto && onPhoto.call) {
			onPhoto(msg);
		}
		if (onUpdate && onUpdate.call) {
			onUpdate(msg);
		}
	});
	
}());
