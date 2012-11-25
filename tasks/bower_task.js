/*
 * grunt-bower-task
 * https://github.com/yatskevich/grunt-bower-task
 *
 * Copyright (c) 2012 Ivan Yatskevich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path');
  var rimraf = require('rimraf').sync;
  var bower = require('bower');
  var colors = require('colors');

  var BowerAssets = require('./lib/bower_assets');
  var AssetCopier = require('./lib/asset_copier');

  grunt.registerMultiTask('bower', 'Install Bower packages.', function() {
    var done = this.async();

    var options = this.options({
      targetDir: './lib',
      cleanup: false,
      install: true
    });

    if (options.cleanup) {
      rimraf('./components');
      grunt.log.writeln(('[notice]').yellow + ' cleaning up Bower packages');
      rimraf(options.targetDir);
      grunt.log.writeln(('[notice]').yellow + ' cleaning up ' + path.resolve(options.targetDir));
    }

    if (options.install) {
      bower.commands.install()
        .on('data', function(data) {
          grunt.log.writeln(data);
        })
        .on('end', function() {
          var success = function() {
            grunt.log.writeln('Bower packages installed successfully.');
            done();
          };

          var copy = function(assets) {
            var copier = new AssetCopier(assets, options, function(source, destination, isFile) {
              var label = 'copied';
              if (!isFile) {
                label += ' dir';
              }
              grunt.log.writeln(('[' + label + ']').green + ' ' + source + ' -> ' + destination);
            });

            copier.once('copied', success).copy();
          };

          var bowerAssets = new BowerAssets(bower);
          bowerAssets.once('data', copy).get();
        })
        .on('error', function(error) {
          grunt.fail.fatal(error);
        });
    }
  });

};
