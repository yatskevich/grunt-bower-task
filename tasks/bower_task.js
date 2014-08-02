/*
 * grunt-bower-task
 * https://github.com/yatskevich/grunt-bower-task
 *
 * Copyright (c) 2012 Ivan Yatskevich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var bower,
    path,
    async,
    colors,
    rimraf,
    BowerAssets,
    AssetCopier,
    LayoutsManager;

  function requireDependencies () {
    bower = require('bower'),
    path = require('path'),
    async = require('async'),
    colors = require('colors'),
    rimraf = require('rimraf').sync,
    BowerAssets = require('./lib/bower_assets'),
    AssetCopier = require('./lib/asset_copier'),
    LayoutsManager = require('./lib/layouts_manager');
  }

  function log(message) {
    log.logger.writeln(message);
  }

  function fail(error) {
    grunt.fail.fatal(error);
  }

  function clean(dir, callback) {
    rimraf(dir);
    callback();
  }

  function install(options, callback) {
    bower.config.cwd = options.cwd;
    bower.commands.install([], options.bowerOptions)
      .on('log', function(result) {
        log(['bower', result.id.cyan, result.message].join(' '));
      })
      .on('error', fail)
      .on('end', callback);
  }

  function copy(options, callback) {
    grunt.file.setBase(options.cwd);
    var bowerAssets = new BowerAssets(bower, options.cwd);
    bowerAssets.on('end', function(assets) {
      var copier = new AssetCopier(assets, options, function(source, destination, isFile) {
        log('grunt-bower ' + 'copying '.cyan + ((isFile ? '' : ' dir ') + source + ' -> ' + destination).grey);
        if (typeof(options.afterCopyCallback) === "function") {
          options.afterCopyCallback(options, source, destination, isFile);
        }
      });

      copier.once('copied', callback);
      copier.copy();
    }).get();
  }

  grunt.registerMultiTask('bower', 'Install Bower packages.', function() {
    var tasks = [],
      done = this.async(),
      options = this.options({
        cleanTargetDir: false,
        cleanBowerDir: false,
        targetDir: './lib',
        layout: 'byType',
        install: true,
        verbose: false,
        copy: true,
        bowerOptions: {}
      }),
      add = function(successMessage, fn) {
        tasks.push(function(callback) {
          fn(function() {
            grunt.log.ok(successMessage);
            callback();
          });
        });
      },
      workingDirectory = grunt.option('base') || process.cwd();
      
    // calling require on the dependencies has been delayed to prevent slow
    // dependencies delaying the startup of grunt even if this task is not used
    // at all
    requireDependencies();
    
    if (this.files.length === 0) {
      this.files = grunt.file.expandMapping('bower.json', '', options);
    }
    
    this.files.forEach(function(file) {
      file.src.forEach(function(pathToFile) {
        if (grunt.file.isFile(pathToFile)) {
          var eachOptions = grunt.util._.merge({}, options);
          var bowerDir = path.resolve(pathToFile, '..', bower.config.directory);
          var targetDir = path.resolve(pathToFile, '..', eachOptions.targetDir);

          log.logger = eachOptions.verbose ? grunt.log : grunt.verbose;
          eachOptions.layout = LayoutsManager.getLayout(eachOptions.layout, fail);
          eachOptions.cwd = grunt.option('base') || targetDir;

          if (eachOptions.cleanup !== undefined) {
            eachOptions.cleanTargetDir = eachOptions.cleanBowerDir = eachOptions.cleanup;
          }

          if (eachOptions.cleanTargetDir) {
            add('Cleaned target dir ' + targetDir.grey, function(callback) {
              clean(targetDir, callback);
            });
          }

          if (eachOptions.install) {
            add('Installed bower packages', function(callback) {
              install(eachOptions, callback);
            });
          }

          if (eachOptions.copy) {
            add('Copied packages to ' + targetDir.grey, function(callback) {
              copy(eachOptions, callback);
            });
          }

          if (eachOptions.cleanBowerDir) {
            add('Cleaned bower dir ' + bowerDir.grey, function(callback) {
                clean(bowerDir, callback);
            });
          }
        }
      });
    });
    
    add('Return working directory', function(callback) {
      grunt.file.setBase(workingDirectory);
      callback();
    });

    async.series(tasks, done);
  });
};
