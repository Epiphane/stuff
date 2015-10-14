var url = require('url');

var args = process.argv.slice(2);

console.log(url.parse(args[0], true).query[args[1]]);
