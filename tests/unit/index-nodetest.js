'use strict';

var Promise = require('ember-cli/lib/ext/promise');
var assert  = require('ember-cli/tests/helpers/assert');

var stubProject = {
  name: function(){
    return 'my-project';
  }
};

describe('s3-index plugin', function() {
  var subject, mockUi;

  beforeEach(function() {
    subject = require('../../index');
    mockUi = {
      verbose: true,
      messages: [],
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
  });

  it('has a name', function() {
    var result = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(result.name, 'test-plugin');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'test-plugin'
    });
    assert.ok(plugin.configure);
    assert.ok(plugin.upload);
    assert.ok(plugin.activate);
    assert.ok(plugin.fetchRevisions);
    assert.ok(plugin.fetchInitialRevisions);
  });


  describe('fetchInitialRevisions hook', function() {
    it('fills the initialRevisions variable on context', function() {
      var plugin;
      var context;
      var deployer = 'foo';

      plugin = subject.createDeployPlugin({
        name: 's3-index'
      });

      context = {
        ui: mockUi,
        project: stubProject,
        config: {
          's3-index': {
            prefix: 'test-prefix',
            filePattern: 'index.html',
            bucket: 'my-bucket',
            region: 'my-region',
            deployer: deployer,
            s3DeployClient: function(/* context */) {
              return {
                fetchRevisions: function(/* keyPrefix, revisionKey */) {
                  return Promise.resolve([{
                    revision: 'a',
                    active: false,
                    deployer: deployer
                  }]);
                }
              };
            }
          }
        }
      };
      plugin.beforeHook(context);
      plugin.configure(context);

      return assert.isFulfilled(plugin.fetchInitialRevisions(context))
        .then(function(result) {
          assert.deepEqual(result, {
            initialRevisions: [{
              "active": false,
              "revision": "a",
              "deployer": deployer
            }]
          });
        });
    });
  });

  describe('fetchRevisions hook', function() {
    it('fills the revisions variable on context', function() {
      var plugin;
      var context;
      var deployer = 'foo';

      plugin = subject.createDeployPlugin({
        name: 's3-index'
      });

      context = {
        ui: mockUi,
        project: stubProject,

        config: {
          's3-index': {
            prefix: 'test-prefix',
            filePattern: 'index.html',
            bucket: 'my-bucket',
            region: 'my-region',
            deployer: deployer,
            s3DeployClient: function(/* context */) {
              return {
                fetchRevisions: function(/* keyPrefix, revisionKey */) {
                  return Promise.resolve([{
                    revision: 'a',
                    active: false,
                    deployer: deployer
                  }]);
                }
              };
            }
          }
        }
      };
      plugin.beforeHook(context);
      plugin.configure(context);

      return assert.isFulfilled(plugin.fetchRevisions(context))
        .then(function(result) {
          assert.deepEqual(result, {
              revisions: [{
                "active": false,
                "revision": "a",
                "deployer": deployer
              }]
          });
        });
    });
  });
});
