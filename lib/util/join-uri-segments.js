/* jshint node: true */
'use strict';
function joinUriSegments(prefix, uri) {
  return prefix === '' ? uri : [prefix, uri].join('/');
}

module.exports = joinUriSegments;
