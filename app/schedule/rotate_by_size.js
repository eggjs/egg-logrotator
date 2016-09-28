'use strict';

const SizeRotator = require('../lib/size_rotator');


module.exports = app => {
  const rotator = new SizeRotator({ app });

  return {

    schedule: {
      interval: app.config.logrotator.rotateDuration,
      type: 'worker',
      disable: (app.config.logrotator.filesRotateBySize || []).length === 0,
    },

    * task() {
      yield rotator.rotate();
    },
  };
};
