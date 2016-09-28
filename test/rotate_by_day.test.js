'use strict';

const path = require('path');
const mm = require('egg-mock');
const fs = require('fs');
const glob = require('glob');
const moment = require('moment');
const assert = require('power-assert');


describe('test/rotate_by_day.test.js', () => {

  let app;
  before(() => {
    app = mm.app({
      baseDir: 'logrotator-app',
      cache: false,
    });
    return app.ready();
  });
  after(() => app.close());
  afterEach(mm.restore);

  const schedule = path.join(__dirname, '../app/schedule/rotate_by_file');
  const now = moment().startOf('date');

  it('should rotate log file default', function* () {
    yield app.runSchedule(schedule);

    const files = glob.sync(path.join(app.config.logger.dir, '*.log.*'));
    assert.equal(files.length, 4);
    assert(files.filter(name => name.indexOf('foo.log.') > 0));
    files.forEach(file => assert(/log.\d{4}-\d{2}-\d{2}$/.test(file)));

    const logDir = app.config.logger.dir;
    const date = now.clone().subtract(1, 'days').format('YYYY-MM-DD');
    assert.equal(fs.existsSync(path.join(logDir, `egg-web.log.${date}`)), true);
    // schedule will not reload logger
    assert.equal(fs.existsSync(path.join(logDir, 'egg-web.log')), false);
    assert.equal(fs.existsSync(path.join(logDir, `egg-agent.log.${date}`)), true);
    assert.equal(fs.existsSync(path.join(logDir, 'egg-agent.log')), false);
    assert.equal(fs.existsSync(path.join(logDir, `logrotator-web.log.${date}`)), true);
    assert.equal(fs.existsSync(path.join(logDir, 'logrotator-web.log')), false);
    assert.equal(fs.existsSync(path.join(logDir, `common-error.log.${date}`)), true);
    assert.equal(fs.existsSync(path.join(logDir, 'common-error.log')), false);

    // run again should work
    yield app.runSchedule(schedule);
  });

  it('should error when rename to existed file', function* () {
    const file1 = path.join(app.config.logger.dir, 'foo1.log');
    const file2 = path.join(app.config.logger.dir,
      `foo1.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`);
    fs.writeFileSync(file1, 'foo');
    fs.writeFileSync(file2, 'foo');
    let msg = '';
    mm(app.coreLogger, 'error', err => {
      msg = err.message;
    });
    yield app.runSchedule(schedule);
    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
    assert(msg === `[egg-logrotator] rename ${file1}, found exception: targetFile ${file2} exists!!!`);
  });

  it('should error when rename error', function* () {
    const file1 = path.join(app.config.logger.dir, 'foo1.log');
    fs.writeFileSync(file1, 'foo');
    mm(app.coreLogger, 'error', err => {
      assert(/^\[egg-logrotator\] rename .*?, found exception: rename error$/.test(err.message));
    });
    mm(require('mz/fs'), 'rename', function* () {
      throw new Error('rename error');
    });
    yield app.runSchedule(schedule);
  });

  it('should mock unlink file error', function* () {
    mm(require('mz/fs'), 'unlink', function* () {
      throw new Error('mock unlink error');
    });
    fs.writeFileSync(path.join(app.config.logger.dir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');
    yield app.runSchedule(schedule);
    assert(fs.existsSync(path.join(app.config.logger.dir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)));
  });

  it('should mock readdir error', function* () {
    mm(require('mz/fs'), 'readdir', function* () {
      throw new Error('mock readdir error');
    });
    fs.writeFileSync(path.join(app.config.logger.dir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');
    yield app.runSchedule(schedule);
    assert(fs.existsSync(path.join(app.config.logger.dir,
      `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)));
  });

});
