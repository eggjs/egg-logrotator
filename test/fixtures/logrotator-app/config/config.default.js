'use strict';

const path = require('path');

module.exports = () => {
  const exports = {
    logrotator: {
      filesRotateBySize: [
        path.join(__dirname, '../logs', 'logrotator', 'egg-web.log'),
        path.join(__dirname, '../logs', 'logrotator', 'size.log'),
      ],
      maxFileSize: 1024,
      maxFiles: 2,
      rotateDuration: 30000,
    },

    customLogger: {
      bizLogger: {
        file: path.join(__dirname, '../logs', 'mybiz', 'biz.log'),
        consoleLevel: 'NONE',
      },
      sizeLogger: {
        file: path.join(__dirname, '../logs', 'logrotator', 'size.log'),
      },
    },
  };
  return exports;
};
