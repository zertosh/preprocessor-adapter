/*eslint-disable no-shadow*/
'use strict';

var test = require('tape');

test('preprocessor-adapter', function(t) {

  var PreprocessorAdapter = require('../');

  t.test('loads', function(t) {
    t.ok(PreprocessorAdapter.create);
    t.end();
  });

  t.end();
});
