/*
 * grunt-bower-task
 * https://github.com/yatskevich/grunt-bower-task
 *
 * Copyright (c) 2012 Ivan Yatskevich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var _ = require('lodash');
  var bower = require('bower');
  var BowerAssets = require('./lib/bower_assets');

  grunt.registerMultiTask('bower', 'Install Bower packages.', function() {
    var done = this.async();

    var options = this.options({
      targetDir: './lib'
    });

    bower.commands.install()
      .on('data', function(data){
        grunt.log.writeln(data);
      })
      .on('end',function() {
        var assets = new BowerAssets(bower);
        var paths = assets.get();
        copyToTargetDir(paths);
        grunt.log.writeln("Bower packages installed successfully.");
        done();
      })
      .on('error', function(error) {
        grunt.fail.fatal(error);
      });
  });

  function copyToTargetDir(paths) {
    grunt.fail.warn(new Error("Not implemented yet."));
  }

};
