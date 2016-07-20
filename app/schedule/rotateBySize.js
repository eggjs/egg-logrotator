'use strict';

const fs = require('mz/fs');

module.exports = function(app) {

  const exports = {};

  const logger = app.coreLogger;
  const appLogrotatorConfig = app.config.logrotater;
  const filesRotateBySize = appLogrotatorConfig.filesRotateBySize || [];
  const maxFileSize = appLogrotatorConfig.maxFileSize;
  const maxFiles = appLogrotatorConfig.maxFiles;
  const messenger = app.messenger;

  exports.schedule = {
    interval: appLogrotatorConfig.rotateDuration,
    type: 'worker',
    disable: filesRotateBySize.length === 0, // 没配置则关闭
  };

  exports.task = function* checkFileSize() {

    let needSendMessage = false;

    yield filesRotateBySize.map(logfile => function* () {
      try {
        const stat = yield fs.stat(logfile);
        if (stat.size >= maxFileSize) {
          logger.info(`[egg-logrotater] file ${logfile} reach the maximum file size, current size: ${stat.size}, max size: ${maxFileSize}`);
          needSendMessage = true;
          yield rotateBySize(logfile);
        }
      } catch (e) {
        e.message = `[egg-logrotater] ${e.message}`;
        logger.error(e);
      }
    });
    if (needSendMessage) {
      messenger.sendToApp('log-reload');
      messenger.sendToAgent('log-reload');
    }


  };


  function* rotateBySize(logfile) {
    const exists = yield fs.exists(logfile);
    if (!exists) {
      return;
    }
    // remove max
    const maxFileName = `${logfile}.${maxFiles}`;
    const maxExists = yield fs.exists(maxFileName);
    if (maxExists) {
      yield fs.unlink(maxFileName);
    }
    // 2->3, 1->2
    for (let i = maxFiles - 1; i >= 1; i--) {
      yield renameOrDelete(`${logfile}.${i}`, `${logfile}.${i + 1}`);
    }
    // logfile => logfile.1
    yield fs.rename(logfile, `${logfile}.1`);

    logger.info('[egg-logrotater] broadcast egg-logrotater-reload to workers');
  }

  // 如果文件存在，尝试备份，如果备份失败，直接删除文件。这个操作只会对按文件大小切分的场景生效。
  function* renameOrDelete(targetPath, backupPath) {
    const targetExists = yield fs.exists(targetPath);
    if (!targetExists) {
      return;
    }
    const backupExists = yield fs.exists(backupPath);
    if (backupExists) {
      yield fs.unlink(targetPath);
    } else {
      yield fs.rename(targetPath, backupPath);
    }
  }

  return exports;
};
