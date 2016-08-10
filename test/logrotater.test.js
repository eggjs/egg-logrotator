'use strict';

const path = require('path');
const mm = require('egg-mock');
const fs = require('fs');
const glob = require('glob');
const moment = require('moment');

require('should');

describe('test/logrotater.test.js', () => {
  afterEach(mm.restore);

  describe('logrotater', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'logrotater-app',
      });
      return app.ready();
    });
    after(() => app.close());

    const schedule = path.join(__dirname, '../app/schedule/rotateByFile');
    const now = moment().startOf('date');

    it('should rotate log file default', function* () {
      fs.writeFileSync(path.join(app.config.logger.dir, 'foo.log.0000-00-00'), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(30, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(50, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(6, 'months').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.customLogger.bizLogger.file, '..',
        `biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`), 'foo');

      yield app.runSchedule(schedule);

      const files = glob.sync(path.join(app.config.logger.dir, '*.log.*'));
      files.length.should.equal(10);
      files.filter(name => name.indexOf('foo.log.') > 0).should.length(6);
      files.forEach(file => {
        file.should.match(/log.\d{4}-\d{2}-\d{2}$/);
      });

      fs.existsSync(path.join(app.config.logger.dir, 'foo.log.0000-00-00')).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(30, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      // biz log should exists
      fs.existsSync(path.join(app.config.customLogger.bizLogger.file, '..',
        `biz.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`)).should.equal(true);

      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`)).should.equal(false);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)).should.equal(false);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(50, 'days').format('YYYY-MM-DD')}`)).should.equal(false);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(6, 'months').format('YYYY-MM-DD')}`)).should.equal(false);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`)).should.equal(false);

      // should remove 1 years ago biz log file
      fs.existsSync(path.join(app.config.customLogger.bizLogger.file, '..',
        `biz.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`)).should.equal(false);

      // run again should work
      yield app.runSchedule(schedule);
    });

    it('should mock unlink file error', function* () {
      mm(require('mz/fs'), 'unlink', function* () {
        throw new Error('mock unlink error');
      });
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');
      yield app.runSchedule(schedule);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
    });

    it('should mock readdir error', function* () {
      mm(require('mz/fs'), 'readdir', function* () {
        throw new Error('mock readdir error');
      });
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');
      yield app.runSchedule(schedule);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
    });

    it('should disable remove expired log files', function* () {
      mm(app.config.logrotater, 'maxDays', 0);
      fs.writeFileSync(path.join(app.config.logger.dir, 'foo.log.0000-00-00'), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`), 'foo');
      fs.writeFileSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`), 'foo');

      yield app.runSchedule(schedule);

      fs.existsSync(path.join(app.config.logger.dir, 'foo.log.0000-00-00')).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
      fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)).should.equal(true);
    });
  });

  describe('logrotater size', () => {
    let mockfile;
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'logrotater-app-size',
      });
      mockfile = path.join(app.config.logger.dir, 'egg-web.log');
      return app.ready();
    });

    after(() => app.close());

    it('should rotate by size', function* () {
      fs.writeFileSync(mockfile, 'mock log text');
      const schedule = path.join(__dirname, '../app/schedule/rotateBySize');
      yield app.runSchedule(schedule);
      yield sleep(100);
      fs.existsSync(`${mockfile}.1`).should.equal(true);
    });

    it('should keep maxFiles file only', function* () {
      fs.writeFileSync(mockfile, 'mock log text');
      // rotate first
      const schedule = path.join(__dirname, '../app/schedule/rotateBySize');
      yield app.runSchedule(schedule);
      yield sleep(100);

      // files second
      fs.writeFileSync(mockfile, 'mock log text');
      yield app.runSchedule(schedule);

      yield sleep(100);

      // files third
      fs.writeFileSync(mockfile, 'mock log text');
      yield app.runSchedule(schedule);
      yield sleep(100);
      const files = glob.sync(path.join(app.config.logger.dir, '*.log*'));
      console.log(files);
      fs.existsSync(`${mockfile}.1`).should.equal(true);
      fs.existsSync(`${mockfile}.2`).should.equal(true);
      fs.existsSync(`${mockfile}.3`).should.equal(false);
    });
  });
});

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
