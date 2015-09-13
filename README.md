# ember-cli-deploy-s3-index

> An ember-cli-deploy plugin to deploy ember-cli's bootstrap index file to [S3](https://aws.amazon.com/de/s3).

<hr/>
**WARNING: This plugin is only compatible with ember-cli-deploy versions >= 0.5.0**
<hr/>

This plugin uploads a file, presumably index.html, to a specified S3-bucket.

More often than not this plugin will be used in conjunction with the [lightning method of deployment][1] where the ember application assets will be served from S3 and the index.html file will also be served from S3.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][2].

## Quick Start
To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][4] is installed and configured.
- Ensure [ember-cli-deploy-revision-key][6] is installed and configured.
- Ensure [ember-cli-deploy-display-revisions](https://github.com/duizendnegen/ember-cli-deploy-display-revisions) is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-s3-index
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV['s3-index'] {
  accessKeyId: '<your-access-key>',
  secretAccessKey: '<your-secret>',
  bucket: '<your-bucket-name>'
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

### region

The region your bucket is located in.

*Default:* `'us-east-1'`

### currentRevisionIdentifier

To be able to display an indicator in the revisions list that points to the current active revision this plugin uploads a json file that identifies the currently deployed revision to your bucket. You can change the file-name of this file with this option.

*Default:* `'current.json'`

### filePattern

A file matching this pattern will be uploaded to S3.

*Default:* `'index.html'`

### distDir

The root directory where the file matching `filePattern` will be searched for. By default, this option will use the `distDir` property of the deployment context.

*Default:* `context.distDir`

### keyPrefix

The prefix to be used for the key under which file will be uploaded to S3. The key will be a combination of the `keyPrefix` and the `revisionKey`. By default this option will use the `project.name()` property from the deployment context.

*Default:* `context.project.name() + ':index'`

### revisionKey

The unique revision number for the version of the file being uploaded to S3. The key will be a combination of the `keyPrefix` and the `revisionKey`. By default this option will use either the `revisionKey` passed in from the command line or the `revisionKey` property from the deployment context.

*Default:* `context.commandLineArgs.revisionKey || context.revisionKey`

### How do I activate a revision?

A user can activate a revision by either:

- Passing a command line argument to the `deploy` command:

```bash
$ ember deploy --activate=true
```

- Running the `deploy:activate` command:

```bash
$ ember deploy:activate <revision-key>
```

- Setting the `activateOnDeploy` flag in `deploy.js`

```javascript
ENV.pipeline {
  activateOnDeploy: true
}
```

### What does activation do?

When *ember-cli-deploy-s3-index* uploads a file to S3, it uploads it under the key defined by a combination of the two config properties `keyPrefix` and `revisionKey`.

So, if the `keyPrefix` was configured to be `deploy-test:index` and there had been a few revisons deployed, then your bucket might look something like this:

![s3-index-bucket](http://i.imgur.com/wmiaYyK.png)

Activating a revision would copy the content of the passed revision to `index.html` which is used to host your ember application via the [static web hosting](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html) feature built into S3.

```bash
$ ember deploy:activate --revision deploy-test:index:18613f3a225d29ec065240a1499f8545
```

### When does activation occur?

Activation occurs during the `activate` hook of the pipeline. By default, activation is turned off and must be explicitly enabled by one of the 3 methods above.

## Prerequisites

The following properties are expected to be present on the deployment `context` object:

- `distDir`                     (provided by [ember-cli-deploy-build][4])
- `project.name()`              (provided by [ember-cli-deploy][5])
- `revisionKey`                 (provided by [ember-cli-deploy-revision-key][6])
- `commandLineArgs.revisionKey` (provided by [ember-cli-deploy][5])
- `deployEnvironment`           (provided by [ember-cli-deploy][5])

# Using History-Location
You can deploy your Ember application to S3 and still use the history-api for pretty URLs. This needs some configuration tweaking in your bucket's static-website-hosting options in the AWS console though. You can use S3's `Redirection Rules`-feature to redirect user's to the correct route based on the URL they are requesting from your app:

```
<RoutingRules>
    <RoutingRule>
        <Condition>
            <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals>
        </Condition>
        <Redirect>
            <HostName><your-bucket-endpoint-from-static-website-hosting-options></HostName>
            <ReplaceKeyPrefixWith>#/</ReplaceKeyPrefixWith>
        </Redirect>
    </RoutingRule>
</RoutingRules>
```

## Running Tests

- `npm test`

[1]: https://github.com/lukemelia/ember-cli-deploy-lightning-pack "ember-cli-deploy-lightning-pack"
[2]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[3]: https://www.npmjs.com/package/redis "Redis Client"
[4]: https://github.com/zapnito/ember-cli-deploy-build "ember-cli-deploy-build"
[5]: https://github.com/ember-cli/ember-cli-deploy "ember-cli-deploy"
[6]: https://github.com/zapnito/ember-cli-deploy-revision-key "ember-cli-deploy-revision-key"
