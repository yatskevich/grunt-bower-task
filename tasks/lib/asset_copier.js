var _ = require('lodash');
var Emitter = require('events').EventEmitter;
var wrench = require('wrench');
var path = require('path');
var grunt = require('grunt');
var fs = require('fs');

var Copier = function(assets, options, report) {
  this.cwd = process.cwd();
  this.assets = assets;
  this.options = options;
  this.report = report;
};

Copier.prototype = Object.create(Emitter.prototype);
Copier.prototype.constructor = Copier;

Copier.prototype.copy = function() {
  var anyType = this.assets['_any'];
  if (anyType) {
    this.copyAssets('', anyType);
  }
  return this;
};

Copier.prototype.copyAssets = function(type, assets) {
  var error;
  _(assets).each(function(source, pkg) {
    var destination;
    try {
      var isFile = fs.statSync(source).isFile();
      if (isFile) {
        destination = path.join(this.options.targetDir, type, pkg, path.basename(source));
        grunt.file.copy(source, destination);
      } else {
        destination = path.join(this.options.targetDir, type, pkg);
        wrench.copyDirSyncRecursive(source, destination);
      }

      this.report(source, destination, isFile);
    } catch (e) {
      this.emit('error', e);
      error = e;
      return false;
    }
  }.bind(this));

  if (!error) {
    this.emit('end');
  }
};

module.exports = Copier;