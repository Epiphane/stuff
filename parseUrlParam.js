var url = require('url');

var args = process.argv.slice(2);

if (args.length < 2) {
	console.error('usage: node ./parseUrlParam.js url param');
	process.exit(1);
}
else {
	var query = url.parse(args[0], true).query;
	if (query[args[1]] === undefined) {
		console.error('does not contain query');
		process.exit(1);
	}
	console.log(query[args[1]]);
}
