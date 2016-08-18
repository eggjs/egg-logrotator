'use strict';

const path = require('path');


module.exports = app => {
  app.get('/log', function* () {
    this.logger.warn('%s %s', this.method, this.path);
    this.logger.error(new Error('error'));
    this.body = {
      method: this.method,
      path: this.path,
    };
  });

  app.get('/rotate', function* () {
    const schedule = path.join(__dirname, '../../../../app/schedule/rotate_by_file');
    console.log(schedule);
    yield app.runSchedule(schedule);
    this.body = 'done';
  });
};
