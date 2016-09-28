# egg-logrotator

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-logrotator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-logrotator
[travis-image]: https://img.shields.io/travis/eggjs/egg-logrotator.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-logrotator
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-logrotator.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-logrotator?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-logrotator.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-logrotator
[snyk-image]: https://snyk.io/test/npm/egg-logrotator/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-logrotator
[download-image]: https://img.shields.io/npm/dm/egg-logrotator.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-logrotator

LogRotator for egg. Rotate all file of `app.loggers` by default

## Install

```bash
$ npm i egg-logrotator
```

## Usage


- `plugin.js`

```js
exports.logrotator = true;
```

- `config.default.js`

```js
// if any files need rotate by file size, config here
exports.logrotator = {
  filesRotateByHour: [],           // list of files that will be rotated by hour
  filesRotateBySize: [],           // list of files that will be rotated by size
  maxFileSize: 50 * 1024 * 1024,   // Max file size to judge if any file need rotate
  maxFiles: 10,                    // pieces rotate by size
  rotateDuration: 60000,           // time interval to judge if any file need rotate
  maxDays: 31,                     // keep max days log files, default is `31`. Set `0` to keep all logs
};
```

## Feature

By default, LogRotator will rotate all files of `app.loggers` at 00:00 everyday, the format is `.log.YYYY-MM-DD` (`egg-web.log.2016-09-30`).

### By Size

Rotate by size with config `filesRotateBySize`. when the file size is greater than `maxFileSize`, it will rename to `.log.1`.

If the file you renamed to is exists, it will increment by 1 (`.log.1` -> `.log.2`), until `maxFiles`. if it reaches the `maxFiles`, then overwrite it.

It will ignore the file by default when it's in filesRotateBySize.

### By Hour

Rotate by hour with config `filesRotateByHour`. rotate the file at 00 every hour, the format is `.log.YYYY-MM-HH`.

It will ignore the file by default when it's in filesRotateByHour.

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
