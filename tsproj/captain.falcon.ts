
declare var require: (moduleId: string) => any;
declare var process: any;
declare var Promise: any;

var exec = require('child_process').exec,
   child;

var fs = require('fs');
var Slack = require('slack-client');

var xraySrvc:any = require('./xraySrvc.js');
var slackMsgSrvc: any = require('./slackMsgSrvc.js');
var s3Class: any = require('./s3Class.js');
var emojiClass: any = require('./emojiClass.js');

var args:Array<string> = process.argv.slice(2);

let scrapeContestData = function(participants:Array<string>) {
   let contestData = {};

   participants.forEach((nextPerson) => {
      contestData[nextPerson] = {};
   });

   let getData = (person:string) => {
      return Promise.all([
         xraySrvc.scrapeContribCount(person).then((count) => {
            contestData[person].contribsToday = count;
         }),
         xraySrvc.scrapeStreak(person).then((count) => {
            contestData[person].commitStreak = count;
         })
      ]);
   }

   return Promise.all(participants.map((nextPerson) => {
      return getData(nextPerson);
   })).then(() => {
      return contestData;
   });
}

let formatContestData = function(contestData: any):string {
   let str = '';
   for (let person in contestData) {
      str += `${person} made ${contestData[person].contribsToday} contributions`
       + ` today and has a current streak of `
       + `${contestData[person].commitStreak}\n`;
   }
   return str;
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

let falconPunch = function(opts: any, channel: any, name: string): void {
   let execCmd;
   if (opts.slackUrl) {
      execCmd = `./makegif.sh slack '${opts.slackUrl}'`;
   } else if (opts.localFile) {
      execCmd = `./makegif.sh file '${opts.localFile}'`;
   } else if (opts.url) {
      execCmd = `./makegif.sh url '${opts.url}'`;
   }

   console.log('execCmd', execCmd);

   exec(execCmd, (error, stdout, stderr) => {
      console.log('stdout', stdout);
      console.log('stderr', stderr);
      if (error != null) {
         console.log('exec error:', error);
      } else {
         let temp = stdout.trim();
         let path = `${temp}/better.gif`;
         let bucket = s3.GIF_BUCKET;
         let key = `${slack.team.id}_${name}.gif`;
         let url = `https://s3-us-west-2.amazonaws.com/${bucket}/${key}`;
         console.log('url', url);

         console.log('path', path);
         console.log('key', key);

         s3.uploadGif(path, key).then((data) => {
            console.log('data', data);
            let message = {
               text: 'Falcon... punch!',
               attachments: [
                  {
                     "fallback": "this is a fallback",
                     "pretext": "this is pretext",
                     "title": "this is the title",
                     "image_url": url,
                     "text": "this is the text",
                     "color": "#FF0000"
                  }
               ]
            };
            channel.postMessage(message);
         }, (err) => {
            console.log('upload file died', err);
         });
      }
   });
}

var movebook = JSON.parse(fs.readFileSync('../ignoreme/.movebook', 'utf8'));

var slackToken = movebook.token;
var slack = new Slack(slackToken, true, true);

var s3 = new s3Class();
var emojiMachine = new emojiClass();

slack.on('open', function() {
   console.log('connected to ' + slack.team.name + ' as @' + slack.self.name);
   emojiMachine.addCustomEmojis(slack);
});

var participants: Array<string> = ['zarend', 'kyle-piddington', 'lejonmcgowan'];

slack.on('message', function(message) {
   var body = message.getBody();
   var channel = slack.getChannelGroupOrDMByID(message.channel);
   if (body.match('<@' + slack.self.id + '>:*.*contest.*')) {
      scrapeContestData(participants).then(function(data) {
         channel.send(formatContestData(data));
      }, function onError(reason) {
         channel.send('fail whale...');
         channel.send(reason);
      });
   } else if (body.match('<@' + slack.self.id + '>:*.*help.*')) {
      var strs = [
         'Here are my commands:',
         '   contest – get update on commit streak',
         'commands comming soon:',
         '  punch, kick, knee, show moves'
      ];
      channel.send(strs.join('\n'));
   } else if (body.match('<@' + slack.self.id + '.*>:*.*punch.*')) {
      slackMsgSrvc.findMentions(body).forEach((user) => {
         user = 'U' + user;
         if (user !== slack.self.id) {
            let picUrl = slack.users[user] && slack.users[user].profile.image_32;
            let opts = { slackUrl: picUrl};
            falconPunch(opts, channel, user);
         }
      });

      slackMsgSrvc.findEmojis(body).forEach((emoji) => {
         let stuff = emojiMachine.lookup[emoji];
         let opts;
         if (stuff.type === 'url') {
            opts = { url: stuff.data };
         } else {
            opts = { localFile: emojiMachine.getFilePath(emoji) };
         }
         falconPunch(opts, channel, emoji);
      });
   } else {
      console.log(message);
   }
});

slack.login();

