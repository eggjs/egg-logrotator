'use strict';

/**
 * logrotator options
 * @member Config#logrotator
 * @property {Array} filesRotateBySize - Array for files path which need rotate
 * @property {Number} maxFileSize - Max file size to judge if any file need rotate
 * @property {Number} maxFiles - pieces rotate by size
 * @property {Number} maxDays - keep max days log files, default is `31`. Set `0` to keep all logs.
 * @property {Number} rotateDuration - time interval to judge if any file need rotate
 */
exports.logrotator = {
  filesRotateBySize: [],
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 10,
  rotateDuration: 60000,
  maxDays: 31,
};
