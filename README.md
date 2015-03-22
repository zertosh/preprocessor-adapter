# ProprocessorAdapter

## Example

```js
// ./resources/preprocessor.js
var babel = require('babel-core');
var PreprocessorAdapter = require('preprocessor-adapter');

module.exports = PreprocessorAdapter.create({
  extensions: ['.js', 'jsx'],
  filter: function(file) {
    // not in "node_modules"
    return !/\bnode_modules\b/.test(file);
  },
  transform: function(src, file) {
    return babel.transform({loose: 'all'});
  }
});
```

```js
// node
require('./resources/preprocessor').register();

// browserify
browserify('main.js')
  .transform(require('./resources/preprocessor'))
  .bundle()
  .pipe(fs.createWriteStream('bundle.js'));

// jest (in package.json)
{
  "jest": {
    "scriptPreprocessor": "<rootDir>/resources/preprocessor.js"
  }
}
```
