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
    fs,
    path,
    async,
    colors,
    rimraf,
    BowerAssets,
    AssetCopier,
    LayoutsManager;

  function requireDependencies () {
    bower = require('bower'),
    fs = require('fs'),
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

  function clean(dir, options, callback) {
    var packages = options.packages,
      rmpaths;

    if (!packages.length) {
      rmpaths = [dir];
    } else {
      rmpaths = packages.map(function(x) {
        return path.join(dir, x);
      });
    }

    rmpaths.forEach(function(rmpath) {
      var msg = 'Remove ' + rmpath;
      if (fs.existsSync(rmpath)) {
        try {
          rimraf(rmpath);
          log.logger.ok(msg);
        }
        catch (ex) {
          log.logger.error(msg);
          throw ex;
        }
      } else {
        log.logger.error(msg + ' NOTFOUND');
      }
    });

    callback();
  }

  function install(options, callback) {
    bower.commands.install(options.packages, options.bowerOptions)
      .on('log', function(result) {
        log(['bower', result.id.cyan, result.message].join(' '));
      })
      .on('error', fail)
      .on('end', callback);
  }

  function prune(callback) {
    bower.commands.prune()
      .on('log', function(result) {
        log(['bower', result.id.cyan, result.message].join(' '));
      })
      .on('error', fail)
      .on('end', callback);
  }

  function copy(options, callback) {
    var bowerAssets = new BowerAssets(bower, options.cwd);
    bowerAssets.on('end', function(assets) {
      var copier = new AssetCopier(assets, options, function(source, destination, isFile) {
        log('grunt-bower ' + 'copying '.cyan + ((isFile ? '' : ' dir ') + source + ' -> ' + destination).grey);
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
        prune: false,
        verbose: false,
        copy: true,
        packages: [],
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
      bowerDir,
      targetDir;

    // calling require on the dependencies has been delayed to prevent slow
    // dependencies delaying the startup of grunt even if this task is not used
    // at all
    requireDependencies();

    bowerDir = path.resolve(bower.config.directory);
    targetDir = path.resolve(options.targetDir);

    log.logger = options.verbose ? grunt.log : grunt.verbose;
    options.layout = LayoutsManager.getLayout(options.layout, fail);
    options.cwd = grunt.option('base') || process.cwd();

    if (options.cleanup !== undefined) {
      options.cleanTargetDir = options.cleanBowerDir = options.cleanup;
    }

    if (options.cleanTargetDir) {
      add('Cleaned target dir ' + targetDir.grey, function(callback) {
        clean(targetDir, options, callback);
      });
    }

    if (options.install) {
      add('Installed bower packages', function(callback) {
        install(options, callback);
      });
    }

    if (options.prune) {
      add('Prune bower packages', function(callback) {
        prune(callback);
      });
    }

    if (options.copy) {
      add('Copied packages to ' + targetDir.grey, function(callback) {
        copy(options, callback);
      });
    }

    if (options.cleanBowerDir) {
      add('Cleaned bower dir ' + bowerDir.grey, function(callback) {
        clean(bowerDir, options, callback);
      });
    }

    async.series(tasks, done);
  });
};
