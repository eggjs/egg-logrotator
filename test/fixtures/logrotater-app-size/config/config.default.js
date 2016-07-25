'use strict';

const path = require('path');

module.exports = appInfo => {
  const exports = {
    logrotater: {
      filesRotateBySize: [ path.join(appInfo.baseDir, `logs/${appInfo.name}/egg-web.log`) ],
      maxFileSize: 1,
      maxFiles: 2,
      rotateDuration: 60000,
    },
  };
  return exports;
};
