/*
 * grunt-bower-task
 * https://github.com/yatskevich/grunt-bower-task
 *
 * Copyright (c) 2012 Ivan Yatskevich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var bower = require('bower'),
    path = require('path'),
    async = require('async'),
    colors = require('colors'),
    rimraf = require('rimraf').sync,
    fs = require('fs'),
    _ = require('lodash'),
    BowerAssets = require('./lib/bower_assets'),
    AssetCopier = require('./lib/asset_copier'),
    LayoutsManager = require('./lib/layouts_manager');

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
    bower.commands.install([], options.bowerOptions)
      .on('log', function(result) {
        log(['bower', result.id.cyan, result.message].join(' '));
      })
      .on('error', fail)
      .on('end', callback);
  }

  function updateConfig(options, requirePaths) {
      var configFile;
      var configPath = path.resolve(options.updateRequireJsConfig);

      if (fs.existsSync(configPath)) {
        configFile = fs.readFileSync(String(configPath), 'utf8');
      } else {
        configFile = fs.readFileSync(path.join(__dirname, '../templates/config.js'), 'utf8');
      }
      var requirejs = require('requirejs/bin/r.js');
      var rjsConfig;
      requirejs.tools.useLib(function (require) {
          rjsConfig = require('transform').modifyConfig(configFile, function (config) { 
            if (config.paths) {
               _.extend(config.paths, requirePaths);
            } else {
               config.paths = requirePaths;
            }
            return config;
            })
          fs.writeFileSync(configPath, rjsConfig, 'utf-8');
          grunt.log.ok('Updated RequireJS config ' + configPath.grey + ' with installed Bower components');
      });

  }

  function copy(options, callback) {
    var requirePaths = {}
    var bowerAssets = new BowerAssets(bower, options.cwd);
    bowerAssets.on('end', function(assets) {
      var copier = new AssetCopier(assets, options, function(source, destination, isFile) {
        log('grunt-bower ' + 'copying '.cyan + ((isFile ? '' : ' dir ') + source + ' -> ' + destination).grey);
      }, function(pkg,destfile) {
        requirePaths[pkg] = destfile.replace(/(.*)\.js$/,'$1') ;
      });

      copier.once('copied', callback);
      copier.copy();
      if(options.updateRequireJsConfig) {
          updateConfig( options, requirePaths );
          }
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
        updateRequireJsConfig: false,
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
      bowerDir = path.resolve(bower.config.directory),
      targetDir = path.resolve(options.targetDir);

    log.logger = options.verbose ? grunt.log : grunt.verbose;
    options.layout = LayoutsManager.getLayout(options.layout, fail);
    options.cwd = grunt.option('base') || process.cwd();

    if (options.cleanup !== undefined) {
      options.cleanTargetDir = options.cleanBowerDir = options.cleanup;
    }

    if (options.cleanTargetDir) {
      add('Cleaned target dir ' + targetDir.grey, function(callback) {
        clean(targetDir, callback);
      });
    }

    if (options.install) {
      add('Installed bower packages', function(callback) {
        install(options, callback);
      });
    }

    if (options.copy) {
      add('Copied packages to ' + targetDir.grey, function(callback) {
        copy(options, callback);
      });
    }

    if (options.cleanBowerDir) {
      add('Cleaned bower dir ' + bowerDir.grey, function(callback) {
        clean(bowerDir, callback);
      });
    }

    async.series(tasks, done);
  });
};
