'use strict';

var CoreObject = require('core-object');
var RSVP       = require('rsvp');
var assert     = require('./../helpers/assert');

var stubProject = {
  name: function(){
    return 'my-project';
  }
};

describe('s3-index plugin', function() {
  var subject, mockUi, context, MockS3, plugin, s3Options, REVISIONS_DATA;

  var DIST_DIR                = 'tmp/dist';
  var BUCKET                  = 'bucket';
  var REGION                  = 'eu-west-1';
  var REVISION_KEY            = 'revision-key';
  var DEFAULT_PREFIX          = '';
  var DEFAULT_FILE_PATTERN    = 'index.html';
  var DEFAULT_ACL             = 'public-read';
  var DEFAULT_CACHE_CONTROL   = 'max-age=0, no-cache';

  function s3Stub(returnValue) {
    return function(options) {
      s3Options = options;
      return RSVP.resolve(returnValue);
    };
  }

  before(function() {
    subject = require('../../index');
  });

  beforeEach(function() {
    mockUi = {
      verbose: true,
      messages: [],
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      }
    };

    REVISIONS_DATA = [{
      revision: 'a',
      active: false
    }];

    MockS3 = CoreObject.extend({
      upload: s3Stub(),
      activate: s3Stub(),
      fetchRevisions: s3Stub(REVISIONS_DATA)
    });


    plugin = subject.createDeployPlugin({
      name: 's3-index',
      S3: MockS3
    });

    context = {
      ui: mockUi,

      project: stubProject,

      commandOptions: {},

      distDir: DIST_DIR,

      revisionData: {
        revisionKey: REVISION_KEY
      },

      config: {
        's3-index': {
          prefix: DEFAULT_PREFIX,
          filePattern: DEFAULT_FILE_PATTERN,
          bucket: BUCKET,
          region: REGION
        }
      }
    };
  });

  it('has a name', function() {
    assert.equal(plugin.name, 's3-index');
  });


  describe('hooks', function() {
    beforeEach(function() {
      plugin.beforeHook(context);
      plugin.configure(context);
    });

    it('implements the correct hooks', function() {
      assert.ok(plugin.configure);
      assert.ok(plugin.upload);
      assert.ok(plugin.activate);
      assert.ok(plugin.fetchRevisions);
      assert.ok(plugin.fetchInitialRevisions);
    });

    describe('#upload', function() {
      it('passes the correct options to the S3-abstraction', function() {
        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              acl: DEFAULT_ACL,
              cacheControl: DEFAULT_CACHE_CONTROL,
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              filePath: DIST_DIR+'/'+DEFAULT_FILE_PATTERN,
              gzippedFilePaths: [],
              brotliCompressedFilePaths: [],
              revisionKey: REVISION_KEY,
              allowOverwrite: false,
              urlEncodeSourceObject: true
            };

            assert.deepEqual(s3Options, expected);
          });
      });

      it('detects serverSideEncryption when defined', function() {
        context.config['s3-index'].serverSideEncryption = 'AES256';
        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(s3Options.serverSideEncryption, 'AES256', 'serverSideEncryption passed correctly');
          });
      });

      it('filters serverSideEncryption when not defined', function() {
        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(Object.prototype.hasOwnProperty.call(s3Options, 'serverSideEncryption'), false, 'serverSideEncryption filtered correctly');
          });
      });

      it('passes cacheControl options based on the cacheControl option to the s3-abstraction', function() {
        var cacheControl = 'max-age=3600';
        context.config['s3-index'].cacheControl = cacheControl;

        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              acl: DEFAULT_ACL,
              cacheControl: cacheControl,
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              filePath: DIST_DIR+'/'+DEFAULT_FILE_PATTERN,
              gzippedFilePaths: [],
              brotliCompressedFilePaths: [],
              revisionKey: REVISION_KEY,
              allowOverwrite: false,
              urlEncodeSourceObject: true
            };

            assert.deepEqual(s3Options, expected);
          });
      });

      it('passes gzippedFilePaths to S3 based on the `context.gzippedFiles` that ember-cli-deploy-gzip provides', function() {
        context.gzippedFiles = ['index.html'];

        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              acl: DEFAULT_ACL,
              cacheControl: DEFAULT_CACHE_CONTROL,
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              filePath: DIST_DIR+'/'+DEFAULT_FILE_PATTERN,
              gzippedFilePaths: ['index.html'],
              brotliCompressedFilePaths: [],
              revisionKey: REVISION_KEY,
              allowOverwrite: false,
              urlEncodeSourceObject: true
            };

            assert.deepEqual(s3Options, expected);
          });
      });

      it('passes brotliCompressedFilePaths to S3 based on the `context.brotliCompressedFiles` that ember-cli-deploy-compress provides', function() {
        context.brotliCompressedFiles = ['index.html'];

        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              acl: DEFAULT_ACL,
              cacheControl: DEFAULT_CACHE_CONTROL,
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              filePath: DIST_DIR+'/'+DEFAULT_FILE_PATTERN,
              gzippedFilePaths: [],
              brotliCompressedFilePaths: ['index.html'],
              revisionKey: REVISION_KEY,
              allowOverwrite: false,
              urlEncodeSourceObject: true
            };

            assert.deepEqual(s3Options, expected);
          });
      });
    });

    describe('#activate', function() {
      it('passes the correct options to the S3-abstraction', function() {
        context.commandOptions.revision = '1234';

        var promise = plugin.activate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              acl: DEFAULT_ACL,
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              revisionKey: '1234'
            };

            assert.deepEqual(s3Options, expected);
          });
      });

      it('detects serverSideEncryption when defined', function() {
        context.config['s3-index'].serverSideEncryption = 'AES256';
        var promise = plugin.activate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(s3Options.serverSideEncryption, 'AES256', 'serverSideEncryption passed correctly');
          });
      });

      it('filters serverSideEncryption when not defined', function() {
        var promise = plugin.activate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(Object.prototype.hasOwnProperty.call(s3Options, 'serverSideEncryption'), false, 'serverSideEncryption filtered correctly');
          });
      });
    });

    describe('#fetchInitialRevisions', function() {
      it('fills the `initialRevisions`-variable on context', function() {
        return assert.isFulfilled(plugin.fetchInitialRevisions(context))
          .then(function(result) {
            assert.deepEqual(result, {
              initialRevisions: REVISIONS_DATA
            });
          });
      });

      it('passes the correct options to the S3-abstraction', function() {
        var promise = plugin.fetchRevisions(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN
            };

            assert.deepEqual(s3Options, expected);
          });
      });
    });

    describe('#fetchRevisions', function() {
      it('fills the `revisions`-variable on context', function() {
        return assert.isFulfilled(plugin.fetchRevisions(context))
          .then(function(result) {
            assert.deepEqual(result, {
                revisions: REVISIONS_DATA
            });
          });
      });

      it('passes the correct options to the S3-abstraction', function() {
        var promise = plugin.fetchRevisions(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN
            };

            assert.deepEqual(s3Options, expected);
          });
      });
    });
  });
});
