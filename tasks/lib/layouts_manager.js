var _ = require('lodash');
var path = require('path');

var handleUntyped = function(layout) {
  return function(type, pkg, sourceDir) {
    if (type === '__untyped__') {
      return pkg;
    }
    return layout(type, pkg, sourceDir);
  };
};

var defaultLayouts = {
  byType: handleUntyped(function(type, pkg) {
    return path.join(type, pkg);
  }),

  byComponent: handleUntyped(function(type, pkg) {
    return path.join(pkg, type);
  }),

  byTypeKeepStructure: handleUntyped(function(type, pkg, sourceDir) {
    return path.join(type, pkg, sourceDir);
  }),

  byComponentKeepStructure: handleUntyped(function(type, pkg, sourceDir) {
    return path.join(pkg, type, sourceDir);
  })
};

module.exports = {

  /**
   * Resolves named layouts, returns functions as is
   *
   * @param {string | Function} layout name or layout function
   * @param { Function } fail handler
   * @returns {Function} layout function
   */
  getLayout: function(layout, fail) {
    if (_.isFunction(layout)) {
      return layout;
    }

    if (!_.isString(layout)) {
      fail('Layout should be specified by name or as a function');
    }

    if (_(defaultLayouts).has(layout)) {
      return defaultLayouts[layout];
    }

    fail('The following named layouts are supported: ' + _.keys(defaultLayouts).join(', '));
  }

};