# egg-logrotater

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-logrotater.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-logrotater
[travis-image]: https://img.shields.io/travis/eggjs/egg-logrotater.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-logrotater
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-logrotater.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-logrotater?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-logrotater.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-logrotater
[snyk-image]: https://snyk.io/test/npm/egg-logrotater/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-logrotater
[download-image]: https://img.shields.io/npm/dm/egg-logrotater.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-logrotater

Log rotate plugin for egg, default rotate log files under `config.logger.rotateLogDirs`.Run by [egg-schedule](https://github.com/eggjs/egg-schedule)

## Install

```bash
$ npm i egg-logrotater
```

## Usage


- `plugin.js`

```js
exports.logrotater = true;
```

- `config.js`

```js
// if any files need rotate by file size, config here
exports.logrotater = {
  filesRotateBySize: [],           // Array for files path which need rotate.
  maxFileSize: 60 * 1024 * 1024,   // Max file size to judge if any file need rotate
  maxFiles: 10,                    // pieces rotate by size
  rotateDuration: 60000,           // time interval to judge if any file need rotate
};
```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
