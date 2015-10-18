/* jshint node: true */
'use strict';
var path             = require('path');
var Promise          = require('ember-cli/lib/ext/promise');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var S3               = require('./lib/s3');

module.exports = {
  name: 'ember-cli-deploy-s3-index',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        region: 'us-east-1',
        filePattern: 'index.html',
        prefix: '',
        distDir: function(context) {
          return context.distDir;
        },
        revisionKey: function(context) {
          var revisionKey = context.revisionData && context.revisionData.revisionKey;
          return context.commandOptions.revision || revisionKey;
        },
        s3Client: function(context) {
          return context.s3Client; // if you want to provide your own S3 client to be used instead of one from aws-sdk
        },
        allowOverwrite: false
      },
      requiredConfig: ['accessKeyId', 'secretAccessKey', 'bucket'],

      upload: function(context) {
        var bucket         = this.readConfig('bucket');
        var prefix         = this.readConfig('prefix');
        var revisionKey    = this.readConfig('revisionKey');
        var distDir        = this.readConfig('distDir');
        var filePattern    = this.readConfig('filePattern');
        var allowOverwrite = this.readConfig('allowOverwrite');
        var filePath    = path.join(distDir, filePattern);

        var options = {
          bucket: bucket,
          prefix: prefix,
          filePattern: filePattern,
          filePath: filePath,
          revisionKey: revisionKey,
          allowOverwrite: allowOverwrite
        };

        this.log('preparing to upload revision to S3 bucket `' + bucket + '`');

        var s3 = new S3({ plugin: this });
        return s3.upload(options);
      },

      activate: function(context) {
        var bucket      = this.readConfig('bucket');
        var prefix      = this.readConfig('prefix');
        var revisionKey = this.readConfig('revisionKey');
        var filePattern = this.readConfig('filePattern');

        var options = {
          bucket: bucket,
          prefix: prefix,
          filePattern: filePattern,
          revisionKey: revisionKey,
        };

        this.log('preparing to activate `' + revisionKey + '`');

        var s3 = new S3({ plugin: this });
        return s3.activate(options);
      },

      fetchRevisions: function(context) {
        var bucket      = this.readConfig('bucket');
        var prefix      = this.readConfig('prefix');
        var filePattern = this.readConfig('filePattern');

        var options = {
          bucket: bucket,
          prefix: prefix,
          filePattern: filePattern,
        };

        var s3 = new S3({ plugin: this });
        return s3.fetchRevisions(options)
          .then(function(revisions) {
            context.revisions = revisions;
          });
      },
    });

    return new DeployPlugin();
  }
};
