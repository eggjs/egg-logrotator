'use strict';

/**
 * logrotater options
 * @member Config#logrotater
 * @property {Array} filesRotateBySize - 需要按大小切割的文件，其他日志文件仍按照通常方式切割
 * @property {Number} maxFileSize - 最大文件大小，默认为50m
 * @property {Number} maxFiles - 按大小切割时，文件最大切割的份数
 * @property {Number} rotateDuration - 按大小切割时，文件扫描的间隔时间
 */
exports.logrotater = {
  filesRotateBySize: [],
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 10,
  rotateDuration: 60000,
};
