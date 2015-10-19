var url = require('url');

var args = process.argv.slice(2);

if (args.length < 2) {
	console.log('usage: node ./parseUrlParam.js url param');
}
else {
	console.log(url.parse(args[0], true).query[args[1]]);
}
