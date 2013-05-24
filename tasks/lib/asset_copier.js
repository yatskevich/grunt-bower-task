var _ = require('lodash');
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
  _(assets).each(function(sources, pkg) {
    _(sources).each(function(source) {
      var destination;
      var isFile = fs.statSync(source).isFile();
      var destinationDir = path.join(this.options.targetDir, this.options.layout(type, pkg));
      grunt.file.mkdir(destinationDir);
      if (isFile) {
        destination = path.join(destinationDir, path.basename(source));
        grunt.file.copy(source, destination);
      } else {

        // before we copy all the directory, lets try to get a file from package.json main property
        var packagejson = source + '/' + "package.json";

        // if we cant find the file reference inside package.json keep the default folder
        destination = destinationDir;

        // we want the build to continue as default if case something fails
        try {
            // read package.json file
            var file = fs.readFileSync(packagejson).toString('ascii')

            // parse file
            var filedata = JSON.parse(file);

            // path to file from main property inside package.json
            var mainpath = source + '/' + filedata.main;

            // if we have a file reference on package.json to main property and it is a file
            if( fs.lstatSync( mainpath ).isFile() ) {

                isFile = true;
                source = mainpath;
                destination = path.join(destinationDir, path.basename(source));

                grunt.file.copy(source, destination);
            }

        }
        catch( error ) {
            // We wont need to show log error, if package.json doesnt exist default to download folder
            wrench.copyDirSyncRecursive(source, destination);
        }
      }
      this.report(source, destination, isFile);
    }, this);
  }, this);
};

module.exports = Copier;
