var https = require('https');
var fs = require('fs');
var gm = require('gm');

var args = process.argv.slice(2);

var user = args[0];

var download = function(cb) {
	return new Promise(function(resolve, reject) {
		https.get({
			hostname: 'api.github.com',
			path: '/users/' + user,
			headers: {
				'User-Agent': 'blah'
			}
		}, function(res) {
			console.log("statusCode: ", res.statusCode);
			console.log("headers: ", res.headers);

			var data = '';

			res.on('data', function(d) {
				console.log('d', d);
				console.log('d.toString()', d.toString());
				data += d.toString();
			});

			res.on('end', function() {
				var obj = JSON.parse(data);
				console.log('obj', obj);
				var pictureUrl = obj.avatar_url;
				var file = fs.createWriteStream("file.jpg");
				var request = https.get(pictureUrl, function(response) {
					response.pipe(file);
					file.on('finish', function() {
						file.close(function() {
							resolve();
						});
					})
				})

			});
		}).on('error', function(e) {
			reject(e);
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