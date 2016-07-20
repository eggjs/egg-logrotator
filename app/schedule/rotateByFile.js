'use strict';

const path = require('path');
const fs = require('mz/fs');
const moment = require('moment');

module.exports = function(app) {

  const exports = {};

  const logger = app.coreLogger;
  const loggerConfig = app.config.logger;
  const rotateLogDirs = loggerConfig.rotateLogDirs;
  const messenger = app.messenger;

  exports.schedule = {
    type: 'worker', // 类型 为 `all` 的定时任务在到执行时间时所有的进程都会执行
    cron: '0 0 * * *', // 直接指定执行的间隔，支持 ms 格式的字符串或者毫秒级别的数值
  };
  // 开始切割指定目录下所有的 log 文件
  exports.task = function* () {
    try {
      const tasks = rotateLogDirs.map(logdir => renameLogfiles(logdir));
      yield tasks;

      // tell master send reload logger message
      logger.info('[egg-logrotater] broadcast log-reload to workers');
      messenger.sendToApp('log-reload');
      messenger.sendToAgent('log-reload');
    } catch (err) {
      logger.error(err);
    }
  };

  // 将目录下的日志文件全部重命名
  function* renameLogfiles(logdir) {
    const logname = moment().subtract(1, 'days').format('.YYYY-MM-DD');
    const files = yield fs.readdir(logdir);
    const names = files.filter(name => name.endsWith('.log'));
    if (names.length === 0) {
      return;
    }

    logger.info(`[egg-logrotater] start rename files:${names} to ${logdir}/*.log${logname}`);

    yield names.map(name => function* () {
      const logfile = path.join(logdir, name);
      const newLogfile = logfile + logname;
      const exists = yield fs.exists(newLogfile);
      if (exists) {
        return logger.error(`[egg-logrotater] logfile ${newLogfile} exists!!!`);
      }
      try {
        yield fs.rename(logfile, newLogfile);
      } catch (err) {
        err.message = `[egg-logrotater] rename logfile ${logfile} to ${newLogfile} ${err.message}`;
        logger.error(err);
      }
    });
  }

  return exports;
};
