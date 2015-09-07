'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ = require('lodash');
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

var FetchById = (function () {
  function FetchById(shared, ids, keys) {
    _classCallCheck(this, FetchById);

    this.wp = shared.wp;
    this.log = shared.log;
    this.cacheGet = shared.cacheGet.bind(shared);
    this.ids = ids;
    this.keys = keys;
  }

  // Override with wp api promise

  _createClass(FetchById, [{
    key: 'getIdQuery',
    value: function getIdQuery(id) {
      return null;
    }

    // Override with specific Falcor return paths
  }, {
    key: 'getReturnPath',
    value: function getReturnPath(id, key) {
      // keyless for error handler
      return typeof key !== 'undefined' ? [id, key] : [id];
    }

    // Override with cache path to check for already retrieved object
  }, {
    key: 'getCachedPath',
    value: function getCachedPath(id) {
      return '' + id;
    }

    // Override with keys that should return references {key=>path}
  }, {
    key: 'getReferenceKeys',
    value: function getReferenceKeys() {
      return {};
    }
  }, {
    key: 'getPromises',
    value: function getPromises() {
      var _this = this;

      var promises = _.map(this.ids, function (id) {
        var itemPromise = new Promise(function (resolve, reject) {
          // check cache for already fetched item this flight
          var cached = _this.cacheGet(_this.getCachedPath(id));
          if (typeof cached !== 'undefined') {
            resolve(cached);
          } else {
            var query = _this.getIdQuery(id);
            _this.log.info('GET: ' + query._renderURI());

            query.then(function (response) {
              resolve(response);
            })['catch'](function (err) {
              _this.log.error(err);
              resolve({ error: err.status + ' for ' + err.path });
            });
          }
        });

        return itemPromise;
      });

      return promises;
    }
  }, {
    key: 'resolvePromises',
    value: function resolvePromises(promises) {
      var _this2 = this;

      return Promise.all(promises).then(function (records) {
        var results = [];
        var referenceKeys = _this2.getReferenceKeys();

        _this2.ids.forEach(function (id, offset) {
          var record = records[offset];

          _this2.keys.forEach(function (key) {
            if (record.error) {
              results.push({
                path: _this2.getReturnPath(id, key),
                value: $error(record.error)
              });
            } else if (record.id || record.name) {
              var value = record[key];
              // reference keys
              if (typeof referenceKeys[key] === 'function') {
                results.push({
                  path: _this2.getReturnPath(id, key),
                  value: $ref(referenceKeys[key](id, value))
                });
              } else {
                if (typeof value === 'object' && value.rendered) {
                  // handle WP 2.0 {rendered} values
                  value = value.rendered;
                }
                results.push({
                  path: _this2.getReturnPath(id, key),
                  value: value
                });
              }
            } else {
              results.push({
                path: _this2.getReturnPath(id),
                value: $error(id + ' not found')
              });
            }
          });
        });
        return results;
      });
    }
  }, {
    key: 'buildReturn',
    value: function buildReturn() {
      return this.resolvePromises(this.getPromises());
    }
  }]);

  return FetchById;
})();

exports['default'] = FetchById;
module.exports = exports['default'];