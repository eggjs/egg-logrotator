'use strict';

var path = require('path');
module.exports = function(antx) {
  const exports = {
    logrotater: {
      filesRotateBySize: [path.join(__dirname, '../logs', 'logrotater', 'egg-web.log')],
      maxFileSize: 100,
      maxFiles: 2,
      rotateDuration: 60000
    }
  };
  return exports;
}