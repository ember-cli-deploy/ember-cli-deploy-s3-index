# ember-cli-deploy-s3-index [![Build Status](https://travis-ci.org/ember-cli-deploy/ember-cli-deploy-s3-index.svg?branch=master)](https://travis-ci.org/ember-cli-deploy/ember-cli-deploy-s3-index) [![Build status](https://ci.appveyor.com/api/projects/status/iogkx02goxx6jsf3/branch/master?svg=true)](https://ci.appveyor.com/project/LevelbossMike/ember-cli-deploy-s3-index/branch/master)


> An ember-cli-deploy plugin to deploy ember-cli's bootstrap index file to [S3](https://aws.amazon.com/de/s3).

[![](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-cli-deploy-s3-index.svg)](http://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/)

This plugin uploads a file, presumably index.html, to a specified S3-bucket.

More often than not this plugin will be used in conjunction with the [lightning method of deployment][1] where the ember application assets will be served from S3 and the index.html file will also be served from S3.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][2].

## Quick Start
To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][4] is installed and configured.
- Ensure [ember-cli-deploy-revision-data][6] is installed and configured.
- Ensure [ember-cli-deploy-display-revisions](https://github.com/duizendnegen/ember-cli-deploy-display-revisions) is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-s3-index
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV['s3-index'] = {
  accessKeyId: '<your-access-key>',
  secretAccessKey: '<your-secret>',
  bucket: '<your-bucket-name>',
  region: '<your-bucket-region>'
}
```

- Run the pipeline

```bash
$ ember deploy
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][2].

- `configure`
- `upload`
- `activate`
- `fetchRevisions`

## Configuration Options


For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][2].


<hr/>
**WARNING: Don't share a configuration object between [ember-cli-deploy-s3](https://github.com/ember-cli-deploy/ember-cli-deploy-s3) and this plugin. The way these two plugins read their configuration has sideeffects which will unfortunately break your deploy if you share one configuration object between the two** (we are already working on a fix)
<hr/>

### accessKeyId

The AWS access key for the user that has the ability to upload to the `bucket`. If this is left undefined, the normal [AWS SDK credential resolution][7] will take place.

*Default:* `undefined`

### secretAccessKey

The AWS secret for the user that has the ability to upload to the `bucket`. This must be defined when `accessKeyId` is defined.

*Default:* `undefined`

### bucket (`required`)

The AWS bucket that the files will be uploaded to.

*Default:* `undefined`

### region (`required`)

The region your bucket is located in. (e.g. set this to `eu-west-1` if your bucket is located in the 'Ireland' region)

*Default:* `undefined`

### prefix

A directory within the `bucket` that the files should be uploaded in to.

*Default:* `''`

### filePattern

A file matching this pattern will be uploaded to S3. The active key in S3 will be a combination of the `bucket`, `prefix`, `filePattern`. The versioned keys will have `revisionKey` appended.

*Default:* `'index.html'`

### acl

The ACL to apply to the objects.

*Default:* `'public-read'`

### cacheControl

Sets the `Cache-Control` header on uploaded files.

*Default:* `'max-age=0, no-cache'`

### distDir

The root directory where the file matching `filePattern` will be searched for. By default, this option will use the `distDir` property of the deployment context.

*Default:* `context.distDir`

### revisionKey

The unique revision number for the version of the file being uploaded to S3. The key will be a combination of the `keyPrefix` and the `revisionKey`. By default this option will use either the `revision` passed in from the command line or the `revisionData.revisionKey` property from the deployment context.

*Default:* `context.commandOptions.revision || context.revisionData.revisionKey`

### allowOverwrite

A flag to specify whether the revision should be overwritten if it already exists in S3.

*Default:* `false`

### s3Client

The underlying S3 library used to upload the files to S3. This allows the user to use the default upload client provided by this plugin but switch out the underlying library that is used to actually send the files.

The client specified MUST implement functions called `getObject` and `putObject`.

*Default:* the default S3 library is `aws-sdk`

### serverSideEncryption

The Server-side encryption algorithm used when storing this object in S3 (e.g., AES256, aws:kms). Possible values include:
  - "AES256"
  - "aws:kms"

### How do I activate a revision?

A user can activate a revision by either:

- Passing a command line argument to the `deploy` command:

```bash
$ ember deploy --activate=true
```

- Running the `deploy:activate` command:

```bash
$ ember deploy:activate --revision <revision-key>
```

- Setting the `activateOnDeploy` flag in `deploy.js`

```javascript
ENV.pipeline = {
  activateOnDeploy: true
}
```

### What does activation do?

