declare var require: (moduleId: string) => any;
declare var Promise: any;
declare var process: any;

const HOME = process.env.HOME || process.env.USERPROFILE;

class _emojiClass {
   public emojiDataDir;
   private lookup;
   private localeDir = 'img-apple-64';
   private slackClient;

   constructor(theEmojiDataLoc = `${HOME}/projects/emoji-data`) {
      this.emojiDataDir = theEmojiDataLoc;

      this.lookup = {};

      let emojiData = require(`${this.emojiDataDir}/emoji.json`);
      
      emojiData.forEach((nextEntry) => {
         this.lookup[nextEntry.short_name] = {
            data: nextEntry.image,
            type: 'file'
         };
      });
   }

   public findEmojis(msg:string):Array<string> {

      return [];
   }

   // assume that slackClient has already been initialized
   public addCustomEmojis(slack:any):void {
      return new Promise((resolve, reject) => {
         slack._apiCall('emoji.list', { agent: 'node-slack' }, (data) => {
            console.log('data', data);
            for (let nextEmoji in data.emoji) {
               let str = data.emoji[nextEmoji];
               if (str.indexOf('alias:') === 0) {
                  this.lookup[str.split(':')[1]] = {
                     type: 'file',
                     data: this.lookup[nextEmoji]
                  }
               } else {
                  this.lookup[nextEmoji] = {
                     type: 'url',
                     data: str
                  }
               }
            }
            resolve();
         });
      });
   }

   public getFilePath(emoji: string): string {
      return `${this.emojiDataDir}/${this.localeDir}/${this.lookup[emoji].data}`;
   }
}

module.exports = _emojiClass;
