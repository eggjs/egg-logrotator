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

    customLogger: {
      bizLogger: {
        file: path.join(__dirname, '../logs', 'mybiz', 'biz.log'),
        consoleLevel: 'NONE',
      },
    },
  };
  return exports;
};
