'use strict';

const path = require('path');
const fs = require('mz/fs');
const moment = require('moment');

module.exports = app => ({

  schedule: {
    type: 'worker', // only one worker run this task
    cron: '0 0 * * *', // run every day at 00:00
  },

  * task() {
    const logger = app.coreLogger;
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

    try {
      yield logDirs.map(logdir => renameLogfiles(logdir, logger));
    } catch (err) {
      logger.error(err);
    }

    // tell every one to reload logger
    logger.info('[egg-logrotator] logrotate by file');
    logger.info('[egg-logrotator] broadcast log-reload to workers, logDirs: %j', logDirs);
    app.messenger.sendToApp('log-reload');
    app.messenger.sendToAgent('log-reload');
  },
});


// rename xxx.log => xxx.log.YYYY-MM-DD
function* renameLogfiles(logdir, logger) {
  const logname = moment().subtract(1, 'days').format('.YYYY-MM-DD');
  const files = yield fs.readdir(logdir);
  const names = files.filter(name => name.endsWith('.log'));
  if (names.length === 0) {
    return;
  }

  logger.info(`[egg-logrotator] start rename files:${names} to ${logdir}/*.log${logname}`);

  yield names.map(name => function* () {
    const logfile = path.join(logdir, name);
    const newLogfile = logfile + logname;
    const exists = yield fs.exists(newLogfile);
    if (exists) {
      const err = new Error(`[egg-logrotator] logfile ${newLogfile} exists!!!`);
      return logger.error(err);
    }
    try {
      yield fs.rename(logfile, newLogfile);
    } catch (err) {
      err.message = `[egg-logrotator] rename logfile ${logfile} to ${newLogfile}, ${err.message}`;
      logger.error(err);
    }
  });
}
