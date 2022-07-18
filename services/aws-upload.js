const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');


aws.config.update({
    "secretAccessKey": process.env.AWS_ACCESS_KEY_ID,
    "accessKeyId": process.env.AWS_SECRET_ACCESS_KEY,
    "region": process.env.AWS_DEFAULT_REGION
})

const s3 = new S3Client({ region: 'us-east-1' });

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString())
        }
    })
});

module.exports = upload;