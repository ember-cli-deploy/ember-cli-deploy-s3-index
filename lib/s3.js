'use strict';

var { fromIni } = require('@aws-sdk/credential-providers');
var { S3 } = require('@aws-sdk/client-s3');
var CoreObject      = require('core-object');
var RSVP            = require('rsvp');
var fs              = require('fs');
var readFile        = RSVP.denodeify(fs.readFile);
var mime            = require('mime-types');
var joinUriSegments = require('./util/join-uri-segments');

async function headObject(client, params) {
  try {
    return await client.headObject(params);
  } catch (err) {
    if (err.name === 'NotFound') {
      return;
    }
    throw err;
  }
}

module.exports = CoreObject.extend({
  init: function(options) {
    this._super();
    var plugin = options.plugin;
    var config = plugin.pluginConfig;
    var profile = plugin.readConfig('profile');
    var endpoint = plugin.readConfig('endpoint');
    var credentials;

    this._plugin = plugin;

    var providedS3Client = plugin.readConfig("s3Client");


    if (profile && !providedS3Client) {
      this._plugin.log("Using AWS profile from config", { verbose: true });
      credentials = fromIni({ profile: profile });
    }

    if (endpoint) {
      this._plugin.log('Using endpoint from config', { verbose: true });
    }

    this._client = providedS3Client || new S3(config);

    if (endpoint) {
      this._client.config.endpoint = endpoint;
    }
    if (credentials) {
      this._client.config.credentials = credentials;
    }

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
    var checkForOverwrite         = RSVP.resolve();

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

    if (!allowOverwrite) {
      checkForOverwrite = this.findRevision(options)
        .then(function(found) {
          if (found !== undefined) {
            return RSVP.reject("REVISION ALREADY UPLOADED! (set `allowOverwrite: true` if you want to support overwriting revisions)");
          }
          return RSVP.resolve();
        })
    }

    return checkForOverwrite
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

    return this.findRevision(options).then(function(found) {
      if (found !== undefined) {
        return copyObject(params).then(function() {
          plugin.log('✔  ' + revisionKey + " => " + indexKey);
        });
      } else {
        return RSVP.reject("REVISION NOT FOUND!"); // see how we should handle a pipeline failure
      }
    });
  },

  findRevision: function(options) {
    var client         = this._client;
    var listObjects    = RSVP.denodeify(client.listObjects.bind(client));
    var bucket         = options.bucket;
    var prefix         = options.prefix;
    var revisionPrefix = joinUriSegments(prefix, options.filePattern + ":" + options.revisionKey);

    return listObjects({ Bucket: bucket, Prefix: revisionPrefix })
      .then((response) => response.Contents?.find((element) => element.Key === revisionPrefix));
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
