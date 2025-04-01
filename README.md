# S3Jet Project

The command-line script to upload files to an S3-compatible storage service. 
It leverages the AWS SDK for JavaScript to interact with the storage service and 
provides a seamless way to transfer files securely and efficiently.

This script allows users to specify the file path, target S3 bucket, and optional key name for the uploaded file. 
Additionally, it dynamically determines the content type of the file being uploaded for proper handling on the server-side.

By utilizing environment variables stored in a `.env` file, 
`s3jet` ensures secure access to the S3 service by validating the necessary credentials before initiating the file upload process.

## Usage

```bash
$ ./cpToS3.js --file <filePath> --bucket <bucketName> [--key <keyName]
$ ./cpToS3.js --dir <directoryPath> --bucket <bucketName> [--key <keyName>]
```

The bucket argument is optional, and if not provided via the command line, it defaults to the value stored in the S3_BUCKET environment variable.
