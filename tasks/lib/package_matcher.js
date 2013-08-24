module.exports = {

  /**
   * @param pkg - Bower package name
   * @param overrideKey - can be an exact package name, simplified wildcard or true RegExp
   * @returns {boolean}
   */
  matches: function(pkg, overrideKey) {
    if (pkg === overrideKey) {
      return true;
    }

    if (overrideKey.match(/^\/.*\/$/)) {
      var trueRegexMatcher = new RegExp(overrideKey.replace(/^\/|\/$/g, ''));
      return trueRegexMatcher.test(pkg);
    }

    if (overrideKey.indexOf('*') >= 0) {
      overrideKey = overrideKey.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&').replace('*', '.+');
      var wildcardMatcher = new RegExp(overrideKey);
      return wildcardMatcher.test(pkg);
    }

    return false;
  }

};
