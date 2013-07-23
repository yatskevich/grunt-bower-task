var _ = require('lodash');
var Emitter = require('events').EventEmitter;
var path = require('path');
var grunt = require('grunt');

var BowerAssets = function(bower, cwd) {
  this.bower = bower;
  this.cwd = cwd;
  this.config = bower.config.json || 'bower.json';
};

BowerAssets.prototype = Object.create(Emitter.prototype);
BowerAssets.prototype.constructor = BowerAssets;

BowerAssets.prototype.get = function() {
  var bower = this.bower;
  var bowerConfig = grunt.file.readJSON(path.join(this.cwd, this.config));
  var exportsOverride = bowerConfig.exportsOverride;

  var paths = bower.commands.list({paths: true});
  paths.on('end', function(data) {
    this.emit('end', this.mergePaths(data, exportsOverride ? exportsOverride : {}));
  }.bind(this));
  paths.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  return this;
};

BowerAssets.prototype.mergePaths = function(allPaths, overrides) {
  var copyOverrides = _.clone(overrides);
  var bowerAssets = {'__untyped__': {}};
  var cwd = this.cwd;
  var componentsLocation = this.bower.config.directory;

  var checkOverride = function(pkg, override_key) {
    var matcher;
    if (override_key.match(/^\/.*\/$/)) {
      // Explicit way of reg exp, e.g. `"/jquery-\d-\d.*/"`
      // I would skip it since it seems to be an overhead now
      matcher = new RegExp(override_key.replace(/^\/|\/$/g, ''));
      return matcher.test(pkg);
    } else if (override_key.match(/\*/)) {
      // Wild card matcher
      override_key = override_key.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&').replace('*', '.+');
      matcher = new RegExp(override_key);
      return matcher.test(pkg);
    } else {
      // Exact match
      return pkg === override_key;
    }
  };

  var addUntypedAssets = function(pkgPaths, pkg) {
    if (!_.isArray(pkgPaths)) {
      pkgPaths = [ pkgPaths ];
    }
    bowerAssets['__untyped__'][pkg] = pkgPaths;
  };

  _(allPaths).each(function(pkgPaths, pkg) {
    // overrides undefined.
    if (_(copyOverrides).isEmpty()) {
      addUntypedAssets(pkgPaths, pkg);
      return false;
    }

    var found = false;
    _(copyOverrides).each(function(override, override_key) {
      if(checkOverride(pkg, override_key)) {
        _(override).each(function(overriddenPaths, assetType) {
          bowerAssets[assetType] = bowerAssets[assetType] || {};
          var pkgPath = path.join(componentsLocation, pkg);
          var basePath = path.join(cwd, pkgPath);
          bowerAssets[assetType][pkg] = _(grunt.file.expand({cwd: basePath}, overriddenPaths)).map(function(expandedPath) {
            return path.join(pkgPath, expandedPath);
          });
        });
        found = true;
        return false;
      }
    });
    if (!found) {
      addUntypedAssets(pkgPaths, pkg);
    }
  }, this);

  return bowerAssets;
};

module.exports = BowerAssets;
