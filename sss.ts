declare var require: (moduleId: string) => any;

var AWS = require('aws-sdk');
var fs = require('fs');

var s3 = new AWS.S3();

s3.createBucket({ Bucket: 'zachzach' }, function() {
	var params = { Bucket: 'zachzach', Key: 'myKey', Body: 'Hello!' };

	s3.putObject(params, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			console.log('successfully uploaded data to zachzach/myKey');
			s3.getObject({ Bucket: 'zachzach', Key: 'myKey'}, function(err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log('successfully got the object', data);
					debugger;
				}
			});

			// s3.getBucketWebsite({ Bucket: 'zachzach'}, function(err, data) {
			// 	if (err) {
			// 		console.log(err);
			// 	} else {
			// 		console.log('got website for zachzach', data);
			// 	}
			// })

			// var params = { Bucket: 'zachzach', Key: 'myKey' };
			// var url = s3.getSignedUrl('getObject', params);
			// console.log('The URL is', url);

			var params = {
				Bucket: 'zachzach',
				Key: 'public/img2.jpg',
				Body: fs.readFileSync('./avatar.jpg'),
				ACL: 'public-read'
			};
			s3.putObject(params, function(err, data) {
				if (err) {
					console.log('err', err);
				} else {
					console.log('put the object', data);
				}
			})
		}
	});
});
