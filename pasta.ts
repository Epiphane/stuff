declare function require(name:string);
declare var process;
declare var Promise;
declare var module;

var https = require('https');
var fs = require('fs');
var gm = require('gm');
var Octokat = require('octokat');

// console.log('Octokat', Octokat);

var octo = new Octokat();

var NetworkSrvc = require('./NetworkSrvc.js');

var fetchAvatar = function(user) {
	return new Promise(function(resolve, reject) {
		var download = function() {
			return new Promise(function(resolve, reject) {
				octo.users(user).fetch().then(function(obj) {
					var pictureUrl = obj.avatarUrl;
					var file = fs.createWriteStream("avatar.jpg");
					console.log('pictureUrl', pictureUrl);
					var request = https.get(pictureUrl, function(response) {
						response.pipe(file);
						file.on('finish', function() {
							file.close(function() {
								resolve();
							});
						});
					}).on('error', function(error) {
						console.log('could not fetch avatar', error);
						reject(error);
					});
				}, function onError(e) {
					console.log('could not fetch user data for ' + user, e);
					reject(e);
				});
			});
		}

		// function() {
			download().then(function() {
				var stuff = gm('avatar.jpg')
				stuff.resize('40', '40', '^')
					stuff.gravity('Center')
					stuff.crop('40', '40')
				stuff.stream(function(err, stdout, stderr) {
					var writeStream = fs.createWriteStream('avatar_resized.jpg');
						var arst = stdout.pipe(writeStream);
						arst.on('finish', function() {
							arst.close(function() {
								resolve();
							})
						})
				});
			}, function onError(error) {
				console.log('download died', error);
			});
		// }
	});
}

module.exports = fetchAvatar;
