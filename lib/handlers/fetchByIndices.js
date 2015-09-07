'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ = require('lodash');
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

var FetchByIndices = (function () {
  function FetchByIndices(shared, indices, filter) {
    _classCallCheck(this, FetchByIndices);

    this.wp = shared.wp;
    this.log = shared.log;
    this.indices = indices;
    this.cacheSet = shared.cacheSet.bind(shared);
    this.filter = filter;
    this.paging = this.getPaging();
  }

  // Override with wp api promise

  _createClass(FetchByIndices, [{
    key: 'getRootQuery',
    value: function getRootQuery() {
      return null;
    }

    // responses will be references to a byId path
  }, {
    key: 'getReferencePath',
    value: function getReferencePath(record) {
      return record.id;
    }

    // Override with specific Falcor return paths
  }, {
    key: 'getReturnPath',
    value: function getReturnPath(index) {
      return typeof index !== 'undefined' ? [index] : null;
    }
  }, {
    key: 'getPromise',
    value: function getPromise() {
      var _this = this;

      var rangePromise = new Promise(function (resolve, reject) {
        var query = _this.getRootQuery();
        if (_this.filter) {
          query = query.filter(_this.filter);
        }
        if (_this.paging) {
          query = query.per_page(_this.paging.perPage).page(_this.paging.page);
        }
        _this.log.info('GET: ' + query._renderURI());

        query.then(function (response) {
          resolve(response);
        })['catch'](function (err) {
          _this.log.error(err);
          resolve({ error: err.status + ' for ' + err.path });
        });
      });
      return rangePromise;
    }
  }, {
    key: 'resolvePromise',
    value: function resolvePromise(rangePromise) {
      var _this2 = this;

      return rangePromise.then(function (records) {
        var results = [];
        var offset = _this2.paging ? _this2.paging.offset : 0;
        var total = _this2.paging ? records._paging.total : records.length;
        var referencesList = [];

        // build item references and cache objects
        _.forEach(records, function (record) {
          var refPath = _this2.getReferencePath(record);
          referencesList.push($ref(refPath));
          _this2.cacheSet(refPath, record);
        });

        _this2.indices.forEach(function (index) {
          if (index === 'length') {
            results.push({
              path: _this2.getReturnPath(index),
              value: total
            });
          } else {
            results.push({
              path: _this2.getReturnPath(index),
              value: referencesList[index - offset]
            });
          }
        });

        return results;
      })['catch'](function (err) {
        _this2.log.error(err);
        return [{
          path: _this2.getReturnPath(),
          value: $error(err.status + ' for ' + err.path)
        }];
      });
    }
  }, {
    key: 'buildReturn',
    value: function buildReturn() {
      return this.resolvePromise(this.getPromise());
    }
  }, {
    key: 'getPaging',
    value: function getPaging() {
      var perPage;var page;
      var indices = _.without(this.indices, 'length');
      if (!indices.length) {
        indices = [0];
      }

      var _calculatePage = this.calculatePage(_.min(indices), _.max(indices));

      var _calculatePage2 = _slicedToArray(_calculatePage, 2);

      perPage = _calculatePage2[0];
      page = _calculatePage2[1];

      return {
        perPage: perPage,
        page: page,
        offset: perPage * (page - 1)
      };
    }

    // Calculate smallest page for range
  }, {
    key: 'calculatePage',
    value: function calculatePage(low, high) {
      var range = high - low + 1;
      if (range < low) {
        var perpage = undefined;
        for (perpage = range; perpage <= low; perpage++) {
          if (low % perpage <= perpage - range) {
            var offset = Math.floor(low / perpage);
            return [perpage, offset + 1];
          }
        }
        return perpage;
      }
      return [high + 1, 1];
    }
  }]);

  return FetchByIndices;
})();

exports['default'] = FetchByIndices;
module.exports = exports['default'];