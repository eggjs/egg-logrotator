'use strict';

const path = require('path');
const fs = require('mz/fs');
const moment = require('moment');

module.exports = app => {
  const exports = {};

  const logger = app.coreLogger;

  exports.schedule = {
    type: 'worker', // only one worker run this task
    cron: '0 0 * * *', // run every day at 00:00
  };
  exports.task = function* () {
    let logDirs = [];
    // try to use rotateLogDirs first
    if (app.config.logger.rotateLogDirs && app.config.logger.rotateLogDirs.length > 0) {
      logDirs = logDirs.concat(app.config.logger.rotateLogDirs);
    }
    // auto find all log dir
    for (const key in app.loggers) {
      const logDir = path.dirname(app.loggers[key].options.file);
      if (logDirs.indexOf(logDir) === -1) {
        logDirs.push(logDir);
      }
    }

    const maxDays = app.config.logrotater.maxDays;
    if (maxDays && maxDays > 0) {
      try {
        yield logDirs.map(logdir => removeExpiredLogFiles(logdir, maxDays));
      } catch (err) {
        logger.error(err);
      }
    }

    try {
      yield logDirs.map(logdir => renameLogfiles(logdir));
    } catch (err) {
      logger.error(err);
    }

    // tell every one to reload logger
    logger.info('[egg-logrotater] broadcast log-reload to workers, logDirs: %j', logDirs);
    app.messenger.sendToApp('log-reload');
    app.messenger.sendToAgent('log-reload');
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
