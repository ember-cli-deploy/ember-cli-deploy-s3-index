var AWS        = require('aws-sdk');
var CoreObject = require('core-object');
var Promise    = require('ember-cli/lib/ext/promise');

module.exports = CoreObject.extend({
  init: function(options) {
    var plugin = options.plugin;
    var config = plugin.pluginConfig;
    var readConfig = plugin.readConfig;

    this._client                    = plugin.readConfig('s3Client') || new AWS.S3(config);
    this._bucket                    = plugin.readConfig('bucket');
    this._keyPrefix                 = plugin.readConfig('keyPrefix');
    this._filePattern               = plugin.readConfig('filePattern');
    this._currentRevisionIdentifier = plugin.readConfig('currentRevisionIdentifier');
  },

  fetchRevisions: function() {
    return Promise.hash({
      revisions: this._getBucketContents(),
      current: this._getCurrentData()
    })
    .then(this._createRevisionDataFromList.bind(this));
  },

  upload: function(key, fileContent) {
    var client = this._client;

    var params = {
      Bucket: this._bucket,
      Key: key,
      Body: fileContent,
      ContentType: 'text/html',
      CacheControl: 'max-age=0, no-cache'
    }

    return new Promise(function(resolve, reject) {
      client.putObject(params, function(err, data) {
        if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  },

  overwriteCurrentIndex: function(newRevisionKey) {
    var client     = this._client;
    var bucket     = this._bucket;
    var copySource = encodeURIComponent(bucket+'/'+newRevisionKey);

    var params = {
      Bucket: bucket,
      CopySource: copySource,
      Key: this._filePattern
    };

    return new Promise(function(resolve, reject) {
      client.copyObject(params, function(err, data) {
        if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  },

  _removeKeyPrefix: function(key) {
    const keyPrefix = this._keyPrefix;
    if (key.indexOf(keyPrefix + ":") === 0) {
      key = key.substr(keyPrefix.length+1);
    }
    return key;
  },

  _createRevisionDataFromList: function(data) {
    const revisionsData   = this._sortBucketContents(data.revisions).Contents;
    const currentRevision = data.current;

    return revisionsData.map(function(d) {
      var revision = this._removeKeyPrefix(d.Key);
      return { revision: revision, timestamp: d.LastModified, active: revision === currentRevision };
    }.bind(this));
  },

  _sortBucketContents: function(data) {
    data.Contents = data.Contents.sort(function(a, b) {
          return new Date(b.LastModified) - new Date(a.LastModified);
        });
    return data;
  },

  _getBucketContents: function() {
    var client    = this._client;
    var keyPrefix = this._keyPrefix;
    var bucket    = this._bucket;

    return new Promise(function(resolve, reject) {
      var params = { Bucket: bucket, Prefix: keyPrefix };

      client.listObjects(params, function(err, data) {
        if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  },

  _getCurrentData: function() {
    var client                    = this._client;
    var bucket                    = this._bucket;
    var currentRevisionIdentifier = this._currentRevisionIdentifier;

    return new Promise(function(resolve, reject) {
      var params = { Bucket: bucket, Key: currentRevisionIdentifier };

      client.getObject(params, function(err, data) {
        if (err && err.code === 'NoSuchKey') {
          return resolve();
        }
        else if (err) {
          return reject(err);
        }
        else {
          var json = JSON.parse(data.Body.toString('utf8'));
          return resolve(json.revision);
        }
      });
    });
  }
});
