/* jshint node: true */
'use strict';
var DeployPluginBase = require('ember-cli-deploy-plugin');
var S3               = require('./lib/s3');
var joinUriSegments  = require('./lib/util/join-uri-segments');

module.exports = {
  name: 'ember-cli-deploy-s3-index',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      S3: options.S3 || S3,

      defaultConfig: {
        filePattern: 'index.html',
        prefix: '',
        acl: 'public-read',
        cacheControl: 'max-age=0, no-cache',
        urlEncodeSourceObject: true,
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
        gzippedFiles: function(context) {
          return context.gzippedFiles || [];
        },
        brotliCompressedFiles: function(context) {
          return context.brotliCompressedFiles || [];
        },
        allowOverwrite: false
      },

      requiredConfig: ['bucket', 'region'],

      upload: function(/* context */) {
        var bucket                = this.readConfig('bucket');
        var prefix                = this.readConfig('prefix');
        var acl                   = this.readConfig('acl');
        var cacheControl          = this.readConfig('cacheControl');
        var revisionKey           = this.readConfig('revisionKey');
        var distDir               = this.readConfig('distDir');
        var filePattern           = this.readConfig('filePattern');
        var gzippedFiles          = this.readConfig('gzippedFiles');
        var brotliCompressedFiles = this.readConfig('brotliCompressedFiles');
        var allowOverwrite        = this.readConfig('allowOverwrite');
        var serverSideEncryption  = this.readConfig('serverSideEncryption');
        var urlEncodeSourceObject = this.readConfig('urlEncodeSourceObject');
        var filePath              = joinUriSegments(distDir, filePattern);

        var options = {
          bucket: bucket,
          prefix: prefix,
          acl: acl,
          cacheControl: cacheControl,
          filePattern: filePattern,
          filePath: filePath,
          revisionKey: revisionKey,
          gzippedFilePaths: gzippedFiles,
          brotliCompressedFilePaths: brotliCompressedFiles,
          allowOverwrite: allowOverwrite,
          urlEncodeSourceObject: urlEncodeSourceObject
        };

        if (serverSideEncryption) {
          options.serverSideEncryption = serverSideEncryption;
        }

        this.log('preparing to upload revision to S3 bucket `' + bucket + '`', { verbose: true });

        var s3 = new this.S3({ plugin: this });
        return s3.upload(options);
      },

      activate: function(/* context */) {
        var bucket                = this.readConfig('bucket');
        var prefix                = this.readConfig('prefix');
        var acl                   = this.readConfig('acl');
        var revisionKey           = this.readConfig('revisionKey');
        var filePattern           = this.readConfig('filePattern');
        var serverSideEncryption  = this.readConfig('serverSideEncryption');

        var options = {
          bucket: bucket,
          prefix: prefix,
          acl: acl,
          filePattern: filePattern,
          revisionKey: revisionKey,
        };

        if (serverSideEncryption) {
          options.serverSideEncryption = serverSideEncryption;
        }

        this.log('preparing to activate `' + revisionKey + '`', { verbose: true });

        var s3 = new this.S3({ plugin: this });
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

        var s3 = new this.S3({ plugin: this });
        return s3.fetchRevisions(options);
      }
    });

    return new DeployPlugin();
  }
};
