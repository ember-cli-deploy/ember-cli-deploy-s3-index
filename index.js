/* jshint node: true */
'use strict';
var path             = require('path');
var Promise          = require('ember-cli/lib/ext/promise');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var S3               = require('./lib/s3');
var syncExec         = require('sync-exec');

module.exports = {
  name: 'ember-cli-deploy-s3-index',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        filePattern: 'index.html',
        prefix: '',
        acl: 'public-read',
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
        s3DeployClient: function(/* context */) {
          return new S3({ plugin: this });
        },
        allowOverwrite: false,
        deployer: function(context) {
          return context.deployer || syncExec('git config --global user.name').stdout;
        }
      },

      requiredConfig: ['bucket', 'region'],

      upload: function(context) {
        var bucket         = this.readConfig('bucket');
        var prefix         = this.readConfig('prefix');
        var acl            = this.readConfig('acl');
        var revisionKey    = this.readConfig('revisionKey');
        var distDir        = this.readConfig('distDir');
        var filePattern    = this.readConfig('filePattern');
        var allowOverwrite = this.readConfig('allowOverwrite');
        var deployer       = this.readConfig('deployer');
        var filePath    = path.join(distDir, filePattern);

        var options = {
          bucket: bucket,
          prefix: prefix,
          acl: acl,
          filePattern: filePattern,
          filePath: filePath,
          revisionKey: revisionKey,
          allowOverwrite: allowOverwrite,
          deployer: deployer
        };

        this.log('preparing to upload revision to S3 bucket `' + bucket + '`', { verbose: true });

        var s3 = this.readConfig('s3DeployClient');
        return s3.upload(options);
      },

      activate: function(context) {
        var bucket      = this.readConfig('bucket');
        var prefix      = this.readConfig('prefix');
        var acl         = this.readConfig('acl');
        var revisionKey = this.readConfig('revisionKey');
        var deployer    = this.readConfig('deployer');
        var filePattern = this.readConfig('filePattern');

        var options = {
          bucket: bucket,
          prefix: prefix,
          acl: acl,
          filePattern: filePattern,
          revisionKey: revisionKey,
          deployer: deployer
        };

        this.log('preparing to activate `' + revisionKey + '`', { verbose: true });

        var s3 = this.readConfig('s3DeployClient');
        return s3.activate(options);
      },

      fetchRevisions: function(context) {
        return this._list(context)
          .then(function(revisions) {
            return {
              revisions: revisions
            };
          });
      },

      fetchInitialRevisions: function(context) {
        return this._list(context)
          .then(function(revisions) {
            return {
              initialRevisions: revisions
            };
          });
      },

      _list: function(/* context */) {
        var bucket      = this.readConfig('bucket');
        var prefix      = this.readConfig('prefix');
        var filePattern = this.readConfig('filePattern');

        var options = {
          bucket: bucket,
          prefix: prefix,
          filePattern: filePattern,
        };

        var s3 = this.readConfig('s3DeployClient');
        return s3.fetchRevisions(options);
      }
    });

    return new DeployPlugin();
  }
};
