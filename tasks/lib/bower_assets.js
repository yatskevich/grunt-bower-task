var _ = require('lodash');
var Emitter = require('events').EventEmitter;
var path = require('path');
var grunt = require('grunt');

var BowerAssets = function(bower, config) {
  this.bower = bower;
  this.cwd = process.cwd();
  this.config = config || 'component.json';
};

BowerAssets.prototype = Object.create(Emitter.prototype);
BowerAssets.prototype.constructor = BowerAssets;

BowerAssets.prototype.get = function() {
  var bower = this.bower;
  var bowerConfig = grunt.file.readJSON(path.join(this.cwd, this.config));
  var exportsOverride = bowerConfig.exportsOverride;

  var paths = bower.commands.list({paths: true});
  paths.on('data', function(data) {
    this.emit('data', this.mergePaths(data, exportsOverride ? exportsOverride : {}))
  }.bind(this));
  paths.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  return this;
};

BowerAssets.prototype.mergePaths = function(allPaths, overrides) {
  var bowerAssets = {'_any': {}};
  var cwd = this.cwd;
  _(allPaths).each(function(pkgPaths, pkg) {
    var pkgOverrides = overrides[pkg];
    if (pkgOverrides) {
      _(pkgOverrides).each(function(overriddenPaths, assetType) {
        bowerAssets[assetType] = bowerAssets[assetType] || {};

        var pkgPath = path.join('components', pkg);
        var basePath = path.join(cwd, pkgPath);

        bowerAssets[assetType][pkg] = _(grunt.file.expand({cwd: basePath}, overriddenPaths)).map(function(expandedPath) {
          return path.join(pkgPath, expandedPath);
        })
      });
    } else {
      if (!_.isArray(pkgPaths)) {
        pkgPaths = [ pkgPaths ];
      }
      bowerAssets['_any'][pkg] = pkgPaths;
    }
  }, this);

  return bowerAssets;
};

module.exports = BowerAssets;