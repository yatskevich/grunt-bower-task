/*
 * grunt-bower-task
 * https://github.com/yatskevich/grunt-bower-task
 *
 * Copyright (c) 2012 Ivan Yatskevich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/bower_task.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    bower: {
      all: {}
    },

    nodeunit: {
      tests: ['test/bower_assets_test.js']
    }

  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('test', ['nodeunit']);

  grunt.registerTask('default', ['jshint', 'test']);

};
