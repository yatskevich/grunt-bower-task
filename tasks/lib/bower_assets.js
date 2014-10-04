var _ = require('lodash');
var Emitter = require('events').EventEmitter;
var path = require('path');
var grunt = require('grunt');
var packageMatcher = require('./package_matcher');
var Q = require('q');
var Handlebars = require('handlebars');

var Assets = function(cwd, componentsDir) {
  this._assets = {};
  this._cwd = cwd;
  this._componentsDir = componentsDir;
};

/**
 * Checks if parameter contains an extended definition that has "packageName"
 * and "overrides" properties.
 */
function isExtendedOverride(overrides) {
  return overrides && _(overrides).has('packageName') && _(overrides).has('overrides');
}

/**
 * Gets overrides from an extended definition or returns "overrides" as is.
 */
function getOverrides(overrides) {
  return isExtendedOverride(overrides) && _.isObject(overrides.overrides) ? overrides.overrides : overrides;
}

/**
 * Gets "packageName" property if given an extended overrides definition or returns null.
 */
function getPackageName(overrides) {
  return isExtendedOverride(overrides) ? overrides.packageName : null;
}

/**
 * Gets Bower package version from its metadata.
 *
 * @param pkgMeta package metadata (returned by "bower.commands.info")
 * @returns object with "major", "minor" and "revision" properties (extracted from metadata's version)
 */
function getPackageVersion(pkgMeta) {
  var parts = pkgMeta.version.split(/[^0-9]/).concat([0, 0, 0]);
  return { major: parts[0], minor: parts[1], revision: parts[2] };
}

Assets.prototype.addOverridden = function(override, pkg, pkgMeta, exportsOverride) {
  var pkgPath = path.join(this._componentsDir, pkg);

  //take "packageName" specified for given override (or for master "exportsOverride")
  //  and run it through Handlebars to further customize name of the package (and thus target folder)
  var tmpl = Handlebars.compile(getPackageName(override) || getPackageName(exportsOverride) || pkg);
  //provide context with:
  //  meta - package metadata (as returned by Bower)
  //  version - object with "major", "minor" and "revision" properties (extracted from metadata's version)
  //  version_safe - metatdata's version with all non-dot and non-digit characters replaced with "_"
  pkg = tmpl({ meta: pkgMeta, version: getPackageVersion(pkgMeta), version_safe: pkgMeta.version.replace(/[^0-9.]/, '_') });

  _(getOverrides(override)).each(function(overriddenPaths, assetType) {
    this.addAssets(overriddenPaths, pkg, assetType, pkgPath);
  }, this);
};

Assets.prototype.addUntyped = function(pkgFiles, pkg, pkgMeta) {
  this.addAssets(pkgFiles, pkg, '__untyped__');
};

Assets.prototype.addAssets = function(filePatterns, pkg, assetType, pkgPath) {
  pkgPath = pkgPath || '';

  if (!_.isArray(filePatterns)) {
    filePatterns = [ filePatterns ];
  }

  var basePath = path.join(this._cwd, pkgPath);

  this._assets[assetType] = this._assets[assetType] || {};
  this._assets[assetType][pkg] = _(grunt.file.expand({cwd: basePath}, filePatterns)).map(function(expandedPath) {
    return path.join(pkgPath, expandedPath);
  });
};

Assets.prototype.toObject = function() {
  return _.clone(this._assets);
};


var BowerAssets = function(bower, cwd) {
  this.bower = bower;
  this.cwd = cwd;
  this.config = bower.config.json || 'bower.json';
  this.assets = new Assets(cwd, bower.config.directory);
};

BowerAssets.prototype = Object.create(Emitter.prototype);
BowerAssets.prototype.constructor = BowerAssets;

BowerAssets.prototype.get = function() {
  var bower = this.bower;
  var bowerConfig = grunt.file.readJSON(path.join(this.cwd, this.config));
  var exportsOverride = bowerConfig.exportsOverride || {};

  var paths = bower.commands.list({paths: true});
  paths.on('end', function(data) {
    this.mergePaths(data, exportsOverride, bower, function(retData) {
      this.emit('end', retData);
    }.bind(this));
  }.bind(this));
  paths.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  return this;
};

/**
 *
 * @param bowerComponents - output of 'bower list' command
 * @param overrides - overrides coming from 'bower.json'
 * @param bower - reference to Bower
 * @param callback - function to be called back with 1 argument (object with assets)
 *
 * @returns assets grouped by component and type
 */
BowerAssets.prototype.mergePaths = function(bowerComponents, overrides, bower, callback) {
  var findOverride = function(pkg) {
    return _(getOverrides(overrides)).find(function(override, override_key) {
      return packageMatcher.matches(pkg, override_key);
    });
  };

  var that = this;
  Q.allSettled(
    _(bowerComponents).map(function(pkgFiles, pkg) {
      var deferred = Q.defer();

      //get package metadata and pass it to assets' aggregation functions
      bower.commands.info(pkg).on('end', function(pkginfo) {
        var activeOverride = findOverride(pkg);
        pkginfo = pkginfo.latest || pkginfo;

        if (activeOverride) {
          that.assets.addOverridden(activeOverride, pkg, pkginfo, overrides);
        } else {
          that.assets.addUntyped(pkgFiles, pkg, pkginfo);
        }

        deferred.resolve(true);
      });

      return deferred.promise;
    })
  ).then(function() {
    callback(that.assets.toObject());
  });
};

module.exports = BowerAssets;
