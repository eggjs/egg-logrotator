'use strict';

const path = require('path');
const mm = require('egg-mock');
const fs = require('fs');
const glob = require('glob');
const sleep = require('co-sleep');

require('should');

describe('test/logrotater.test.js', function() {

  describe('logrotater', function() {
    before(function(done) {
      mm.env('unittest');
      this.app = mm.app({
        baseDir: 'logrotater-app',
        coverage: true,
        plugin: 'log',
      });
      this.app.ready(done);
    });
    after(function() {
      mm.restore();
      this.app.close();
    });

    it('should rotate log file default', function* (done) {
      const app = this.app;
      const schedule = path.join(__dirname, '../app/schedule/rotateByFile');
      yield app.runSchedule(schedule);
      setTimeout(function() {
        // app.expect('stdout', /app got log-reload/);
        // app.expect('stdout', /agent got log-reload/);

        const files = glob.sync(path.join(__dirname, 'fixtures/logrotater-app/logs/logrotater/*.log.*'));
        files.length.should.above(0);
        files.forEach(function(file) {
          // */app-monitor/logs/tracelog/rpc-client-stat.log.2015-09-18
          // */app-monitor/logs/tracelog/sofa-mvc-stat.log.2015-09-18
          file.should.match(/log.\d{4}-\d{2}-\d{2}$/);
        });
        done();
      }, 10000);
    });
  });

  describe('logrotater size', function() {
    const mockfile = path.join(__dirname, 'fixtures/logrotater-app-size/logs/logrotater/egg-web.log');
    const mocklogTxt = fs.readFileSync(path.join(__dirname, 'fixtures/logrotater-app-size/mocklog.txt'));

    beforeEach(function(done) {
      mm.env('unittest');
      this.app = mm.app({
        baseDir: 'logrotater-app-size',
        coverage: true,
        plugin: 'log',
      });
      this.app.ready(done);
    });
    afterEach(function() {
      mm.restore();
      this.app.close();
    });

    it('should rotate by size', function* () {
      const app = this.app;
      const schedule = path.join(__dirname, '../app/schedule/rotateBySize');
      yield app.runSchedule(schedule);
      yield sleep(2000);

      // app.expect('stdout', /app got log-reload/);
      // app.expect('stdout', /agent got log-reload/);

      fs.existsSync(`${mockfile}.1`).should.equal(true);
    });

    it('should keep maxFiles file only', function* () {
      const app = this.app;

      // 第一次切分
      const schedule = path.join(__dirname, '../app/schedule/rotateBySize');
      yield app.runSchedule(schedule);
      yield sleep(2000);

      // 第二次切分
      fs.writeFileSync(mockfile, mocklogTxt);
      yield app.runSchedule(schedule);

      yield sleep(2000);

      // 第三次切分
      fs.writeFileSync(mockfile, mocklogTxt);
      yield app.runSchedule(schedule);
      yield sleep(2000);
      fs.existsSync(`${mockfile}.1`).should.equal(true);
      fs.existsSync(`${mockfile}.2`).should.equal(true);
      fs.existsSync(`${mockfile}.3`).should.equal(false);
    });
  });
});
