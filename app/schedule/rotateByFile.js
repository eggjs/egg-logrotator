'use strict';

const path = require('path');
const fs = require('mz/fs');
const moment = require('moment');

module.exports = app => {
  const exports = {};

  const logger = app.coreLogger;
  const rotateLogDirs = app.config.logger.rotateLogDirs;
  const messenger = app.messenger;

  exports.schedule = {
    type: 'worker', // 类型 为 `all` 的定时任务在到执行时间时所有的进程都会执行
    cron: '0 0 * * *', // 直接指定执行的间隔，支持 ms 格式的字符串或者毫秒级别的数值
  };
  exports.task = function* () {
    const maxDays = app.config.logrotater.maxDays;
    if (maxDays && maxDays > 0) {
      try {
        yield rotateLogDirs.map(logdir => removeExpiredLogFiles(logdir, maxDays));
      } catch (err) {
        logger.error(err);
      }
    }

    try {
      yield rotateLogDirs.map(logdir => renameLogfiles(logdir));
      // tell master send reload logger message
      logger.info('[egg-logrotater] broadcast log-reload to workers');
      messenger.sendToApp('log-reload');
      messenger.sendToAgent('log-reload');
    } catch (err) {
      logger.error(err);
    }
  };

  // rename xxx.log => xxx.log.YYYY-MM-DD
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

  // remove expired log files: xxx.log.YYYY-MM-DD
  function* removeExpiredLogFiles(logdir, maxDays) {
    const files = yield fs.readdir(logdir);
    const expriedDate = moment().subtract(maxDays, 'days').startOf('date');
    const names = files.filter(file => {
      const name = path.extname(file).substring(1);
      if (!/^\d{4}\-\d{2}\-\d{2}$/.test(name)) {
        return false;
      }
      const date = moment(name, 'YYYY-MM-DD').startOf('date');
      if (!date.isValid()) {
        return false;
      }
      return date.isBefore(expriedDate);
    });
    if (names.length === 0) {
      return;
    }

    logger.info(`[egg-logrotater] start remove ${logdir} files: ${names.join(', ')}`);

    yield names.map(name => function* () {
      const logfile = path.join(logdir, name);
      try {
        yield fs.unlink(logfile);
      } catch (err) {
        err.message = `[egg-logrotater] remove logfile ${logfile} error, ${err.message}`;
        logger.error(err);
      }
    });
  }

  return exports;
};
