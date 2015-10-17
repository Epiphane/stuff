declare function require(name:string);
declare var module;
declare var Promise;

let https = require('https');

let NetworkSrvc = {
	sendGet: function(hostname: string, path: string, params = {}, debug = false) {
		return new Promise((resolve, reject) => {
			https.get({
				hostname: hostname,
				path: path,
				headers: {
					'User-Agent': 'blah'
				}
			}, (res: any) => {
				if (debug) {
					console.log('statusCode:', res.statusCode);
					console.log('headers:', res.headers);
				}

				let data: string = '';

				res.on('data', (d: string) => {
					data += d.toString();
				});

				res.on('end', () => {
					try {
						resolve(JSON.parse(data));
					}
					catch(e) {
						reject(e);
					}
				});

				res.on('error', (e: any) => {
					reject(e);
				})
			}).on('error', (e : any) => {
				reject(e);
			});
		});
	}
}

module.exports = NetworkSrvc;