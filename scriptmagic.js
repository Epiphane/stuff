var gm = require('gm');

var highestFrameNum = 97;

var x = 0;
var y = 0;

var metadata = {
	startingFrameNum: 0,
	endingFrameNum: 97,
	width: 40,
	height: 40,
	overlayLocs: {
		'12': [178, 100],
		'13': [129, 78],
		'14': [86, 85],
		'15': [62, 104],
		'16': [47, 118],
		'17': [35, 127],
		'18': [36, 137],
		'19': [40, 156],
		'20': [61, 167],
		'21': [59, 183],
		'22': [72, 73],
		'23': [92, 65],
		'24': [113, 81],
		'25': [123, 93],
		'26': [139, 110],
		'27': [164, 136],
		'28': [194, 169],
		'29': [216, 197],
		'30': [222, 194],
		'31': [222, 177],
		'32': [177, 137],
		'33': [130, 97],
		'34': [95, 86],
		'35': [73, 82],
		'36': [55, 83],
		'37': [38, 80],
		'38': [24, 81],
		'39': [17, 81],
		'40': [7, 83],
		'41': [1, 88],
		'45': [8, 145],
		'46': [18, 166],
		'47': [36, 189],
		'48': [53, 219],
		'49': [62, 234],
		'50': [67, 259],
		'51': [68, 241],
		'52': [67, 231],
		'53': [77, 228],
		'54': [100, 209],
		'55': [113, 213],
		'56': [113, 207],
		'57': [90, 180],
		'58': [21, 104],
		'59': [41, 48],
		'60': [41, 41],
		'61': [41, 41],
		'62': [40, 44],
	}
}

console.log(metadata.overlayLocs[12]);

var startFrame = metadata.startingFrameNum;
var endFrame = metadata.endingFrameNum;

for (var i = startFrame; i <= endFrame; i++) {
	var fileName = 'frame' + (i < 10 ? '0' : '') + i + '.gif';

	if (metadata.overlayLocs[i]) {
		x = metadata.overlayLocs[i][0];
		y = metadata.overlayLocs[i][1];
		x -= metadata.width/2;
		y -= metadata.height/2;
		gm()
			.in('-page', '+0+0')
			.in('shit/' + fileName)
			.in('-page', '+' + x + '+' + y) // location of smallIcon.jpg is x,y -> 10, 20
			.in('seattle.jpeg')
			.mosaic()
			.write('outshit/' + fileName, function (err) {
		    	if (err) console.log(err);
		});
	}
}