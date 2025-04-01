#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Validate environment variables
if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_ENDPOINT) {
    console.error('Missing required S3 credentials or endpoint in .env file');
    process.exit(1);
}

// Configure S3 Client
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT,
    s3ForcePathStyle: true, // For more compatibility MinIO
    signatureVersion: 'v4',
});

async function uploadFileToS3(filePath, bucketName, keyName) {
    const fileStream = fs.createReadStream(filePath);
    const mime = await import('mime');
    const contentType = mime.default.getType(filePath) || 'application/octet-stream';

    try {
        const result = await s3.upload({
            Bucket: bucketName,
            Key: keyName,
            Body: fileStream,
            ContentType: contentType,
        }).promise();
        console.log(`File uploaded successfully: ${result.Location}`);
    } catch (error) {
        console.error('Error uploading file:', error.message);
    }
}

// Parse CLI arguments
const argv = yargs
    .usage('Usage: $0 --file <filePath> --bucket <bucketName> [--key <keyName>]')
    .option('file', {
        alias: 'f',
        describe: 'Path to the file to upload',
        demandOption: true,
        type: 'string',
    })
    .option('bucket', {
        alias: 'b',
        describe: 'S3 bucket name',
        demandOption: true,
        type: 'string',
    })
    .option('key', {
        alias: 'k',
        describe: 'Key name for the file in S3 (default: file name)',
        type: 'string',
    })
    .help()
    .argv;

(async () => {
    const filePath = path.resolve(argv.file);
    const bucketName = argv.bucket;
    const keyName = argv.key || path.basename(filePath);

    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    console.log(`Uploading file "${filePath}" to bucket "${bucketName}" as "${keyName}"...`);
    await uploadFileToS3(filePath, bucketName, keyName);
})();
