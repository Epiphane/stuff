declare var require: (moduleId: string) => any;
declare var process: any;
declare var Promise: any;

var _Xray = require('x-ray');
var fs = require('fs');
var Download = require('download');
var moment = require('moment');
var Slack = require('slack-client');
var gm = require('gm');
var fs = require('fs');

// var punchSomeone = require('./diverge.js').punch;

var args:Array<string> = process.argv.slice(2);



var xray = function(url:string, selector:string, format = undefined) { // prefer promise-based async
   return new Promise(function(resolve, reject) {
      new _Xray()(url, selector, format)(function(error, results) {
         if (error) {
            reject(error);
         }
         resolve(results);
      });
   });
}

var scrapeContribCount = function(githubHandle:string) {
   return new Promise(function(resolve, reject) {
      var dateStr:string = moment().format('YYYY-MM-DD');
      var url:string = 'https://github.com/' + githubHandle + '?tab=contributions&from=' + dateStr;
      xray(url, '.text-emphasized').then(function(results) {
         if (results) {
            var str:string = githubHandle + ' made ' + results + ' contributions today'
            resolve(str);
         }
         resolve(null);
      });
   });
}

var scrapeSteak = function(githubHandle:string) {
   return new Promise(function(resolve, reject) {
      var url:string = 'https://github.com/' + githubHandle;
      var format = [{
         desc: '.text-muted',
         val: '.contrib-number'
      }];
      xray(url, '.contrib-column', format).then(function(results) {
         var desiredThing = results.find(function(thing) {
            return thing.desc == "Current streak";
         });
         if (desiredThing) {
            resolve(desiredThing.desc + ' for ' + githubHandle + ': ' + desiredThing.val);
         } else {
            reject('couldn\'t find streak');
         }
      });
   });
}

var getContestData = function() {
   return new Promise(function(resolve, reject) {
      var participants:Array<string> = ['zarend', 'kyle-piddington', 'lejonmcgowan'];

      var contribCountStrs:Array<string> = [];
      var streakStrs:Array<string> = [];
      var completedPromises:number = 0;
      var erroredContribCounts = [];
      var erroredStreaks = [];

      function buildStr() {
         var errorStrs = [];
         if (erroredStreaks.length) {
            errorStrs.push('could not scrape streaks for: ' + erroredStreaks.join('\''));
         }
         if (erroredContribCounts.length) {
            errorStrs.push('could not today\'s contributions  for: ' + erroredContribCounts.join('\''));
         }

         var strs:Array<string> = streakStrs.concat(contribCountStrs, errorStrs).filter(function(str) {
            return !!str;
         });
         return strs.join('\n');
      }

      function onCompletePromise() {
         completedPromises++;
         if (completedPromises === participants.length * 2) {
            resolve(buildStr());
         }
      }

      for (var idx in participants) {
         (function(idx) {
            var person:string = participants[idx];
            scrapeContribCount(person).then(function(data) {
               contribCountStrs[idx] = data;
               onCompletePromise();
            }, function onError() {
               erroredContribCounts.push(person);
               onCompletePromise();
            });
            scrapeSteak(person).then(function(data) {
               streakStrs[idx] = data;
               onCompletePromise();
            }, function onError() {
               erroredStreaks.push(person);
               onCompletePromise();
            });
         })(idx);
      }
   });
}

var splitGif = function(fileName:string, outFolder:string) {
   return new Promise(function(resolve, reject) {
      gm(fileName)
         .in('+adjoin')
         .write(outFolder + '/%02d.gif', function(err) {
            if (err) {
               reject(err);
            }
            else {
               // TODO: this might be a little jank
               setTimeout(function() {
                  resolve();
               }, 3000);
            }
         });
   });
}

var folder = 'frames';

function copyFile(source, target) {
   return new Promise(function(resolve, reject) {
      var rd = fs.createReadStream(source);
      rd.on("error", function(err) {
         reject(err);
      });
      var wr = fs.createWriteStream(target);
      wr.on("error", function(err) {
         reject(err);
      });
      wr.on("close", function(ex) {
         resolve();
      });
      rd.pipe(wr);
   });
}

var punchSomeone = function(user) {
   return new Promise(function(resolve, reject) {
      splitGif('giphy.gif', folder).then(function() {
         console.log('hi');
         var gif = 'giphy';
         var metadata = require('./' + gif + '_metadata.json');

         var startFrame = metadata.startingFrameNum;
         var endFrame = metadata.endingFrameNum;
         var x;
         var y;

         for (var i = startFrame; i <= endFrame; i++) {
            var fileName = '' + (i < 10 ? '0' : '') + i + '.gif';

            var inFile = folder + '/' + fileName;
            var outFile = folder + '_out/' + fileName;

            if (metadata.overlayLocs[i]) {
               x = metadata.overlayLocs[i][0];
               y = metadata.overlayLocs[i][1];
               x -= metadata.width/2;
               y -= metadata.height/2;
               gm()
                  .in('-page', '+0+0')
                  .in(inFile)
                  .in('-page', '+' + x + '+' + y)
                  .in('avatar_resized.jpg')
                  .mosaic()
                  .write(outFile, function (err) {
                     if (err) console.log(err);
                     else {
                     }
               });
            }
            else {
               copyFile(inFile, outFile).then(function() {

               }, function onError(err) {
                  console.log('could not copy file', err);
               });
            }
         }

         setTimeout(function() {
            gm(folder + '_out/*.gif')
               .in('-delay', '10')
               .stream(function(err, stdout, stderr) {
                  if (err) {
                     console.log('fuck', err);
                  }
                  var writeStream = fs.createWriteStream('animation.gif');
                  var arst = stdout.pipe(writeStream);
                  arst.on('finish', function() {
                     arst.close(function() {
                        //resolve();
                        resolve();
                     });
                  });
               });
         }, 3000);   // TODO: this might be jank
         
      }, function onError(err) {
         console.log('couldn\'t split gif', err);
      });
   });
}

var movebook = JSON.parse(fs.readFileSync('./ignoreme/.movebook', 'utf8'));

var slackToken = movebook.token;
var slack = new Slack(slackToken, true, true);

slack.on('open', function() {
   console.log('connected to ' + slack.team.name + ' as @' + slack.self.name);
});

slack.on('message', function(message) {
   var body = message.getBody();
   var channel = slack.getChannelGroupOrDMByID(message.channel);
   if (body.match('<@' + slack.self.id + '>:*.*contest.*')) {
      getContestData().then(function(str) {
         channel.send(str)
      }, function onError(reason) {
         channel.send('fail whale...');
         channel.send(reason);
      });
   }
   else if (body.match('<@' + slack.self.id + '>:*.*help.*')) {
      var strs = [
         'Here are my commands:',
         '   contest – get update on commit streak',
         'commands comming soon:',
         '  punch, kick, knee, show moves'
      ];
      channel.send(strs.join('\n'));
   }
   else if (body.match('<@' + slack.self.id + '>:* *experiment0 *punch *')) {
      var name = body.split("punch")[1].trim();
      punchSomeone(name).then(function() {

      });
      console.log('breakpoint');
      debugger;
   }
});

punchSomeone('zarend').then(function() {
         debugger;
      });

slack.login();

