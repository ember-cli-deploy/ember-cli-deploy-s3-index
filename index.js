/* jshint node: true */
'use strict';
var path             = require('path');
var fs               = require('fs');
var Promise          = require('ember-cli/lib/ext/promise');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var S3               = require('./lib/s3');

var readFile  = Promise.denodeify(fs.readFile);

module.exports = {
  name: 'ember-cli-deploy-s3-index',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        region: 'us-east-1',
        filePattern: 'index.html',
        currentRevisionIdentifier: "current.json",
        distDir: function(context) {
          return context.distDir;
        },
        keyPrefix: function(context) {
          return context.project.name() + ':index';
        },
        revisionKey: function(context) {
          return context.commandOptions.revision || context.revisionKey;
        }
      },
      requiredConfig: ['accessKeyId', 'secretAccessKey', 'bucket'],

      upload: function(context) {
        var distDir        = this.readConfig('distDir');
        var filePattern    = this.readConfig('filePattern');
        var indexUploadKey = this._buildIndexUploadKey();
        var filePath       = path.join(distDir, filePattern);

        this.log('trying to upload index to S3! ' + indexUploadKey);
        var s3 = new S3({ plugin: this });

        return this._readFileContents(filePath)
          .then(s3.upload.bind(s3, indexUploadKey));
      },

      activate: function(context) {
        var revisionKey = this.readConfig('revisionKey');
        var keyPrefix   = this.readConfig('keyPrefix');

        if (revisionKey.indexOf(keyPrefix) === -1) {
          revisionKey = this._buildIndexUploadKey();
        }

        var availableRevisions = context.revisions.map(function(r) { return r.revision; });

        this.log('Activating revision `' + revisionKey + '`');

        if (availableRevisions.indexOf(revisionKey) > -1) {
          return this._overwriteCurrentIndex(revisionKey)
            .then(this._updateCurrentRevisionPointer.bind(this, revisionKey));
        } else {
          return Promise.reject("REVISION NOT FOUND!"); // see how we should handle a pipeline failure
        }

      },

      fetchRevisions: function(context) {
        var s3 = new S3({ plugin: this })

        return s3.fetchRevisions()
          .then(function(revisions) {
            return { revisions: revisions };
          });
        ;
      },

      _buildIndexUploadKey: function() {
        var keyPrefix   = this.readConfig('keyPrefix');
        var revisionKey = this.readConfig('revisionKey');

        return keyPrefix+':'+revisionKey;
      },

      _readFileContents: function(path) {
        return readFile(path)
          .then(function(buffer) {
            return buffer.toString();
          });
      },

      _updateCurrentRevisionPointer: function(newRevisionKey) {
        var s3                        = new S3({ plugin: this })
        var currentRevisionIdentifier = this.readConfig('currentRevisionIdentifier');

        return s3.upload(currentRevisionIdentifier, JSON.stringify({ revision: newRevisionKey }));
      },

      _overwriteCurrentIndex: function(newRevisionKey) {
        var s3     = new S3({ plugin: this });
        var bucket = this.readConfig('bucket');

        return s3.overwriteCurrentIndex(newRevisionKey, bucket);
      }
    });

    return new DeployPlugin();
  }
};
