var Xray = require('x-ray');
var fs = require('fs');
var Download = require('download');
var moment = require('moment');
var Slack = require('slack-client');

var args = process.argv.slice(2);

var dateStr = moment().subtract(0, 'days').format('YYYY-MM-DD');

var xray = function(url, selector, format) {
	return new Promise(function(resolve, reject) {
		new Xray()(url, selector, format)
	})
}

var getContribs = function(user, message) {
	return new Promise(function(resolve, reject) {
		var xray = new Xray();
		var url = 'https://github.com/' + user + '?tab=contributions&from=' + dateStr;
		console.log('url', url);
		xray(url, '.text-emphasized')
		(function(error, results) {
			console.log('contribs', results);
			if (results) {
				var numCommitsToday = parseInt(results);
				// var channel = slack.getChannelGroupOrDMByID(message.channel);
				var str = user + ' made ' + results + ' contributions today';
				// channel.send(str);
				resolve(str);
			}
			resolve(null);
		})
	});
}

var getStreak = function(user, message) {
	return new Promise(function(resolve, reject) {
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
				// var channel = slack.getChannelGroupOrDMByID(message.channel);
				var str = desiredThing.desc + ' for ' + user + ': ' + desiredThing.val;
				// channel.send(str);
				resolve(str);
			} else {
				reject('fail whale');
			}
		})
	});
}

var githubHandles = ['zarend', 'kyle-piddington', 'lejonmcgowan'];

var getData = function() {
	return new Promise(function(resolve, reject) {
		var streaks = {};
		var contribs = {};

		var promises = githubHandles.map(function(person) {
			return new Promise(function(resolve, reject) {
					getStreak(person).then(function(result) {
					streaks[person] = result;
					resolve();
				});
			});
		});

		promises = promises.concat(githubHandles.map(function(person) {
			return new Promise(function(resolve, reject) {
					getContribs(person).then(function(result) {
					contribs[person] = result;
					resolve();
				});
			});
		}));

		console.log('Promise', Promise);

		Promise.all(promises).then(function() {
			var strs = [];



			githubHandles.forEach(function(person) {
				if (streaks[person]) {
					strs.push(streaks[person]);
				}
			});

			githubHandles.forEach(function(person) {
				if (contribs[person]) {
					strs.push(contribs[person]);
				}
			});

			resolve(strs.join("\n"));
		}, function(reason) {
			console.log('reason', reason);
		})
	});
}

console.log('data', getData().then(function(shit) {
	console.log('shit', shit);
}));

var movebook = JSON.parse(fs.readFileSync('./ignoreme/.movebook', 'utf8'));

var slackToken = movebook.token;
var slack = new Slack(slackToken, true, true);

slack.on('open', function() {
	console.log('connected to ' + slack.team.name + ' as @' + slack.self.name);
});

slack.on('message', function(message) {
	var body = message.getBody();
	if (body.match('<@' + slack.self.id + '>:*.*contest.*')) {
		var channel = slack.getChannelGroupOrDMByID(message.channel);
		getData().then(function(str) {
			channel.send(str)
		}, function onError(reason) {
			channel.send('fail whale...');
			channel.send(reason);
		});
	}
});

slack.login();

