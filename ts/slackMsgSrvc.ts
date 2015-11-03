declare var module;

let api:any = {};

api.personRef = /<(@U.*?)>/gi;
api.EMOJI = /:[0-9a-z_-]+:/gi;

api.getUserIdFromPersonRef = function(str: string): string {
   const startIdx = 3;
   const endIdx = str.length - 1;

   if (endIdx > startIdx) {
      return str.substring(startIdx, endIdx).split('|')[0];
   }

   return null;
}

// finds mentions to slack users, returns a list of id's of those users
api.findMentions = function(msg: string): Array<String> {
   let refs = msg.match(api.personRef) || [];
   return refs.map((nextRef) => {
      return api.getUserIdFromPersonRef(nextRef);
   }).filter((personId) => {
       return !!personId;
   });
}

// finds emojis in a slack message
api.findEmojis = function(msg: string): Array<String> {
   let emojis = msg.match(api.EMOJI) || [];
   return emojis.map((nextEmoji) => {
      return nextEmoji.substring(1, nextEmoji.length - 1);
   });
}

let tests = [
   "",
   "<@U0BPT1F4Z>: will you please punch the shit out of <@U06TXJRGB>",
   "(testing) <@U06TXJRGB> <@U06TXSTM3> <@U0B9SC14Y> &lt;(@arsnteairnsanersionaerostne|anerisotnaeoirsnt)&gt; <http://www.google.com|www.google.com>",
];

tests.forEach((str) => {
   console.log(api.findMentions(str));
});

(function() {
   let tests = [
      ":taco:",
      "i like :taco:",
      "do you like :some-emoji:"
   ];

   tests.forEach((str) => {
      console.log(api.findEmojis(str));
   })
})();

module.exports = api;