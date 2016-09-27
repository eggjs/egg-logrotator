'use strict';

const fs = require('mz/fs');

module.exports = app => {
  const exports = {};

  const logger = app.coreLogger;
  const appLogrotatorConfig = app.config.logrotator;
  const filesRotateBySize = appLogrotatorConfig.filesRotateBySize || [];
  const maxFileSize = appLogrotatorConfig.maxFileSize;
  const maxFiles = appLogrotatorConfig.maxFiles;
  const messenger = app.messenger;

  exports.schedule = {
    interval: appLogrotatorConfig.rotateDuration,
    type: 'worker',
    disable: filesRotateBySize.length === 0,
  };

  exports.task = function* checkFileSize() {
    let needSendMessage = false;

    yield filesRotateBySize.map(logfile => function* () {
      try {
        const exists = yield fs.exists(logfile);
        if (!exists) {
          return;
        }
        const stat = yield fs.stat(logfile);
        if (stat.size >= maxFileSize) {
          logger.info(`[egg-logrotator] file ${logfile} reach the maximum file size, current size: ${stat.size}, max size: ${maxFileSize}`);
          needSendMessage = true;
          yield rotateBySize(logfile);
        }
      } catch (e) {
        e.message = `[egg-logrotator] ${e.message}`;
        logger.error(e);
      }
    });

    if (needSendMessage) {
      logger.info('[egg-logrotator] logrotate by size');
      logger.info('[egg-logrotator] broadcast log-reload to workers');
      messenger.sendToApp('log-reload');
      messenger.sendToAgent('log-reload');
    }
  };

  function* rotateBySize(logfile) {
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
  }

  // rename from srcPath to targetPath, for example foo.log.1 > foo.log.2
  function* renameOrDelete(srcPath, targetPath) {
    const srcExists = yield fs.exists(srcPath);
    if (!srcExists) {
      return;
    }
    const targetExists = yield fs.exists(targetPath);
    // if target file exists, then delete it,
    // because the target file always be renamed first.
    if (targetExists) {
      yield fs.unlink(srcPath);
    } else {
      yield fs.rename(srcPath, targetPath);
    }
  }

  return exports;
};
