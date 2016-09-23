/*
 * grunt-bower-task v0.5.0 (https://github.com/yatskevich/grunt-bower-task)
 * Copyright 2012-2016 Ivan Yatskevich
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {

  var bower,
    path,
    async,
    colors,
    rimraf,
    validator,
    BowerAssets,
    AssetCopier,
    LayoutsManager;

    /* ===============================================
                      Helper Methods
       =============================================*/
    function requireDependencies() {
    bower = require("bower");
    path = require("path");
    async = require("async");
    colors = require("colors");
    rimraf = require("rimraf").sync;
    validator = require('bower-json');
    BowerAssets = require("./lib/bower_assets");
    AssetCopier = require("./lib/asset_copier");
    LayoutsManager = require("./lib/layouts_manager");
  }

  function log(message) {
    log.logger.writeln(message);
  }

  function validate(options) {
    var bowerFile = bower.config.json || "bower.json";

    validator.read(bowerFile, function (error, json) {
      if (error) {
        console.error("bower.json validation: Failed - " + error.message);
      }
      else {
        if (options.verbose) {
          console.info("bower.json validation: Passed");
        }
      }
    });
  }

  /* ===============================================
                    Core Methods
    =============================================*/

  function clean(dir, callback) {
    rimraf(dir);
    callback();
  }

  function copy(options, callback) {
    var bowerAssets = new BowerAssets(bower, options.cwd);
    bowerAssets.on("end", function (assets) {
      var copier = new AssetCopier(assets, options, function (source, destination, isFile) {
        log("grunt-bower " + "copying ".cyan + ((isFile ? "" : " dir ") + source + " -> " + destination).grey);
      });

      copier.once("copied", callback);
      copier.copy();
    }).get();
  }

  function fail(error) {
    grunt.fail.fatal(error);
  }

  function install(options, callback) {

    validate(options);

    bower.commands.install([], options.bowerOptions)
      .on("log", function(result) {
        log(["bower", result.id.cyan, result.message].join(" "));
      })
      .on("error", fail)
      .on("end", callback);
  }



  function prune(options, callback) {
    bower.commands.prune([], options.bowerOptions)
      .on("log", function (result) {
        log(["bower", result.id.cyan, result.message].join(" "));
      })
      .on("error", fail)
      .on("end", callback);
  }

  grunt.registerMultiTask("bower", "Install Bower packages.", function () {
    var tasks = [],
      done = this.async(),
      options = this.options({
        cleanTargetDir: false,
        cleanBowerDir: false,
        targetDir: "./lib",
        layout: "byType",
        install: true,
        prune: false,
        verbose: false,
        copy: false,
        bowerOptions: {}
      }),
      add = function (successMessage, fn) {
        tasks.push(function (callback) {
          fn(function () {
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
    options.cwd = grunt.option("base") || process.cwd();

    if (options.cleanup !== undefined) {
      options.cleanTargetDir = options.cleanBowerDir = options.cleanup;
    }

    if (options.cleanTargetDir) {
      add("Cleaned target dir " + targetDir.grey, function (callback) {
        clean(targetDir, callback);
      });
    }

    if (options.install) {
      add("Installed bower packages", function (callback) {
        install(options, callback);
      });
    }

    if (options.prune) {
      add("Pruned bower packages", function (callback) {
        prune(options, callback);
      });
    }

    if (options.copy) {
      add("Copied packages to " + targetDir.grey, function (callback) {
        copy(options, callback);
      });
    }

    if (options.cleanBowerDir) {
      add("Cleaned bower dir " + bowerDir.grey, function (callback) {
        clean(bowerDir, callback);
      });
    }

    async.series(tasks, done);
  });


};
