declare var require: (moduleId: string) => any;
declare var process: any;
declare var Promise: any;

var fs = require('fs');
var Slack = require('slack-client');

var xraySrvc:any = require('./xraySrvc.js');

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

var movebook = JSON.parse(fs.readFileSync('../ignoreme/.movebook', 'utf8'));

var slackToken = movebook.token;
var slack = new Slack(slackToken, true, true);

slack.on('open', function() {
   console.log('connected to ' + slack.team.name + ' as @' + slack.self.name);
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
      console.log('breakpoint');
      debugger;
   }
});

slack.login();

