'use strict';

module.exports = app => {
  app.get('/', function* () {
    this.app.loggers.bizLogger.warn('hi biz logger');
    this.body = 123;
  });
};