When *ember-cli-deploy-s3-index* uploads a file to S3, it uploads it under the key defined by a combination of the four config properties `bucket`, `prefix`, `filePattern` and `revisionKey`.

So, if the `filePattern` was configured to be `index.html` and there had been a few revisons deployed, then your bucket might look something like this:

```bash
$ aws s3 ls s3://<bucket>/
                           PRE assets/
2015-09-27 07:25:26        585 crossdomain.xml
2015-09-27 07:47:42       1207 index.html
2015-09-27 07:25:51       1207 index.html:a644ba43cdb987288d646c5a97b1c8a9
2015-09-27 07:20:27       1207 index.html:61cfff627b79058277e604686197bbbd
2015-09-27 07:19:11       1207 index.html:9dd26dbc8f3f9a8a342d067335315a63
```

Activating a revision would copy the content of the passed revision to `index.html` which is used to host your ember application via the [static web hosting](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html) feature built into S3.

```bash
$ ember deploy:activate --revision a644ba43cdb987288d646c5a97b1c8a9
```

### When does activation occur?

Activation occurs during the `activate` hook of the pipeline. By default, activation is turned off and must be explicitly enabled by one of the 3 methods above.

## Prerequisites

The following properties are expected to be present on the deployment `context` object:

- `distDir`                     (provided by [ember-cli-deploy-build][4])
- `project.name()`              (provided by [ember-cli-deploy][5])
- `revisionKey`                 (provided by [ember-cli-deploy-revision-data][6])
- `commandLineArgs.revisionKey` (provided by [ember-cli-deploy][5])
- `deployEnvironment`           (provided by [ember-cli-deploy][5])

# Configuring Amazon S3

## Minimum S3 Permissions

This plugin requires the following permissions on your Amazon S3 access policy:

  * For the bucket:
    * s3:ListBucket
  * For the files on the bucket:
    * s3:GetObject
    * s3:PutObject
    * s3:PutObjectACL

The following is an example policy that meets these requirements:

    {
        "Statement": [
            {
                "Sid": "Stmt1EmberCLIS3IndexDeployPolicy",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:PutObjectACL",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::<your-bucket-name>",
                    "arn:aws:s3:::<your-bucket-name>/*"
                ]
            }
        ]
    }


## Using History-Location
You can deploy your Ember application to S3 and still use the history-api for pretty URLs. This needs some configuration and the exact process depends on whether or not you are using Cloudfront to serve cached content from your S3 bucket or if you are serving from an S3 bucket directly using S3's Static Website Hosting option. Both options work, however, the Cloudfront method allows the process to occur without flashing a non-pretty URL in the browser before the application loads.

### With Cloudfront
A Cloudfront Custom Error Response can handle catching the 404 error that occurs when a request is made to a pretty URL and can allow that request to be handled by index.html and in turn Ember.

A Custom Error Response can be created for your CloudFront distrubution in the AWS console by navigating to:

Cloudfront > `Distribution ID` > Error Pages > Create Custom Error Response.

You will want to use the following values.

  * HTTP Error Code: `404: Not Found`
  * Customized Error Response: `Yes`
  * Response Page Path: `/index.html`
  * HTTP Response Code: `200: OK`

### Without Cloudfront

From within the Static Website Hosting options for your S3 bucket, you can use S3's `Redirection Rules`-feature to redirect user's to the correct route based on the URL they are requesting from your app:

```
<RoutingRules>
    <RoutingRule>
        <Condition>
            <HttpErrorCodeReturnedEquals>403</HttpErrorCodeReturnedEquals>
        </Condition>
        <Redirect>
            <HostName><your-bucket-endpoint-from-static-website-hosting-options></HostName>
            <ReplaceKeyPrefixWith>#/</ReplaceKeyPrefixWith>
        </Redirect>
    </RoutingRule>
</RoutingRules>
```

## Previewing Revisions
If you'd like to be able to preview a deployed revision before activation, you'll need some additional setup. See [this article](http://blog.firstiwaslike.com/previewing-revisions-with-ember-cli-deploy-s3-index/) for more information.

## Running Tests

- `npm test`

[1]: https://github.com/lukemelia/ember-cli-deploy-lightning-pack "ember-cli-deploy-lightning-pack"
[2]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[3]: https://www.npmjs.com/package/redis "Redis Client"
[4]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[5]: https://github.com/ember-cli/ember-cli-deploy "ember-cli-deploy"
[6]: https://github.com/ember-cli-deploy/ember-cli-deploy-revision-data "ember-cli-deploy-revision-data"
[7]: https://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials "Setting AWS Credentials"
