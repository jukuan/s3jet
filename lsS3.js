#!/usr/bin/env node

const AWS = require('aws-sdk');
const path = require('path');
const yargs = require('yargs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

function exitWithError(message) {
    console.error(message);
    process.exit(1);
}

function setupS3Client() {
    if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_ENDPOINT) {
        exitWithError('Missing required S3 credentials or endpoint in .env file');
    }

    return new AWS.S3({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        endpoint: process.env.S3_ENDPOINT,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
    });
}

async function getFilesInBucket(bucketName) {
    const s3 = setupS3Client();

    try {
        const data = await s3.listObjects({ Bucket: bucketName }).promise();

        return data.Contents || [];
    } catch (error) {
        console.error('Error listing objects:', error.message);
    }
}

const argv = yargs
    .usage('Usage: $0 [--bucket <bucketName>]')
    .option('bucket', {
        alias: 'b',
        describe: 'S3 bucket name',
        type: 'string',
    })
    .help()
    .argv;

(async () => {
    const bucketName = argv.bucket || process.env.S3_BUCKET;

    if (!bucketName) {
        exitWithError('No bucket name provided. Please specify a bucket using --bucket <bucketName> or set S3_BUCKET in the .env file.');
    }

    const files = getFilesInBucket(bucketName);

    files.forEach((file) => {
        console.log(file.Key);
    });
})();
