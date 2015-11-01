declare var require: (moduleId: string) => any;
declare var Buffer: any;

var AWS = require('aws-sdk');
var fs = require('fs');

class s3Srvc {
   private s3: any;
   private GIF_BUCKET = 'zachzach-gifs';
   constructor() {
      this.s3 = new AWS.S3();
   }
   public uploadGif(path:string, key:string) {
      return new Promise((resolve, reject) => {
         fs.readFile(path, (err, data) => {

             console.log('data (uploadFile)', data);
            if (err) {
               reject(err);
            }

            let params = {
                Bucket: this.GIF_BUCKET,
                Key: key,
                Body: new Buffer(data, 'binary'),
                ContentType: 'image/gif'
            }

            this.s3.putObject(params, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            })
         })

         
      });
   }
   public testUpload(body:string) {
      return new Promise((resolve, reject) => {
         let params = { Bucket: this.GIF_BUCKET, Key: 'myKey', Body: body };

         this.s3.putObject(params, (err, data) => {
            if (err) {
               reject(err);
            }
            resolve();
         });
      });
   }
}


module.exports = s3Srvc;

