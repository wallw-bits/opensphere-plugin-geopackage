/* eslint-env es6 */

'use strict';

const fs = require('fs');
const path = require('path');
const resolver = require('opensphere-build-resolver/utils');


/**
 * Resources for `bits-index` to include in the distribution and both
 * `index.html` and `tools.html`.
 * @type {Array<Object>}
 */
const sharedResources = [
  {
    source: resolver.resolveModulePath('@ngageoint/geopackage', __dirname),
    target: 'vendor/geopackage',
    scripts: ['dist/geopackage.js']
  }
];
