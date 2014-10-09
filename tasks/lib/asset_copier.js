var _ = require('lodash');
var glob = require("glob");
var Emitter = require('events').EventEmitter;
var wrench = require('wrench');
var path = require('path');
var grunt = require('grunt');
var fs = require('fs');

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
  }, this);

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
      } else if(self.options.forceMain){
          source = self.findMainFile(source, pkg);
          destination = path.join(destinationDir, path.basename(source));
          grunt.file.copy(source, destination);
      } else {
        destination = destinationDir;
        wrench.copyDirSyncRecursive(source, destination);
      }
      self.report(source, destination, isFile);
    });
  });
};
Copier.prototype.findMainFile = function (src, pkg) {

    var ptrn = {
        main: pkg.slice(pkg.indexOf("-") + 1),
        ext : "js"
    };

    _.extend(ptrn, this.options.mainPattern);

    var fileNamePtrn = ptrn.main + "." + ptrn.ext,
        pattern = src + "/**/" + fileNamePtrn,
        source = glob.sync(pattern, {nocase: true});

    if(source[0] === undefined) {
        throw new ReferenceError('Unable to find "' + fileNamePtrn + '" in ' + src + ' directory');
    }

    return source[0];
};

module.exports = Copier;
