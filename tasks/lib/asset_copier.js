var _ = require('lodash');
var Emitter = require('events').EventEmitter;
var path = require('path');
var grunt = require('grunt');
var fs = require('fs-extra');

var Copier = function(assets, options, report) {
  this.assets = assets;
  this.options = options;
  this.report = report;
};

Copier.prototype = Object.create(Emitter.prototype);
Copier.prototype.constructor = Copier;

Copier.prototype.copy = function() {
  var error;
  _(this.assets).each(function(typedAssets, type) {
    try {
      this.copyAssets(type, typedAssets);
    } catch (err) {
      error = err;
      this.emit('error', err);
      return false;
    }
  }.bind(this));

  if (!error) {
    this.emit('copied');
  }

  return this;
};

Copier.prototype.copyAssets = function(type, assets) {
  var self = this;
  _(assets).each(function(sources, pkg) {
    _(sources).each(function(source) {
      var destination;

      var isFile = fs.statSync(source).isFile();
      var destinationDir = path.join(self.options.targetDir, self.options.layout(type, pkg, source));
      grunt.file.mkdir(destinationDir);
      if (isFile) {
        destination = path.join(destinationDir, path.basename(source));
        grunt.file.copy(source, destination);
      } else {
        destination = destinationDir;

        fs.copySync(source, destination, {clobber: true, dereference: true});
      }
      self.report(source, destination, isFile);
    });
  });
};

module.exports = Copier;
