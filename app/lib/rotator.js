'use strict';

const assert = require('assert');
const fs = require('mz/fs');

class Rotator {

  constructor(options) {
    this.options = options || {};
    assert(this.options.app, 'options.app is required');
    this.app = this.options.app;
    this.logger = this.app.coreLogger;
  }

  * getRotateFiles() {
    return new Map();
  }

  * rotate() {
    const files = yield this.getRotateFiles();
    const rotatedFile = [];
    for (const file of files.values()) {
      try {
        yield renameOrDelete(file.srcPath, file.targetPath);
        rotatedFile.push(`${file.srcPath} -> ${file.targetPath}`);
      } catch (err) {
        err.message = `[egg-logrotator] rename ${file.srcPath}, found exception: ` + err.message;
        this.logger.error(err);
      }
    }

    if (rotatedFile.length) {
      // tell every one to reload logger
      this.logger.info('[egg-logrotator] broadcast log-reload to workers');
      this.app.messenger.sendToApp('log-reload');
      this.app.messenger.sendToAgent('log-reload');
    }

    this.logger.info('[egg-logrotator] rotate files success by %s, files %j',
      this.constructor, rotatedFile);
  }
}

module.exports = Rotator;

// rename from srcPath to targetPath, for example foo.log.1 > foo.log.2
function* renameOrDelete(srcPath, targetPath) {
  if (srcPath === targetPath) {
    return;
  }
  const srcExists = yield fs.exists(srcPath);
  if (!srcExists) {
    return;
  }
  const targetExists = yield fs.exists(targetPath);
  // if target file exists, then throw
  // because the target file always be renamed first.
  if (targetExists) {
    const err = new Error(`targetFile ${targetPath} exists!!!`);
    throw err;
  }
  yield fs.rename(srcPath, targetPath);
}
