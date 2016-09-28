'use strict';

const path = require('path');
const moment = require('moment');
const fs = require('mz/fs');
const Rotator = require('./rotator');


// rotate log by day
// rename from foo.log to foo.log.YYYY-MM-DD
class DayRotator extends Rotator {

  constructor(options) {
    super(options);
    this.filesRotateBySize = this.app.config.logrotator.filesRotateBySize || [];
    this.filesRotateByHour = this.app.config.logrotator.filesRotateByHour || [];
  }

  * getRotateFiles() {
    const files = new Map();
    const loggers = this.app.loggers;
    for (const key in loggers) {
      this._setFile(loggers[key].options.file, files);
    }

    // rotateLogDirs is deprecated
    const rotateLogDirs = this.app.config.logger.rotateLogDirs;
    if (rotateLogDirs && rotateLogDirs.length > 0) {
      this.app.deprecate('[egg-logrotator] Do not use app.config.logger.rotateLogDirs, only rotate core loggers and custom loggers');
      for (const dir of rotateLogDirs) {
        try {
          const names = yield fs.readdir(dir);
          for (const name of names) {
            if (!name.endsWith('.log')) {
              continue;
            }
            this._setFile(path.join(dir, name), files);
          }
        } catch (err) {
          this.logger.error(err);
        }
      }
    }

    return files;
  }

  _setFile(srcPath, files) {
    // don't rotate logPath in filesRotateBySize
    if (this.filesRotateBySize.indexOf(srcPath) > -1) {
      return;
    }

    // don't rotate logPath in filesRotateByHour
    if (this.filesRotateByHour.indexOf(srcPath) > -1) {
      return;
    }

    if (!files.has(srcPath)) {
      const targetPath = srcPath + moment().subtract(1, 'days').format('.YYYY-MM-DD');
      files.set(srcPath, { srcPath, targetPath });
    }
  }
}

module.exports = DayRotator;
