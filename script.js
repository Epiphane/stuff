var _Xray = require('x-ray');
var fs = require('fs');
var Download = require('download');
var moment = require('moment');
var Slack = require('slack-client');

var args = process.argv.slice(2);

var xray = function(url, selector, format) {	// prefer promise-based async
	return new Promise(function(resolve, reject) {
		new _Xray()(url, selector, format)(function(error, results) {
			if (error) {
				reject(error);
			}
			resolve(results);
		});
	});
}

var scrapeContribCount = function(githubHandle) {
	return new Promise(function(resolve, reject) {
		var dateStr = moment().format('YYYY-MM-DD');
		var url = 'https://github.com/' + githubHandle + '?tab=contributions&from=' + dateStr;
		xray(url, '.text-emphasized').then(function(results) {
			if (results) {
				var str = githubHandle + ' made ' + results + ' contributions today'
				resolve(str);
			}
			resolve(null);
		});
	});
}

var scrapeSteak = function(githubHandle) {
	return new Promise(function(resolve, reject) {
		var url = 'https://github.com/' + githubHandle;
		var format = [{
			desc: '.text-muted',
			val: '.contrib-number'
		}];
		xray(url, '.contrib-column', format).then(function(results) {
			var desiredThing = results.find(function(thing) {
				return thing.desc == "Current streak";
			});
			if (desiredThing) {
				resolve(desiredThing.desc + ' for ' + githubHandle + ': ' + desiredThing.val);
			} else {
				reject('couldn\'t find streak');
			}
		});
	});
}

var getContestData = function() {
	return new Promise(function(resolve, reject) {
		var participants = ['zarend', 'kyle-piddington', 'lejonmcgowan'];

		var contribCountStrs = [];
		var streakStrs = [];
		var completedPromises = 0;
		var erroredContribCounts = [];
		var erroredStreaks = [];

		function buildStr() {
			var errorStrs = [];
			if (erroredStreaks.length) {
				errorStrs.push('could not scrape streaks for: ' + erroredStreaks.join('\''));
			}
			if (erroredContribCounts.length) {
				errorStrs.push('could not today\'s contributions  for: ' + erroredContribCounts.join('\''));
			}

			var strs = streakStrs.concat(contribCountStrs, errorStrs).filter(function(str) {
				return str;
			});
			return strs.join('\n');
		}

		function onCompletePromise() {
			completedPromises++;
			if (completedPromises === participants.length * 2) {
				resolve(buildStr());
			}
		}

		for (var idx in participants) {
			(function(idx) {
				var person = participants[idx];
				scrapeContribCount(person).then(function(data) {
					contribCountStrs[idx] = data;
					onCompletePromise();
				}, function onError() {
					erroredContribCounts.push(person);
					onCompletePromise();
				});
				scrapeSteak(person).then(function(data) {
					streakStrs[idx] = data;
					onCompletePromise();
				}, function onError() {
					erroredStreaks.push(person);
					onCompletePromise();
				});
			})(idx);
		}
	});
}

var movebook = JSON.parse(fs.readFileSync('./ignoreme/.movebook', 'utf8'));

var slackToken = movebook.token;
var slack = new Slack(slackToken, true, true);

slack.on('open', function() {
	console.log('connected to ' + slack.team.name + ' as @' + slack.self.name);
});

slack.on('message', function(message) {
	var body = message.getBody();
	var channel = slack.getChannelGroupOrDMByID(message.channel);
	if (body.match('<@' + slack.self.id + '>:*.*contest.*')) {
		getContestData().then(function(str) {
			channel.send(str)
		}, function onError(reason) {
			channel.send('fail whale...');
			channel.send(reason);
		});
	}
	else if (body.match('<@' + slack.self.id + '>:*.*help.*')) {
		var strs = [
			'Here are my commands:',
			'   contest – get update on commit streak',
			'commands comming soon:',
			'	punch, kick, knee, show moves'
		];
		channel.send(strs.join('\n'));
	}
	else if (body.match('<@' + slack.self.id + '>:*.*experiment0.*')) {
		console.log('breakpoint');
		debugger;
	}
});

slack.login();

