'use strict';

const path = require('path');

module.exports = () => {
  const exports = {
    logrotater: {
      filesRotateBySize: [ path.join(__dirname, '../logs', 'logrotater', 'egg-web.log') ],
      maxFileSize: 1024,
      maxFiles: 2,
      rotateDuration: 30000,
    },
  };
  return exports;
};
