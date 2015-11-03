declare var require: (moduleId: string) => any;
declare var Promise: any;
declare var module: any;

var _Xray = require('x-ray');
var moment: any = require('moment');
let x = _Xray();

var xray = function(url: string, selector: string, format = undefined) { // prefer promise-based async
    return new Promise((resolve, reject) => {
        new _Xray()(url, selector, format)(function(error, results) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}

let scrapeContribCount = function(githubHandle: string, date = moment()) {
   let dateStr: string = date.format('YYYY-MM-DD');
   let url: string = 'https://github.com/' + githubHandle + '?tab=contributions&from=' + dateStr;
   
   console.log('hi');

   return new Promise((resolve, reject) => {
      x(url, '.contribution-activity-listing', { inner: x('.inner', '.text-emphasized') })((err, data) => {
         if (err) {
            console.log('err', err);
            reject(err);
         } else {
            if (data.inner) {
               let count = parseInt(data.inner);
               if (!isNaN(count)) {
                  resolve(count);
               } else {
                  reject('expeted integer count');
               }
            }
            resolve(0);
         }
      });
   });
}

let scrapeStreak = function(githubHandle: string) {
    return new Promise((resolve, reject) => {
        let url: string = 'https://github.com/' + githubHandle;
        let format = [{
            desc: '.text-muted',
            val: '.contrib-number'
        }];
        xray(url, '.contrib-column', format).then((results) => {
            let desiredThing = results.find((thing) => {
               return thing.desc == 'Current streak';
            });
            if (desiredThing) {
               let count = parseInt(desiredThing.val);
               if (!isNaN(count)) {
                  resolve(count);
               }
               reject('expected a number');
            } else {
               reject('couldn\'t find streak');
            }
        });
    });
}

module.exports = {
   xray,
   scrapeContribCount,
   scrapeStreak
};
