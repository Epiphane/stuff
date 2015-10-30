declare var module;

let api:any = {};

api.personRef = /<(@U.*?)>/gi;

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

let tests = [
   "",
   "<@U0BPT1F4Z>: will you please punch the shit out of <@U06TXJRGB>",
   "(testing) <@U06TXJRGB> <@U06TXSTM3> <@U0B9SC14Y> &lt;(@arsnteairnsanersionaerostne|anerisotnaeoirsnt)&gt; <http://www.google.com|www.google.com>",
];

tests.forEach((str) => {
   console.log(api.findMentions(str));
});

module.exports = api;