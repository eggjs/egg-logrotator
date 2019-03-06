'use strict';

const path = require('path');
const mm = require('egg-mock');
const fs = require('fs');
const glob = require('glob');
const moment = require('moment');
const assert = require('assert');
const rimraf = require('mz-modules/rimraf');
const mkdirp = require('mz-modules/mkdirp');
const FileTransport = require('egg-logger').FileTransport;

const schedule = path.join(__dirname, '../app/schedule/clean_log');
const now = moment().startOf('date');

describe('test/clean_log.test.js', () => {
  afterEach(mm.restore);

  let app;
  let logDir;
  before(async () => {
    app = mm.app({
      baseDir: 'clean-log',
      cache: false,
    });
    await app.ready();
    logDir = app.config.logger.dir;
    app.loggers.get('bizLogger').set('anotherFile', new FileTransport({
      file: path.join(app.config.customLogger.bizLogger.file, '..', 'another-biz.log'),
    }));
  });
  after(() => app.close());


  it('should clean log by maxDays', function* () {
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(30, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `biz.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `another-biz.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(50, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(6, 'months').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `another-biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`), 'foo');

    yield app.runSchedule(schedule);

    const files = glob.sync(path.join(logDir, '*.log.*'));
    assert(files.length, 10);
    assert(files.filter(name => name.indexOf('foo.log.') > 0));

    let filepath;
    filepath = `foo.log.${now.format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)));

    // won't clean, because maxDay is 31
    filepath = `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)));

    filepath = `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)));

    filepath = `foo.log.${now.clone().subtract(30, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)));

    filepath = `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)));

    assert(fs.existsSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `biz.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`)));

    assert(fs.existsSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `another-biz.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo'));

    // clean below
    filepath = `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)) === false);

    filepath = `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)) === false);

    filepath = `foo.log.${now.clone().subtract(50, 'days').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)) === false);

    filepath = `foo.log.${now.clone().subtract(6, 'months').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)) === false);

    filepath = `foo.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)) === false);

    assert(fs.existsSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`)) === false);

    assert(fs.existsSync(path.join(app.config.customLogger.bizLogger.file, '..',
      `another-biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`), 'foo') === false);
  });

  it('should not clean log with invalid date', function* () {
    // invalid date
    fs.writeFileSync(path.join(logDir, 'foo.log.0000-00-00'), 'foo');

    yield app.runSchedule(schedule);

    const filepath = 'foo.log.0000-00-00';
    assert(fs.existsSync(path.join(logDir, filepath)));
  });

  it('should not clean log with invalid formmat', function* () {
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYYMMDD')}`), 'foo');

    yield app.runSchedule(schedule);

    const filepath = `foo.log.${now.clone().subtract(33, 'days').format('YYYYMMDD')}`;
    assert(fs.existsSync(path.join(logDir, filepath)));
  });

  it('should clean log with YYYY-MM-DD-HH', function* () {
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD-HH')}`), 'foo');

    yield app.runSchedule(schedule);

    // should clean log.YYYY-MM-DD-HH
    const filepath = `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD-HH')}`;
    assert(fs.existsSync(path.join(logDir, filepath)) === false);
  });

  it('should error when readdir err', function* () {
    mm(require('mz/fs'), 'readdir', dir => new Promise((_, reject) => reject(new Error(`Permission: readdir ${dir}`))));
    let message;
    mm(app.coreLogger, 'error', err => (message = err.message));

    const filepath = `foo.log.${now.clone().subtract(35, 'days').format('YYYY-MM-DD')}`;
    fs.writeFileSync(path.join(logDir, filepath), 'foo');

    yield app.runSchedule(schedule);

    assert(/Permission: readdir/.test(message));
    // unlink error, file should exist
    assert(fs.existsSync(path.join(logDir, filepath)) === true);
  });

  it('should ignore clean when exception', function* () {
    mm(require('mz/fs'), 'unlink', file => new Promise((_, reject) => reject(new Error(`unlink ${file} error`))));
    let message;
    mm(app.coreLogger, 'error', err => (message = err.message));

    const filepath = `foo.log.${now.clone().subtract(34, 'days').format('YYYY-MM-DD')}`;
    fs.writeFileSync(path.join(logDir, filepath), 'foo');

    yield app.runSchedule(schedule);

    assert(/unlink .*?foo.log.\d{4}-\d{2}-\d{2} error$/.test(message));
    // unlink error, file should exist
    assert(fs.existsSync(path.join(logDir, filepath)) === true);
  });

  it('should disable clean log when set maxDays = 0', function* () {
    mm(app.config.logrotator, 'maxDays', 0);
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`), 'foo');
    fs.writeFileSync(path.join(logDir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');

    yield app.runSchedule(schedule);

    assert(fs.existsSync(path.join(logDir,
      `foo.log.${now.format('YYYY-MM-DD')}`)));
    assert(fs.existsSync(path.join(logDir,
      `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`)));
    assert(fs.existsSync(path.join(logDir,
      `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`)));
    assert(fs.existsSync(path.join(logDir,
      `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`)));
    assert(fs.existsSync(path.join(logDir,
      `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`)));
    assert(fs.existsSync(path.join(logDir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)));
  });

  // windows can't remove un close file, ignore it
  if (process.platform !== 'win32') {
    it('should ignore when log dir not exists', function* () {
      let message;
      mm(app.coreLogger, 'error', err => (message = err.message));

      const customLoggerDir = path.join(app.config.customLogger.bizLogger.file, '..');
      const logfile = path.join(customLoggerDir,
        `biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`);
      fs.writeFileSync(logfile, 'foo');
      yield rimraf(customLoggerDir);

      yield app.runSchedule(schedule);
      assert(!message);
      yield mkdirp(customLoggerDir);
    });
  }
});
