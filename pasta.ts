declare function require(name:string);
declare var process;
declare var Promise;

var https = require('https');
var fs = require('fs');
var gm = require('gm');
var Octokat = require('octokat');

// console.log('Octokat', Octokat);

var octo = new Octokat();

var NetworkSrvc = require('./NetworkSrvc.js');

var args = process.argv.slice(2);

var user = args[0];

var download = function() {
	return new Promise(function(resolve, reject) {
		octo.users(user).fetch().then(function(obj) {
			NetworkSrvc.sendGet('api.github.com', '/users/' + user).then(function(obj) {
				var pictureUrl = obj.avatar_url;
				var file = fs.createWriteStream("file.jpg");
				var request = https.get(pictureUrl, function(response) {
					response.pipe(file);
					file.on('finish', function() {
						file.close(function() {
							resolve();
						});
					});
				});
			}, function onError(e) {
				console.log('could not fetch user data for ' + user, e);
				reject(e);
			});
		});
	});
}

download().then(function() {
	var stuff = gm('file.jpg')
	stuff.resize('40', '40', '^')
		stuff.gravity('Center')
		stuff.crop('40', '40')
	stuff.stream(function(err, stdout, stderr) {
		var writeStream = fs.createWriteStream('file_resized.jpg');
			stdout.pipe(writeStream);
	});
}, function onError(error) {
	console.log('download died', error);
});