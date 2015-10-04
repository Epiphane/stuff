var Xray = require('x-ray');
var fs = require('fs');
var Download = require('download');
var moment = require('moment');
var Slack = require('slack-client');

var args = process.argv.slice(2);

var dateStr = moment().subtract(0, 'days').format('YYYY-MM-DD');

var getContribs = function(user, message) {
	var xray = new Xray();
	var url = 'https://github.com/' + user + '?tab=contributions&from=' + dateStr;
	console.log('url', url);
	xray(url, '.text-emphasized')
	(function(error, results) {
		console.log('contribs', results);
		if (results) {
			var numCommitsToday = parseInt(results);
			var channel = slack.getChannelGroupOrDMByID(message.channel);
			var str = user + ' made ' + results + ' contributions today';
			channel.send(str);
		}
	})
}

var getStreak = function(user, message) {
	var xray = new Xray();
	xray('https://github.com/' + user, '.contrib-column', [{
		desc: '.text-muted',
		val: '.contrib-number'
	}])
	(function(error, results) {
		// console.log('results', results);
		var desiredThing = results.find(function(thing) {
			return thing.desc == "Current streak";
		});
		if (desiredThing) {
			var channel = slack.getChannelGroupOrDMByID(message.channel);
			var str = desiredThing.desc + ' for ' + user + ': ' + desiredThing.val;
			channel.send(str);
		} else {
			consloe.log('fail whale');
		}
	})
}

var githubHandles = ['zarend', 'kyle-piddington', 'lejonmcgowan'];


var movebook = JSON.parse(fs.readFileSync('./ignoreme/.movebook', 'utf8'));

var slackToken = movebook.token;
var slack = new Slack(slackToken, true, true);

slack.on('open', function() {
	console.log('connected to ' + slack.team.name + ' as @' + slack.self.name);
});

slack.on('message', function(message) {
	var body = message.getBody();
	if (body.match('<@' + slack.self.id + '>:*.*contest.*')) {
		var str = githubHandles.forEach(function(name) {
			getStreak(name, message);
			getContribs(name, message);
		})
	}
});

slack.login();

