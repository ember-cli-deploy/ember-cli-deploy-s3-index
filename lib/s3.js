'use strict';

var AWS             = require('aws-sdk');
var CoreObject      = require('core-object');
var RSVP            = require('rsvp');
var fs              = require('fs');
var readFile        = RSVP.denodeify(fs.readFile);
var mime            = require('mime-types');
var joinUriSegments = require('./util/join-uri-segments');

function headObject(client, params) {
  return new RSVP.Promise(function(resolve, reject) {
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
    this._super();
    var plugin = options.plugin;
    var config = plugin.pluginConfig;
    var profile = plugin.readConfig('profile');
    var endpoint = plugin.readConfig('endpoint');

    this._plugin = plugin;

    if (profile && !this._plugin.readConfig('s3Client')) {
      this._plugin.log('Using AWS profile from config', { verbose: true });
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: profile });
    }

    if (endpoint) {
      this._plugin.log('Using endpoint from config', { verbose: true });
      AWS.config.endpoint = new AWS.Endpoint(endpoint);
    }

    this._client = plugin.readConfig('s3Client') || new AWS.S3(config);
  },

  upload: function(options) {
    var client                    = this._client;
    var plugin                    = this._plugin;
    var bucket                    = options.bucket;
    var acl                       = options.acl;
    var cacheControl              = options.cacheControl;
    var allowOverwrite            = options.allowOverwrite;
    var key                       = options.filePattern + ":" + options.revisionKey;
    var revisionKey               = joinUriSegments(options.prefix, key);
    var putObject                 = RSVP.denodeify(client.putObject.bind(client));
    var gzippedFilePaths          = options.gzippedFilePaths || [];
    var brotliCompressedFilePaths = options.brotliCompressedFilePaths || [];
    var isGzipped                 = gzippedFilePaths.indexOf(options.filePattern) !== -1;
    var isBrotliCompressed        = brotliCompressedFilePaths.indexOf(options.filePattern) !== -1;
    var serverSideEncryption      = options.serverSideEncryption;

    var params = {
      Bucket: bucket,
      Key: revisionKey,
      ACL: acl,
      ContentType: mime.lookup(options.filePath) || 'text/html',
      CacheControl: cacheControl
    };

    if (serverSideEncryption) {
      params.ServerSideEncryption = serverSideEncryption;
    }

    if (isGzipped) {
      params.ContentEncoding = 'gzip';
    }

    if (isBrotliCompressed) {
      params.ContentEncoding = 'br';
    }

    return this.fetchRevisions(options)
      .then(function(revisions) {
        var found = revisions.map(function(element) { return element.revision; }).indexOf(options.revisionKey);
        if (found >= 0 && !allowOverwrite) {
          return RSVP.reject("REVISION ALREADY UPLOADED! (set `allowOverwrite: true` if you want to support overwriting revisions)");
        }
        return RSVP.resolve();
      })
      .then(readFile.bind(this, options.filePath))
      .then(function(fileContents) {
        params.Body = fileContents;
        return putObject(params).then(function() {
          plugin.log('✔  ' + revisionKey, { verbose: true });
        });
    });
  },

  activate: function(options) {
    var plugin                = this._plugin;
    var client                = this._client;
    var bucket                = options.bucket;
    var acl                   = options.acl;
    var prefix                = options.prefix;
    var filePattern           = options.filePattern;
    var key                   = filePattern + ":" + options.revisionKey;
    var serverSideEncryption  = options.serverSideEncryption;
    var urlEncodeSourceObject = options.urlEncodeSourceObject;

    var revisionKey           = joinUriSegments(prefix, key);
    var indexKey              = joinUriSegments(prefix, filePattern);
    var copyObject            = RSVP.denodeify(client.copyObject.bind(client));

    var params = {
      Bucket: bucket,
      Key: indexKey,
      ACL: acl,
    };

    if (urlEncodeSourceObject) {
        params.CopySource = encodeURIComponent([bucket, revisionKey].join('/'));
    } else {
        params.CopySource = `${bucket}/${revisionKey}`
    }

    if (serverSideEncryption) {
      params.ServerSideEncryption = serverSideEncryption;
    }

    return this.fetchRevisions(options).then(function(revisions) {
      var found = revisions.map(function(element) { return element.revision; }).indexOf(options.revisionKey);
      if (found >= 0) {
        return copyObject(params).then(function() {
          plugin.log('✔  ' + revisionKey + " => " + indexKey);
        });
      } else {
        return RSVP.reject("REVISION NOT FOUND!"); // see how we should handle a pipeline failure
      }
    });
  },

  fetchRevisions: function(options) {
    var client         = this._client;
    var bucket         = options.bucket;
    var prefix         = options.prefix;
    var revisionPrefix = joinUriSegments(prefix, options.filePattern + ":");
    var indexKey       = joinUriSegments(prefix, options.filePattern);

    return RSVP.hash({
      revisions: this.listAllObjects({ Bucket: bucket, Prefix: revisionPrefix }),
      current: headObject(client, { Bucket: bucket, Key: indexKey }),
    })
    .then(function(data) {
      return data.revisions.sort(function(a, b) {
        return new Date(b.LastModified) - new Date(a.LastModified);
      }).map(function(d) {
        var revision = d.Key.substr(revisionPrefix.length);
        var active = data.current && d.ETag === data.current.ETag;
        return { revision: revision, timestamp: d.LastModified, active: active };
      });
    });
  },

  listAllObjects: function(options) {
    var client         = this._client;
    var listObjects    = RSVP.denodeify(client.listObjects.bind(client));
    var allRevisions   = [];

    function listObjectRecursively(options) {
      return listObjects(options).then(function(response) {
        [].push.apply(allRevisions, response.Contents);

        if (response.IsTruncated) {
          var nextMarker = response.Contents[response.Contents.length - 1].Key;
          options.Marker = nextMarker;
          return listObjectRecursively(options);
        } else {
          return allRevisions;
        }
      });
    }

    return listObjectRecursively(options);

  }
});
