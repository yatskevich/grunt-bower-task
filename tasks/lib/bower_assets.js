var events = require('events');
var path = require('path');
var grunt = require('grunt');

var BowerAssets = function(bower, config) {
  this.bower = bower;
  this.cwd = process.cwd();
  this.config = config || 'component.json';
};

BowerAssets.prototype = Object.create(events.EventEmitter.prototype);
BowerAssets.prototype.constructor = BowerAssets;

BowerAssets.prototype.get = function() {
  var bower = this.bower;
  var bowerConfig = grunt.file.readJSON(path.join(this.cwd, this.config));

  if (!bowerConfig.exportsOverride) {
    var paths = bower.commands.list({paths: true});
    paths.on('data', function(data) {
      this.emit('data', {"_any": data});
    }.bind(this));
    paths.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  } else {
    this.emit('error', new Error("not implemented yet"));
  }
  return this;
};

module.exports = BowerAssets;