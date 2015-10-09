declare function require(name:string);
declare var module;
declare var Promise;

var https = require('https');

class NetworkSrvc {
	sendGet(hostname: string, path : string, params = {}, debug = false) {
		return new Promise(function(resolve, reject) {
			console.log('todo: send get request');
			https.get({
				hostname: hostname,
				path: path,
				headers: {
					'User-Agent': 'blah'
				}
			}, function(res) {
				if (debug) {
					console.log('statusCode:', res.statusCode);
					console.log('headers:', res.headers);
				}

				var data = '';

				res.on('data', function(d) {
					data += d.toString();
				});

				res.on('end', function() {
					resolve(JSON.parse(data));
				});

				res.on('error', function(e) {
					reject(e);
				})
			}).on('error', function(e) {
				reject(e);
			});
		});
	}
}

var instance = new NetworkSrvc();
module.exports = instance;