'use strict';

var path = require('path');
var grunt = require('grunt');

var EventEmitter = require('events').EventEmitter;

var BowerAssets = require('../tasks/lib/bower_assets');

var bowerCommands = {
  list: new EventEmitter()
};

var bower = {
  commands: {
    list: function() {
      return bowerCommands.list;
    }
  }
};

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

function setupBowerConfig(name) {
  var assets = new BowerAssets(bower);
  assets.cwd = path.join(__dirname, 'fixtures', name);
  return assets;
}

function verify(name, message, expected, test) {
  var bowerAssets = setupBowerConfig(name);
  bowerAssets.get()
    .on('data', function(actual) {
      test.deepEqual(actual, expected, message);
      test.done();
    })
    .on('error', function(err) {
      test.ok(false, err);
      test.done();
    });
}

exports.bower_assets = {
  setUp: function(done) {
    done();
  },

  currentStateOfBower: function(test) {
    test.expect(1);

    var expected = {"_any": {"jquery": "components/jquery/jquery.js"}};

    verify(
      'current_state_of_bower',
      'should return all main paths in "_any" group',
      expected,
      test);

    bowerCommands.list.emit('data', {"jquery": "components/jquery/jquery.js"});
  },

  extendedComponentJson: function(test) {
    test.expect(1);

    var expected = {
      "js": {
        "bootstrap-sass": [
          "components/bootstrap-sass/js/bootstrap-affix.js",
          "components/bootstrap-sass/js/bootstrap-modal.js"
        ],
        "jquery": "components/jquery/jquery.js"
      },
      "scss": {
        "bootstrap-sass": "components/bootstrap-sass/lib/_mixins.scss"
      }
    };

    verify(
      'extended_component_json',
      'should return extended set of paths in "js" and "scss" groups',
      expected,
      test);

    bowerCommands.list.emit('data', {
      "bootstrap-sass": [
        "components/bootstrap-sass/docs/assets/js/bootstrap.js",
        "components/bootstrap-sass/docs/assets/css/bootstrap.css"
      ],
      "jquery": "components/jquery/jquery.js"
    });
  }
};
