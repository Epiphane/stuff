var Xray = require('x-ray');
var fs = require('fs');
var Download = require('download');

var args = process.argv.slice(2);

var getStreak = function(user) {
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
			console.log(desiredThing.desc + ' for ' + user + ': ' + desiredThing.val);
		} else {
			consloe.log('fail whale');
		}
	})
}

args.forEach(function (nextPerson) {
	getStreak(nextPerson);
});