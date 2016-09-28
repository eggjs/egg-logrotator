'use strict';

const path = require('path');
const mm = require('egg-mock');
const fs = require('fs');
const glob = require('glob');
const moment = require('moment');
const request = require('supertest');
const assert = require('power-assert');


describe('test/logrotator.test.js', () => {
  afterEach(mm.restore);

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
      assert(fs.existsSync(`${mockfile}.1`));
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
      assert(fs.existsSync(`${mockfile}.1`));
      if (process.platform !== 'win32') {
        // test fail on windows
        assert(fs.existsSync(`${mockfile}.2`));
      }
      assert.equal(fs.existsSync(`${mockfile}.3`), false);
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
      assert.equal(msg, '[egg-logrotator] stat error');
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
      assert(content1 === '');

      const logfile2 = path.join(baseDir, `logs/logger-reload/logger-reload-web.log${logname}`);
      const content2 = fs.readFileSync(logfile2, 'utf8');
      assert(/GET \//.test(content2));

      const logfile3 = path.join(baseDir, `logs/logger-reload/egg-agent.log${logname}`);
      const content3 = fs.readFileSync(logfile3, 'utf8');
      assert(/agent warn/.test(content3));

      yield request(app.callback())
      .get('/log')
      .expect(200);

      // will logging to new file
      const content4 = fs.readFileSync(logfile1, 'utf8');
      assert(/GET \//.test(content4));
    });
  });

  describe('clean logs', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'logrotator-app',
      });
      return app.ready();
    });
    after(() => app.close());

    const schedule = path.join(__dirname, '../app/schedule/clean_log');
    const now = moment().startOf('date');

    it('should clean log default', function* () {
      // invalid date
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
        `foo.log.${now.clone().subtract(33, 'days').format('YYYYMMDD')}`), 'foo');
      // fs.writeFileSync(path.join(app.config.logger.dir,
      //   `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD-HH')}`), 'foo');
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
      assert(files.length, 10);
      assert(files.filter(name => name.indexOf('foo.log.') > 0));

      let filepath = 'foo.log.0000-00-00';
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.clone().subtract(30, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      filepath = `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === false);

      filepath = `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === false);

      // should not clean invalid format
      filepath = `foo.log.${now.clone().subtract(33, 'days').format('YYYYMMDD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)));

      // should clean log.YYYY-MM-DD-HH
      filepath = `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD-HH')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === false);

      filepath = `foo.log.${now.clone().subtract(50, 'days').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === false);

      filepath = `foo.log.${now.clone().subtract(6, 'months').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === false);

      filepath = `foo.log.${now.clone().subtract(1, 'years').format('YYYY-MM-DD')}`;
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === false);
    });

    it('should error when readdir err', function* () {
      mm(require('mz/fs'), 'readdir', dir => new Promise((_, reject) => reject(new Error(`Permission: readdir ${dir}`))));
      let message;
      mm(app.coreLogger, 'error', err => (message = err.message));

      const filepath = `foo.log.${now.clone().subtract(35, 'days').format('YYYY-MM-DD')}`;
      fs.writeFileSync(path.join(app.config.logger.dir, filepath), 'foo');

      yield app.runSchedule(schedule);

      assert(/Permission: readdir/.test(message));
      // unlink error, file should exist
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === true);
    });
  });

  describe('clean when no rotate logs', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'logrotator-app',
      });
      return app.ready();
    });
    after(() => app.close());
    after(mm.restore);

    const schedule = path.join(__dirname, '../app/schedule/clean_log');
    const now = moment().startOf('date');

    it('should ignore', function* () {
      mm(require('mz/fs'), 'unlink', file => new Promise((_, reject) => reject(new Error(`unlink ${file} error`))));
      let message;
      mm(app.coreLogger, 'error', err => (message = err.message));

      const filepath = `foo.log.${now.clone().subtract(34, 'days').format('YYYY-MM-DD')}`;
      fs.writeFileSync(path.join(app.config.logger.dir, filepath), 'foo');

      yield app.runSchedule(schedule);

      assert(/unlink .*?foo.log.\d{4}-\d{2}-\d{2} error$/.test(message));
      // unlink error, file should exist
      assert(fs.existsSync(path.join(app.config.logger.dir, filepath)) === true);
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

      assert(fs.existsSync(path.join(app.config.logger.dir, 'foo.log.0000-00-00')));
      assert(fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.format('YYYY-MM-DD')}`)));
      assert(fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(1, 'days').format('YYYY-MM-DD')}`)));
      assert(fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(7, 'days').format('YYYY-MM-DD')}`)));
      assert(fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(31, 'days').format('YYYY-MM-DD')}`)));
      assert(fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(32, 'days').format('YYYY-MM-DD')}`)));
      assert(fs.existsSync(path.join(app.config.logger.dir,
        `foo.log.${now.clone().subtract(33, 'days').format('YYYY-MM-DD')}`)));
    });
  });

});

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
