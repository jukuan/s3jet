#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

function exitWithError(message) {
    console.error(message);
    process.exit(1);
}

function assertPathExists(filePath) {
    if (!fs.existsSync(filePath)) {
        exitWithError('File not found: ' + filePath);
    }
}

// Validate environment variables
if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_ENDPOINT) {
    exitWithError('Missing required S3 credentials or endpoint in .env file');
}

// Configure S3 Client
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT,
    s3ForcePathStyle: true,
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

async function uploadDirTos3(dirPath, bucketName) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const keyName = file;

        console.log(`Uploading file "${filePath}" to bucket "${bucketName}" as "${keyName}"...`);
        await uploadFileToS3(filePath, bucketName, keyName);
    }
}

// Parse CLI arguments
const argv = yargs
    .usage('Usage: $0 [--file <filePath> | --dir <dirPath>] --bucket <bucketName> [--key <keyName>]')
    .option('file', {
        alias: 'f',
        describe: 'Path to the file to upload',
        type: 'string',
    })
    .option('dir', {
        alias: 'd',
        describe: 'Path to the directory containing files to upload',
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
    const bucketName = argv.bucket || process.env.S3_SECRET_KEY;

    if (argv.file) {
        const filePath = path.resolve(argv.file);

        const keyName = argv.key || path.basename(filePath);
        assertPathExists(filePath);

        console.log(`Uploading file "${filePath}" to bucket "${bucketName}" as "${keyName}"...`);
        await uploadFileToS3(filePath, bucketName, keyName);
    } else if (argv.dir) {
        const dirPath = path.resolve(argv.dir);
        assertPathExists(dirPath);

        console.log(`Uploading files from directory "${dirPath}" to bucket "${bucketName}"...`);
        await uploadDirTos3(dirPath, bucketName);
    } else {
        exitWithError('Please provide either --file or --dir option');
    }
})();
