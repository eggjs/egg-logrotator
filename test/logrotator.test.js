'use strict';

const path = require('path');
const mm = require('egg-mock');
const fs = require('fs');
const glob = require('glob');
const moment = require('moment');
const request = require('supertest');


require('should');

describe('test/logrotator.test.js', () => {
  afterEach(mm.restore);

  describe('logrotator', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'logrotator-app',
      });
      return app.ready();
    });
    after(() => app.close());

    const schedule = path.join(__dirname, '../app/schedule/rotate_by_file');
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
      msg.should.equal(`[egg-logrotator] logfile ${file2} exists!!!`);
    });

    it('should error when rename error', function* () {
      const file1 = path.join(app.config.logger.dir, 'foo1.log');
      fs.writeFileSync(file1, 'foo');
      mm(app.coreLogger, 'error', err => {
        err.message.should.match(/^\[egg-logrotator\] rename logfile .*?, rename error$/);
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
      mm(app.config.logrotator, 'maxDays', 0);
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

  describe('logrotator size', () => {
    let mockfile;
    let app;
    const schedule = path.join(__dirname, '../app/schedule/rotate_by_size');
    before(() => {
      app = mm.app({
        baseDir: 'logrotator-app-size',
      });
      mockfile = path.join(app.config.logger.dir, 'egg-web.log');
      return app.ready();
    });

    after(() => app.close());

    it('should rotate by size', function* () {
      fs.writeFileSync(mockfile, 'mock log text');
      yield app.runSchedule(schedule);
      yield sleep(100);
      fs.existsSync(`${mockfile}.1`).should.equal(true);
    });

    it('should keep maxFiles file only', function* () {
      fs.writeFileSync(mockfile, 'mock log text');
      // rotate first
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
      if (process.platform !== 'win32') {
        // test fail on windows
        fs.existsSync(`${mockfile}.2`).should.equal(true);
      }
      fs.existsSync(`${mockfile}.3`).should.equal(false);
    });

    it('should error when stat error', function* () {
      fs.writeFileSync(mockfile, 'mock log text');
      mm(require('mz/fs'), 'stat', function* () {
        throw new Error('stat error');
      });
      let msg = '';
      mm(app.coreLogger, 'error', err => {
        msg = err.message;
      });
      yield app.runSchedule(schedule);
      msg.should.eql('[egg-logrotator] stat error');

    });
  });

  describe('reload logger', () => {
    let app;
    const baseDir = path.join(__dirname, 'fixtures/logger-reload');
    before(() => {
      app = mm.cluster({
        baseDir: 'logger-reload',
      });
      return app.ready();
    });
    // logging to files
    before(() => {
      return request(app.callback())
      .get('/log')
      .expect({
        method: 'GET',
        path: '/log',
      })
      .expect(200);
    });
    // start rotating
    before(() => {
      return request(app.callback())
      .get('/rotate')
      .expect(200);
    });

    after(() => app.close());

    it('should reload worker loggers', function* () {
      yield sleep(2000);

      const logname = moment().subtract(1, 'days').format('.YYYY-MM-DD');
      const logfile1 = path.join(baseDir, 'logs/logger-reload/logger-reload-web.log');
      const content1 = fs.readFileSync(logfile1, 'utf8');
      content1.should.equal('');

      const logfile2 = path.join(baseDir, `logs/logger-reload/logger-reload-web.log${logname}`);
      const content2 = fs.readFileSync(logfile2, 'utf8');
      content2.should.containEql('GET /');

      const logfile3 = path.join(baseDir, `logs/logger-reload/egg-agent.log${logname}`);
      const content3 = fs.readFileSync(logfile3, 'utf8');
      content3.should.containEql('agent warn');

      yield request(app.callback())
      .get('/log')
      .expect(200);

      // will logging to new file
      const content4 = fs.readFileSync(logfile1, 'utf8');
      content4.should.containEql('GET /');
    });
  });
});

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
