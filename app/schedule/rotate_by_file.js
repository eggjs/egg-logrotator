'use strict';

const DayRotator = require('../lib/day_rotator');


module.exports = app => {
  const rotator = new DayRotator({ app });

  return {

    schedule: {
      type: 'worker', // only one worker run this task
      cron: '0 0 * * *', // run every day at 00:00
    },

    * task() {
      yield rotator.rotate();
    },

  };
};
