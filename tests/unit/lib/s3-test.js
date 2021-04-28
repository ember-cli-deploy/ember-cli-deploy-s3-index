var assert = require('./../../helpers/assert');

describe('s3', function() {
  var S3, mockUi, s3Client, plugin, subject, options, listParams, headParams, copyParams, revisionsData, currentData;

  before(function() {
    S3 = require('../../../lib/s3');
  });

  beforeEach(function() {
    revisionsData = {
      Contents: [
        { Key: 'test.html:123', LastModified: new Date('September 27, 2015 01:00:00'), ETag: '123' },
        { Key: 'test.html:456', LastModified: new Date('September 27, 2015 02:00:00') , ETag: '456' }
      ]
    };

    currentData = { Key: 'test.html', lastModified: new Date('September 27, 2015 01:30:00'), ETag: '123' };

    s3Client = {
      putObject: function(params, cb) {
        cb();
      },

      listObjects: function(params, cb) {
        listParams = params;
        cb(undefined, revisionsData);
      },

      headObject: function(params, cb) {
        headParams = params;
        cb(undefined, currentData);
      },

      copyObject: function(params, cb) {
        copyParams = params;
        cb();
      }
    };
    mockUi = {
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
    plugin = {
      ui: mockUi,
      readConfig: function(propertyName) {
        if (propertyName === 's3Client') {
          return s3Client;
        }
      },
      log: function(message/*, opts */) {
        this.ui.write('|    ');
        this.ui.writeLine('- ' + message);
      }
    };
    subject = new S3({
      plugin: plugin
    });
  });

  describe('#upload', function() {
    var s3Params;
    var filePattern = 'test.html';
    var revisionKey = 'some-revision-key';
    var bucket      = 'some-bucket';

    beforeEach(function() {
      options = {
        bucket: bucket,
        prefix: '',
        acl: 'public-read',
        cacheControl: 'max-age=0, no-cache',
        gzippedFilePaths: [],
        filePattern: filePattern,
        revisionKey: revisionKey,
        filePath: 'tests/unit/fixtures/test.html',
        allowOverwrite: false,
        urlEncodeSourceObject: true
      };

      s3Client.putObject = function(params, cb) {
        s3Params = params;
        cb();
      };
    });

    it('resolves if upload succeeds', function() {
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          var expectLogOutput = '- ✔  '+filePattern+':'+revisionKey;

          assert.equal(mockUi.messages.length, 1, 'Logs one line');
          assert.equal(mockUi.messages[0], expectLogOutput, 'Upload log output correct');
        });
    });

    it('rejects if upload fails', function() {
      s3Client.putObject = function(params, cb) {
        cb('error uploading');
      };

      var promise = subject.upload(options);

      return assert.isRejected(promise);
    });

    it('passes expected parameters to the used s3-client', function() {

      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          var expectedKey = filePattern+':'+revisionKey;
          var defaultACL  = 'public-read';

          assert.equal(s3Params.Bucket, bucket, 'Bucket passed correctly');
          assert.equal(s3Params.Key, expectedKey, 'Key passed correctly');
          assert.equal(s3Params.ACL, defaultACL, 'ACL defaults to `public-read`');
          assert.equal(s3Params.ContentType, 'text/html', 'contentType is set to `text/html`');
          assert.equal(s3Params.CacheControl, 'max-age=0, no-cache', 'cacheControl set correctly');
        });
    });

    it('detects serverSideEncryption when defined', function() {
      options.serverSideEncryption = 'AES256';
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(s3Params.ServerSideEncryption, 'AES256', 'serverSideEncryption passed correctly');
        });
    });

    it('filters serverSideEncryption when not defined', function() {
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(s3Params.hasOwnProperty('serverSideEncryption'), false, 'serverSideEncryption filtered correctly');
        });
    });

    it('detects `filePattern` other than `index.html` in order to customize ContentType', function() {
      var filePath = 'tests/unit/fixtures/test.tar';

      options.filePath = filePath;
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          var expectedContentType = 'application/x-tar';
          assert.equal(s3Params.ContentType, expectedContentType, 'contentType is set to `application/x-tar');
        });
    });

    it('sets the Content-Encoding header to gzip when the index file is gzipped', function() {
      options.gzippedFilePaths = [filePattern];
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(s3Params.ContentEncoding, 'gzip', 'contentEncoding is set to gzip');
        });
    });

    it('sets the Content-Encoding header to br when the index file is brotli compressed', function() {
      options.brotliCompressedFilePaths = [filePattern];
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(s3Params.ContentEncoding, 'br', 'contentEncoding is set to br');
        });
    });

    it('allows `prefix` option to be passed to customize upload-path', function() {
      var prefix = 'my-app';

      options.prefix = prefix;
      var promise    = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          var expectLogOutput = '- ✔  '+prefix+'/'+filePattern+':'+revisionKey;
          var expectedKey     = prefix+'/'+filePattern+':'+revisionKey;

          assert.equal(mockUi.messages[0], expectLogOutput, 'Prefix is included in log output');
          assert.equal(s3Params.Key, expectedKey, 'Key (including prefix) passed correctly');
        });
    });

    it('allows `acl` option to be passed to customize the used ACL', function() {
      var acl = 'authenticated-read';

      options.acl = acl;
      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(s3Params.ACL, acl, 'acl passed correctly');
        });
    });

    it('allows `endpoint` option to be passed to customize storage', function() {
      var endpoint = 'foo.bar.baz';
      subject = new S3({
        plugin: Object.assign(plugin, {
          readConfig: function(propertyName) {
            if (propertyName === 's3Client') {
              return s3Client;
            } else if (propertyName === 'endpoint') {
              return endpoint;
            }
          }
        })
      });
      var promise = subject.upload(options);
      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(require('aws-sdk').config.endpoint.host, endpoint, 'Endpoint in SDK is correct');
          assert.equal(mockUi.messages[0], '- Using endpoint from config', 'Prefix is included in log output');
        });
    });

    it('allows `cacheControl` option to be passed to customize the used cache-control', function() {
      var cacheControl = 'max-age=3600';

      options.cacheControl = cacheControl;

      var promise = subject.upload(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(s3Params.CacheControl, cacheControl, 'cache-control passed correctly');

        });
    });

    describe("when revisionKey was already uploaded", function() {
      beforeEach(function() {
        options.revisionKey = "123";
      });

      it('rejects when trying to upload an already uploaded revision', function() {
        var promise = subject.upload(options);

        return assert.isRejected(promise);
      });

      it('does not reject when allowOverwrite option is set to true', function() {
        options.allowOverwrite = true;

        var promise = subject.upload(options);

        return assert.isFulfilled(promise);
      });
    });
  });

  describe('#fetchRevisions', function() {
    var bucket      = 'some-bucket';
    var prefix      = '';
    var filePattern = 'test.html';

    beforeEach(function() {
      options = {
        bucket: bucket,
        prefix: prefix,
        filePattern: filePattern
      };
    });

    it('returns an array of uploaded revisions in `{ revision: revisionKey, timestamp: timestamp, active: active }` format sorted by date in descending order', function() {
      var promise = subject.fetchRevisions(options);
      var expected = [
          { revision: '456', timestamp: new Date('September 27, 2015 02:00:00') , active: false },
          { revision: '123', timestamp: new Date('September 27, 2015 01:00:00'), active: true }
      ];

      return assert.isFulfilled(promise)
        .then(function(revisionsData) {
          return assert.deepEqual(revisionsData, expected, 'Revisions data correct');
        });
    });

    it('sends correct parameters for s3#listObjects and s3#headObject', function() {
      var expectePrefix = filePattern+':';

      var promise = subject.fetchRevisions(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(listParams.Bucket, bucket, 'list Bucket set correctly');
          assert.equal(listParams.Prefix, expectePrefix, 'list Prefix set correctly');
          assert.equal(headParams.Bucket, bucket, 'head Bucket set correctly');
          assert.equal(headParams.Key, filePattern, 'head Key set correctly');
        });
    });

    it('changes parameters sent to s3#listObjects and s3#headObject when setting the `prefix`-option', function() {
      var prefix = 'my-app';
      var expectedPrefix = 'my-app/'+filePattern+':';
      var expectedKey = 'my-app/'+filePattern;

      options.prefix = prefix;
      var promise = subject.fetchRevisions(options);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(listParams.Prefix, expectedPrefix);
          assert.equal(headParams.Key, expectedKey);
        });
    });

    it('correctly pages s3#listObjects calls when necessary', function() {

      var revisions = [
        { Key: 'test.html:111', LastModified: new Date('September 27, 2015 01:00:00'), ETag: '111' },
        { Key: 'test.html:222', LastModified: new Date('September 27, 2015 02:00:00') , ETag: '222' },
        { Key: 'test.html:333', LastModified: new Date('September 27, 2015 03:00:00') , ETag: '333' },
        { Key: 'test.html:444', LastModified: new Date('September 27, 2015 04:00:00') , ETag: '444' },
        { Key: 'test.html:555', LastModified: new Date('September 27, 2015 05:00:00') , ETag: '555' },
        { Key: 'test.html:666', LastModified: new Date('September 27, 2015 06:00:00') , ETag: '666' },
        { Key: 'test.html:777', LastModified: new Date('September 27, 2015 07:00:00') , ETag: '777' },
        { Key: 'test.html:888', LastModified: new Date('September 27, 2015 08:00:00') , ETag: '888' },
        { Key: 'test.html:999', LastModified: new Date('September 27, 2015 09:00:00') , ETag: '999' },
        { Key: 'test.html:000', LastModified: new Date('September 27, 2015 10:00:00') , ETag: '000' },
      ];

      var resultsPerPage = 4;
      var listObjectCalls = [];

      s3Client.listObjects = function(params, cb) {
        listObjectCalls.push(params.Marker);
        var offset = 0;
        offset = revisions.map(function(revision) {
          return revision.Key;
        }).indexOf(params.Marker) + 1;
        var lastResult = offset + resultsPerPage;

        cb(undefined, {
          Contents: revisions.slice(offset, lastResult),
          IsTruncated: lastResult < revisions.length,
        });
      };

      var promise = subject.fetchRevisions(options);

      return assert.isFulfilled(promise)
        .then(function(revisionsData) {
          assert.equal(revisionsData.length, revisions.length, 'All revisions are available');
          assert.equal(listObjectCalls.length, 3, 'listObjects was called 3 times');
          assert.equal(listObjectCalls[0], undefined, 'the first call to listObjects had the expected marker');
          assert.equal(listObjectCalls[1], 'test.html:444', 'the second call to listObjects had the expected marker');
          assert.equal(listObjectCalls[2], 'test.html:888', 'the third call to listObjects had the expected marker');
        });
    });
  });

  describe('#activate', function() {
    var bucket      = 'some-bucket';
    var prefix      = '';
    var acl         = 'public-read';
    var filePattern = 'test.html';

    beforeEach(function() {
      options = {
        bucket: bucket,
        prefix: prefix,
        acl: acl,
        filePattern: filePattern,
        urlEncodeSourceObject: true,
      };
    });

    describe('with a valid revisionKey', function() {
      beforeEach(function() {
        options.revisionKey = '456';
      });

      it('resolves when passing an existing revisionKey', function() {
        var promise = subject.activate(options);

        return assert.isFulfilled(promise);
      });

      it('logs to the console when activation was successful', function() {
        var promise = subject.activate(options);
        var expectedOutput = '- ✔  '+filePattern+':456 => '+filePattern;

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(mockUi.messages.length, 1, 'Logs one line');
            assert.equal(mockUi.messages[0], expectedOutput, 'Activation output correct');
          });
      });

      it('passes correct parameters to s3#copyObject', function() {
        var promise = subject.activate(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(copyParams.Bucket, bucket);
            assert.equal(copyParams.ACL, acl);
            assert.equal(copyParams.CopySource, bucket+'%2F'+filePattern+'%3A456');
            assert.equal(copyParams.Key, filePattern);
          });
      });

      it('allows `prefix` option to be passed to customize Key and CopySource passed to s3#copyObject', function() {
        var prefix = 'my-app';
        revisionsData = {
          Contents: [
            { Key: prefix+'/test.html:123', LastModified: new Date('September 27, 2015 01:00:00'), ETag: '123' },
            { Key: prefix+'/test.html:456', LastModified: new Date('September 27, 2015 02:00:00') , ETag: '456' }
          ]
        };

        options.prefix = prefix;
        var promise    = subject.activate(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(copyParams.Key, prefix+'/'+filePattern);
            assert.equal(copyParams.CopySource, bucket+'%2F'+prefix+'%2F'+filePattern+'%3A456');
          });
      });

      it ('does not url encode the CopySource when urlEncodeSourceObject is disabled', function() {
        options.urlEncodeSourceObject = false;
        var prefix = 'my-app';
        revisionsData = {
          Contents: [
            { Key: prefix+'/test.html:123', LastModified: new Date('September 27, 2015 01:00:00'), ETag: '123' },
            { Key: prefix+'/test.html:456', LastModified: new Date('September 27, 2015 02:00:00') , ETag: '456' }
          ]
        };

        options.prefix = prefix;
        var promise    = subject.activate(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(copyParams.Key, prefix+'/'+filePattern);
            assert.equal(copyParams.CopySource, bucket+'/'+prefix+'/'+filePattern+':456');
          });
      });

      it('allows `acl` option to be passed to customize the used ACL', function() {
        var acl = 'authenticated-read';

        options.acl = acl;
        var promise = subject.activate(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(copyParams.ACL, acl);
          });
      });

      it('detects serverSideEncryption when defined', function() {
        options.serverSideEncryption = 'AES256';
        var promise = subject.activate(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(copyParams.ServerSideEncryption, 'AES256', 'serverSideEncryption passed correctly');
          });
      });

      it('filters serverSideEncryption when not defined', function() {
        var promise = subject.activate(options);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(copyParams.hasOwnProperty('serverSideEncryption'), false, 'serverSideEncryption filtered correctly');
          });
      });
    });

    describe('with an invalid revision key', function() {
      beforeEach(function() {
        options.revisionKey = '457';
      });

      it('rejects when passing an non-existing revisionKey', function() {
        var promise = subject.activate(options);

        return assert.isRejected(promise);
      });
    });
  });
});
