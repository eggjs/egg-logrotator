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

egg 的日志切割插件，默认会按照时间切割 `config.logger.rotateLogDirs` 目录下的日志文件。

## 配置

- `plugin.js`

```js
exports.logrotator = true;
```

- `config.default.js`

```js
// 如果有需要按照文件大小切割的日志，在这里配置
exports.logrotator = {
  filesRotateBySize: [],           // 需要按大小切割的文件，其他日志文件仍按照通常方式切割
  maxFileSize: 50 * 1024 * 1024,   // 最大文件大小，默认为50m
  maxFiles: 10,                    // 按大小切割时，文件最大切割的份数
  rotateDuration: 60000,           // 按大小切割时，文件扫描的间隔时间
  maxDays: 31,                     // 日志保留最久天数
};
```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
