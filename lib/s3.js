var AWS        = require('aws-sdk');
var CoreObject = require('core-object');
var Promise    = require('ember-cli/lib/ext/promise');
var fs         = require('fs');
var path       = require('path');
var readFile   = Promise.denodeify(fs.readFile);

var headObject = function(client, params) {
  return new Promise(function(resolve, reject) {
    client.headObject(params, function(err, data) {
      if (err && err.code === 'NotFound') {
        return resolve();
      }
      else if (err) {
        return reject(err);
      }
      else {
        return resolve(data);
      }
    });
  });
}

module.exports = CoreObject.extend({
  init: function(options) {
    var plugin = options.plugin;
    var config = plugin.pluginConfig;

    this._plugin = plugin;
    this._client = plugin.readConfig('s3Client') || new AWS.S3(config);
  },

  upload: function(options) {
    var client         = this._client;
    var plugin         = this._plugin;
    var bucket         = options.bucket;
    var acl            = options.acl || 'public-read';
    var allowOverwrite = options.allowOverwrite;
    var key            = path.join(options.prefix, options.filePattern + ":" + options.revisionKey);
    var putObject      = Promise.denodeify(client.putObject.bind(client));

    var params = {
      Bucket: bucket,
      Key: key,
      ACL: acl,
      ContentType: 'text/html',
      CacheControl: 'max-age=0, public',
      Metadata: {
        "surrogate-control": 'max-age=3600',
        "surrogate-key": 'index'
      }
    };

    return this.fetchRevisions(options)
      .then(function(revisions) {
        var found = revisions.map(function(element) { return element.revision; }).indexOf(options.revisionKey);
        if (found >= 0 && !allowOverwrite) {
          return Promise.reject("REVISION ALREADY UPLOADED! (set `allowOverwrite: true` if you want to support overwriting revisions)")
        }
        return Promise.resolve();
      })
      .then(readFile.bind(this, options.filePath))
      .then(function(fileContents) {
        params.Body = fileContents;
        return putObject(params).then(function() {
          plugin.log('✔  ' + key);
        });
    });
  },

  activate: function(options) {
    var plugin      = this._plugin;
    var client      = this._client;
    var bucket      = options.bucket;
    var acl         = options.acl || 'public-read';
    var revisionKey = path.join(options.prefix, options.filePattern + ":" + options.revisionKey);
    var indexKey    = path.join(options.prefix, options.filePattern);
    var copySource  = encodeURIComponent(path.join(bucket, revisionKey));
    var copyObject  = Promise.denodeify(client.copyObject.bind(client));

    var params = {
      Bucket: bucket,
      CopySource: copySource,
      Key: indexKey,
      ACL: acl,
    };

    return this.fetchRevisions(options).then(function(revisions) {
      var found = revisions.map(function(element) { return element.revision; }).indexOf(options.revisionKey);
      if (found >= 0) {
        return copyObject(params).then(function() {
          plugin.log('✔  ' + revisionKey + " => " + indexKey);
        })
      } else {
        return Promise.reject("REVISION NOT FOUND!"); // see how we should handle a pipeline failure
      }
    });
  },

  fetchRevisions: function(options) {
    var client         = this._client;
    var bucket         = options.bucket;
    var revisionPrefix = path.join(options.prefix, options.filePattern + ":");
    var indexKey       = path.join(options.prefix, options.filePattern);
    var listObjects    = Promise.denodeify(client.listObjects.bind(client));

    return Promise.hash({
      revisions: listObjects({ Bucket: bucket, Prefix: revisionPrefix }),
      current: headObject(client, { Bucket: bucket, Key: indexKey }),
    })
    .then(function(data) {
      return data.revisions.Contents.sort(function(a, b) {
        return new Date(b.LastModified) - new Date(a.LastModified);
      }).map(function(d) {
        var revision = d.Key.substr(revisionPrefix.length);
        var active = data.current && d.ETag === data.current.ETag;
        return { revision: revision, timestamp: d.LastModified, active: active };
      });
    });
  },
});
