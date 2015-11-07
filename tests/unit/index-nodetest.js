var CoreObject = require('core-object');
var assert     = require('ember-cli/tests/helpers/assert');
var Promise    = require('ember-cli/lib/ext/promise');


describe('s3-index plugin', function() {
  var subject, plugin, mockUi, s3Options;

  var DIST_DIR                = 'tmp/dist';
  var ACCESS_KEY              = 'access';
  var SECRET                  = 'secret';
  var BUCKET                  = 'bucket';
  var REVISION_KEY            = 'revision-key';
  var DIST_DIR                = 'tmp/dist';
  var DEFAULT_PREFIX          = '';
  var DEFAULT_FILE_PATTERN    = 'index.html';
  var DEFAULT_CACHE_CONTROL   = 'max-age=0, public';
  var DEFAULT_ALLOW_OVERWRITE = false;

  function s3Stub(options) {
    s3Options = options;
    return Promise.resolve();
  }

  before(function() {
    subject = require('../../index');
  });

  beforeEach(function() {
    s3Options = {};

    mockS3 = CoreObject.extend({
      upload: s3Stub,

      activate: s3Stub,

      fetchRevisions: s3Stub
    }),

    plugin = subject.createDeployPlugin({
      name: 's3-index',
      S3: mockS3
    });

    mockUi = {
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };

    context = {
      ui: mockUi,

      commandOptions: {},

      distDir: DIST_DIR,

      revisionData: {
        revisionKey: REVISION_KEY
      },

      config: {
        "s3-index": {
          accessKeyId: 'access',
          secretAccessKey: 'secret',
          bucket: 'bucket'
        }
      }
    }
  });

  it('it has a name', function() {
    assert.equal(plugin.name, 's3-index');
  });

  describe('hooks', function() {
    beforeEach(function() {
      plugin.beforeHook(context);
      plugin.configure(context);
    });

    describe('#upload', function() {
      it('implements the `upload`-hook', function() {
        assert.ok(plugin.upload);
      });

      it('passes the correct options to the S3-abstraction', function() {
        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              filePath: DIST_DIR+'/'+DEFAULT_FILE_PATTERN,
              revisionKey: REVISION_KEY,
              allowOverwrite: false,
              cacheControl: DEFAULT_CACHE_CONTROL,
              metadata: undefined
            };

            assert.deepEqual(s3Options, expected);
          });
      });

      it('passes metdata when specified in plugin configuration', function() {
        var metadata = {
          "surrogate-key": "index"
        };
        context.config['s3-index'].metadata = metadata;

        var promise = plugin.upload(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              filePath: DIST_DIR+'/'+DEFAULT_FILE_PATTERN,
              revisionKey: REVISION_KEY,
              allowOverwrite: false,
              cacheControl: DEFAULT_CACHE_CONTROL,
              metadata: metadata
            };

            assert.deepEqual(s3Options, expected);
          });
      });
    });

    describe('#activate', function() {
      it('implements the `activate`-hook', function() {
        assert.ok(plugin.activate);
      });

      it('passes the correct options to the S3-abstraction', function() {
        context.commandOptions.revision = '1234';

        var promise = plugin.activate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            var expected = {
              bucket: BUCKET,
              prefix: DEFAULT_PREFIX,
              filePattern: DEFAULT_FILE_PATTERN,
              revisionKey: '1234'
            };

            assert.deepEqual(s3Options, expected);
          });
      });
    });

    describe('#didActivate', function() {
      it('implements the `didActivate`-hook', function() {
        assert.ok(plugin.didActivate);
      });

      it('calls a user defined function when `didActivate`-property is present in plugin configuration', function() {
        var didActivateCalled = false;

        context.config['s3-index'].didActivate = function(context) {
          return function() {
            didActivateCalled = true;
          };
        };

        var promise = plugin.didActivate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.isTrue(didActivateCalled);
          });
      });

      it('calls a user defined function that has access to the deployment context', function() {
        var test = 'awesome';

        context.awesome = 'sauce';

        context.config['s3-index'].didActivate = function(deployContext) {
          return function() {
            test = test + deployContext.awesome;
          };
        };

        var promise = plugin.didActivate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(test, 'awesomesauce');
          });
      });

      it('does not break when no didActivate property is present on plugin configuration', function() {
        var promise = plugin.didActivate(context);

        return assert.isFulfilled(promise);
      });
    });

    describe('#fetchRevisions', function() {
      it('implements the `fetchRevisions`-hook', function() {
        assert.ok(plugin.fetchRevisions);
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
