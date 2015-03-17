/**
 * "PreprocessorAdapter" creates a generic source transformation API for
 * Browserify, Jest and Node.
 */
'use strict';

var fs = require('fs');
var through = require('through2');

var _extensions = ['.js', '.jsx'];
var _filter = function(file) { return _rallowed.test(file); };
// not in "node_modules" and is a ".js" or ".jsx"
var _rallowed = /^(?!.*?\bnode_modules\b).+\.(js|jsx)$/;

function withErrorDetails(err, file) {
  err.name = 'PreprocessorAdapter';
  if (file) {
    err.message = file + ': ' + err.message;
    err.fileName = file;
  }
  return err;
}

function stripBOM(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function concat(cb) {
  var buffers = [];
  return through(function(chunk, enc, next) {
    buffers.push(chunk);
    next();
  }, function(next) {
    cb.call(this, Buffer.concat(buffers).toString(), next);
  });
}

var registered;

var PreprocessorAdapter = {

  create: function(opts) {
    if (!opts) {
      throw new Error('options are required');
    }

    var transform = opts.transform;
    var wrap = opts.wrap;
    var extensions = opts.extensions || _extensions;
    var filter = opts.filter || _filter;

    // browserify - transform
    // https://github.com/substack/node-browserify#btransformtr-opts
    var custom = function(file, options) {
      if (!filter(file)) {
        return through();
      }
      return concat(function(src, next) {
        try {
          // no "stripBOM" because browserify will do it's own "stripBOM"
          this.push(transform(src, file));
        } catch(err) {
          this.emit('error', withErrorDetails(err, file));
        }
        next();
      });
    };

    // browserify - plugin (on wrap)
    // https://github.com/substack/node-browserify#bpluginplugin-opts
    custom.plugin = function plugin(b, options) {
      b.pipeline.get('wrap').push(concat(function(src, next) {
        try {
          this.push(wrap(src));
        } catch(err) {
          this.emit('error', withErrorDetails(err));
        }
        next();
      }));
      b.once('reset', function() {
        plugin(b, options);
      });
    };

    // jest
    // https://facebook.github.io/jest/docs/api.html#config-scriptpreprocessor-string
    custom.process = function(src, file) {
      src = stripBOM(src);
      if (!filter(file)) {
        return src;
      }
      try {
        return transform(src, file);
      } catch(err) {
        throw withErrorDetails(err, file);
      }
    };

    // node
    // https://nodejs.org/api/globals.html#globals_require_extensions
    custom.register = function() {
      if (registered) {
        return;
      }
      function compile(module, file) {
        var src = stripBOM(fs.readFileSync(file, 'utf8'));
        if (!filter(file)) {
          module._compile(src, file);
          return;
        }
        try {
          module._compile(transform(src, file), file);
        } catch(err) {
          throw withErrorDetails(err, file);
        }
      }
      extensions.forEach(function(ext) { require.extensions[ext] = compile; });
      registered = true;
    };

    return custom;
  }
};

module.exports = PreprocessorAdapter;
