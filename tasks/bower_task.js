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
  var layoutsManager = require('./lib/layouts_manager');

  grunt.registerMultiTask('bower', 'Install Bower packages.', function() {
    var options = this.options({
      targetDir: './lib',
      cleanup: false,
      install: true,
      verbose: false,
      layout: 'byType'
    });

    try {
      options.layout = layoutsManager.getLayout(options.layout);
    } catch (error) {
      grunt.fail.fatal(error);
    }

    var targetDirPath = path.resolve(options.targetDir);

    if (options.cleanup) {
      cleanup(targetDirPath);
    }

    if (options.install) {
      installBowerPackages(targetDirPath, options, this.async());
    }
  });

  function cleanup(targetDirPath) {
    rimraf(bower.config.directory);
    grunt.log.writeln(('[notice]').yellow + ' cleaning up Bower packages');
    rimraf(targetDirPath);
    grunt.log.writeln(('[notice]').yellow + ' cleaning up ' + targetDirPath);
  }

  function installBowerPackages(targetDirPath, options, done) {
    bower.commands.install()
      .on('data', function(data) {
        grunt.log.writeln(data);
      })
      .on('end', function() {
        var success = function() {
          grunt.log.ok('Bower packages installed successfully into ' + targetDirPath);
          done();
        };

        var copy = function(assets) {
          var copier = new AssetCopier(assets, options, function(source, destination, isFile) {
            var log = options.verbose ? grunt.log : grunt.verbose;
            log.writeln('Copied ' + (isFile ? '' : 'dir ') + source + ' -> ' + destination);
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

};
