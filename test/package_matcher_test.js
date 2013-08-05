'use strict';

var path = require('path');
var packageMatcher = require('../tasks/lib/package_matcher');

exports.packageMatcher = {

  matchesWildCard: function(test) {
    test.expect(4);

    test.ok(packageMatcher.matches('bootstrap.date', 'bootstrap.*'));
    test.ok(packageMatcher.matches('bootstrap.date', 'bootstrap*te'));
    test.ok(!packageMatcher.matches('bootstrap', 'bootstrap.*'));
    test.ok(!packageMatcher.matches('bootstrap.date', 'bootstrap.a*'));

    test.done();
  },

  matchesRegExp: function(test) {
    test.expect(4);

    test.ok(packageMatcher.matches('jquery.date', '/jq.+/'));

    var dotsPattern = '/jquery.date.v(\\d{1}).\\w{1}/';
    test.ok(packageMatcher.matches('jquery.date.v1.2', dotsPattern));
    test.ok(packageMatcher.matches('jqueryXdateXv1X2', dotsPattern)); // dot means 'any character' in RegEx
    test.ok(!packageMatcher.matches('jquery.date.v1.2', '/jquery.date.v(\\d{1}).\\w{2}/'));

    test.done();
  },

  regExpTakesPrecedance: function(test) {
    test.expect(1);

    test.ok(packageMatcher.matches('bootstrap.date', '/boo.*/'));

    test.done();
  }

};
