'use strict';

const moment = require('moment');
const fs = require('mz/fs');
const debug = require('debug')('egg-logrotator:hour_rotator');
const Rotator = require('./rotator');


// rotate log by hour
// rename from foo.log to foo.log.YYYY-MM-DD-HH
class DayRotator extends Rotator {

  * getRotateFiles() {
    const files = new Map();
    const filesRotateByHour = this.app.config.logrotator.filesRotateByHour || [];

    for (const logPath of filesRotateByHour) {
      const exists = yield fs.exists(logPath);
      if (!exists) {
        continue;
      }
      this._setFile(logPath, files);
    }

    return files;
  }

  _setFile(srcPath, files) {
    if (!files.has(srcPath)) {
      const targetPath = srcPath + moment().subtract(1, 'hours').format('.YYYY-MM-DD-HH');
      debug('set file %s => %s', srcPath, targetPath);
      files.set(srcPath, { srcPath, targetPath });
    }
  }
}

module.exports = DayRotator;
