# grunt-bower-task [![Build Status](https://travis-ci.org/yatskevich/grunt-bower-task.png)](https://travis-ci.org/yatskevich/grunt-bower-task)
[![npm](https://img.shields.io/npm/v/grunt-bower-task.svg?maxAge=2592000)](https://github.com/yatskevich/grunt-bower-task)
[![Dependency Status](https://david-dm.org/yatskevich/grunt-bower-task.svg)](https://david-dm.org/yatskevich/grunt-bower-task)
[![devDependency Status](https://david-dm.org/yatskevich/grunt-bower-task/dev-status.svg)](https://david-dm.org/yatskevich/grunt-bower-task#info=devDependencies)

> Install Bower packages. Smartly.

## Getting Started
_If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide._

Please note, this plugin works **only with grunt 0.4+**. If you are using grunt 0.3.x then consider an [upgrade to 0.4][].

From the same directory as your project's [Gruntfile][Getting Started] and [package.json][], install this plugin with the following command:

```bash
npm install grunt-bower-task --save-dev
```

Once that's done, add this line to your project's Gruntfile:

```js
grunt.loadNpmTasks('grunt-bower-task');
```

If the plugin has been installed correctly, running `grunt --help` at the command line should list the newly-installed plugin's task or tasks. In addition, the plugin should be listed in package.json as a `devDependency`, which ensures that it will be installed whenever the `npm install` command is run.

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/wiki/Getting-started
[package.json]: https://npmjs.org/doc/json.html
[upgrade to 0.4]: https://github.com/gruntjs/grunt/wiki/Upgrading-from-0.3-to-0.4

## Grunt task for Bower

### Overview
In your project's Gruntfile, add a section named `bower` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  bower: {
    install: {
       //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
    }
  }
});
```

### Options

#### options.targetDir
Type: `String`
Default value: `./lib`

A directory where you want to keep your Bower packages.

#### options.install
Type: `Boolean`
Default value: `true`

Whether you want to run bower install task itself (e.g. you might not want to do this each time on CI server).

#### options.prune
Type: `Boolean`
Default value: `false`

Whether you want to run bower prune task itself (e.g. you might not want to do this each time on CI server).

#### options.cleanTargetDir
Type: `Boolean`
Default value: `false`

Will clean target dir before running install.

#### options.cleanBowerDir
Type: `Boolean`
Default value: `false`

Will remove bower's dir after copying all needed files into target dir.

#### options.copy
Type: `Boolean`
Default value: `false`

Copy Bower packages to target directory.

#### options.cleanup
Type: `boolean`
Default value: `undefined`

**NOTE:** If set to true or false then both `cleanBowerDir` & `cleanTargetDir` are set to the value of `cleanup`.

#### options.layout
Type: `string` or `function`
Default value: `byType`

There are two built-in named layouts: `byType` and `byComponent`.

`byType` layout will produce the following structure:

```
lib
|-- js
|   |- bootstrap
|   \- require
|-- css
    \- bootstrap
```
where `js`, `css` come from `exportsOverride` section described below.

`byComponent` will group assets by type under component name:

```
lib
|-- bootstrap
|   |- js
|   \- css
|-- require
    \- js
```

If you need to support custom layout then you can specify `layout` as a function of `type`, `component` and `source`:

```js
var path = require('path');

grunt.initConfig({
  bower: {
    install: {
      options: {
        layout: function(type, component, source) {
          var renamedType = type;
          if (type == 'js') renamedType = 'javascripts';
          else if (type == 'css') renamedType = 'stylesheets';

          return path.join(component, renamedType);
        }
      }
    }
  }
});
```

You can use `source` parameter value in order to produce more flexible layout based on the resource file name.
Take a look at [PR #114][] as an example.

[PR #114]: https://github.com/yatskevich/grunt-bower-task/pull/114

#### options.verbose
Type: `boolean`
Default value: `false`

The task will provide more (debug) output when this option is set to `true`. You can also use `--verbose` when running task for same effect.

#### options.bowerOptions
Type: `Object`
Default value: `{}`

An options object passed through to the `bower.install` api, possible options are as follows:

```
{
    forceLatest: true|false,    // Force latest version on conflict
    production: true|false,     // Do not install project devDependencies
}
```

### Usage Examples

#### Default Options
Default options are good enough if you want to install Bower packages and keep only `"main"` files (as specified by package's `bower.json`) in separate directory.

```js
grunt.initConfig({
  bower: {
    install: {
      options: {
        copy: false,
        targetDir: './lib',
        layout: 'byType',
        install: true,
        verbose: false,
        prune: false,
        cleanTargetDir: false,
        cleanBowerDir: false,
        bowerOptions: {}
      }
    }
  }
});
```

#### Custom Options
In this initial version there are no more options in plugin itself. **BUT!**

### Advanced usage
At this point of time "Bower package" = "its git repository". It means that package includes tests, licenses, etc.
Bower's community actively discusses this issue (GitHub issues [#46][],[#88][], [on Google Groups][GG])
That's why you can find such tools like [blittle/bower-installer][] which inspired this project.

[GG]: https://groups.google.com/forum/?fromgroups=#!topic/twitter-bower/SQEDDA_gmh0
[#88]: https://github.com/twitter/bower/issues/88
[#46]: https://github.com/twitter/bower/issues/46
[blittle/bower-installer]: https://github.com/blittle/bower-installer

Okay, if you want more than `"main"` files in `./lib` directory then put `"exportsOverride"` section into your `bower.json`:

```json
{
  "name": "simple-bower",
  "version": "0.0.0",
  "dependencies": {
    "jquery": "~1.8.3",
    "bootstrap-sass": "*",
    "requirejs": "*"
  },
  "exportsOverride": {
    "bootstrap-sass": {
      "js": "js/*.js",
      "scss": "lib/*.scss",
      "img": "img/*.png"
    },
    "requirejs": {
      "js": "require.js"
    }
  }
}
```
`grunt-bower-task` will do the rest:

* If Bower package has defined `"main"` files then they will be copied to `./lib/<package>/`.
* If `"main"` files are empty then the whole package directory will be copied to `./lib`.
* When you define `"exportsOverride"` only asset types and files specified by you will be copied to `./lib`.

For the example above you'll get the following files in `.lib` directory:

```
jquery/jquery.js
js/bootstrap-sass/bootstrap-affix.js
...
js/bootstrap-sass/bootstrap-typeahead.js
js/requirejs/require.js
scss/bootstrap-sass/_accordion.scss
...
scss/bootstrap-sass/_wells.scss
scss/bootstrap-sass/bootstrap.scss
scss/bootstrap-sass/responsive.scss
img/bootstrap-sass/glyphicons-halflings-white.png
img/bootstrap-sass/glyphicons-halflings.png
```

### Wildcard and RegExp support

If you have the same override rules for multiple Bower components you can make use of simple wildcard:

```json
{
    "exportsOverride": {
        "bootstrap-*": {        // will match 'bootstrap-modal', 'bootstrap-notify', etc.
          "js": "**/*.js",
          "css": "**/*.css"
        },

        "*": {                  // will match everything else
          "js": "**/*.js",
          "css": "**/*.css"
        }
    }
}
```

You can use syntax which mirrors native JavaScript RegExp literal syntax, e.g. `/bootstrap.+/` or even `/jquery.date.v(\\d{1}).\\w{1}/`,
if you have complex matching rules.

Usage example in `bower.json`:

```json
{
  "exportsOverride": {
    "/jquery.date.v(\\d{1}).\\w{1}/": { // will match 'jquery.date.v1.2', 'jquery_date_v1_2'
      "js": "js/*.js"
    }
  }
}
```

#### Caveats

- An evaluation order depends on the order of entries in `exportsOverride` section in your `bower.json`.
- Pay attention to what characters you use in RegExp overrides - '.' and '*' has special meaning in regular expressions.
- If you put `*` as the first entry in `exportsOverride`, it'll match everything, so other rules will be skipped.

## License
Copyright (c) 2012-2013 Ivan Yatskevich

Licensed under the MIT license.

<https://github.com/yatskevich/grunt-bower-task/blob/master/LICENSE-MIT>
