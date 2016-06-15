'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Router = require('falcor-router');
var Promise = require('promise');
var _ = require('lodash');

// falcor basics
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

// wordpress client for API 2.0
var WP = require('wordpress-rest-api');

// handlers
var PostsById = require('./handlers/postsById.js');
var PostsByIndices = require('./handlers/postsByIndices.js');
var PostsByTerm = require('./handlers/postsByTerm.js');
var TermsById = require('./handlers/termsById.js');
var TaxonomiesById = require('./handlers/taxonomiesById.js');
var TermsByIndices = require('./handlers/termsByIndices.js');
var TermsByPost = require('./handlers/termsByPost.js');
var AuthorsById = require('./handlers/authorsById.js');
var MediaById = require('./handlers/mediaById.js');

// logging
var bunyan = require('bunyan');
var log = bunyan.createLogger({ name: 'wordpressRouter' });
log.level(process.env.NODE_ENV === 'production' ? 'fatal' : 'info');

/*
 * Extend Falcor Router
 */

var WordpressRouter = (function (_Router$createClass) {
  _inherits(WordpressRouter, _Router$createClass);

  function WordpressRouter(endpoint, auth) {
    _classCallCheck(this, WordpressRouter);

    _get(Object.getPrototypeOf(WordpressRouter.prototype), 'constructor', this).call(this);
    var options = { endpoint: endpoint };
    // auth object should have username, password fields
    if (typeof auth !== 'undefined') {
      _.merge(options, auth, { auth: true });
    }
    this.wp = new WP(options);
    this.log = log;
    // caching for rendundant data in a single flight
    this.cache = {};
  }

  /*
   * Export generator for disposable instances
   */

  _createClass(WordpressRouter, [{
    key: 'cacheSet',
    value: function cacheSet(identifier, value) {
      this.cache[identifier] = value;
    }
  }, {
    key: 'cacheGet',
    value: function cacheGet(identifier) {
      return this.cache[identifier];
    }
  }]);

  return WordpressRouter;
})(Router.createClass([{
  route: 'postsById[{integers:postIds}][{keys:props}]',
  get: function get(pathSet) {
    var handler = new PostsById(this, pathSet.postIds, pathSet.props);
    return handler.buildReturn();
  }
}, {
  route: 'postsByTerm[{keys:vocabularies}][{keys:terms}][{keys:indices}]',
  get: function get(pathSet) {
    var _this = this;

    var promises = _.map(pathSet.vocabularies, function (vocabulary) {
      return _.map(pathSet.terms, function (term) {
        var handler = new PostsByTerm(_this, pathSet.indices, { orderby: 'date' }, vocabulary, term);
        return handler.buildReturn();
      });
    });
    return Promise.all(_.flatten(promises)).then(function (records) {
      return _.flatten(records);
    });
  }
}, {
  route: 'termsByPost[{integers:postIds}][{keys:vocabularies}][{keys:indices}]',
  get: function get(pathSet) {
    var _this2 = this;

    var promises = [];
    _.forEach(pathSet.postIds, function (postId) {
      _.forEach(pathSet.vocabularies, function (vocabulary) {
        var handler = new TermsByPost(_this2, pathSet.indices, {}, postId, vocabulary);
        promises.push(handler.buildReturn());
      });
    });
    return Promise.all(promises).then(function (records) {
      return _.flatten(records);
    });
  }
}, {
  route: 'taxonomies[{keys:vocabularies}].termsByParentId[{integers:parentIds}][{keys:indices}]',
  get: function get(pathSet) {
    var _this3 = this;

    var promises = [];
    _.forEach(pathSet.vocabularies, function (vocabulary) {
      _.forEach(pathSet.parentIds, function (parentId) {
        var handler = new TermsByIndices(_this3, pathSet.indices, { orderby: 'date' }, vocabulary, parentId);
        promises.push(handler.buildReturn());
      });
    });
    return Promise.all(promises).then(function (records) {
      return _.flatten(records);
    });
  }
}, {
  route: 'recentPosts[{keys:indices}]',
  get: function get(pathSet) {
    var handler = new PostsByIndices(this, pathSet.indices, { orderby: 'date' });
    return handler.buildReturn();
  }
}, {
  route: 'taxonomies[{keys:vocabularies}].terms[{keys:indices}]',
  get: function get(pathSet) {
    var _this4 = this;

    var promises = _.map(pathSet.vocabularies, function (vocabulary) {
      var handler = new TermsByIndices(_this4, pathSet.indices, null, vocabulary);
      return handler.buildReturn();
    });
    return Promise.all(promises).then(function (records) {
      return _.flatten(records);
    });
  }
}, {
  route: 'taxonomies[{keys:vocabularies}].meta[{keys:props}]',
  get: function get(pathSet) {
    var handler = new TaxonomiesById(this, pathSet.vocabularies, pathSet.props);
    return handler.buildReturn();
  }
}, {
  route: 'termsById[{keys:vocabularies}][{integers:categoryIds}][{keys:props}]',
  get: function get(pathSet) {
    var _this5 = this;

    var promises = _.map(pathSet.vocabularies, function (vocabulary) {
      var handler = new TermsById(_this5, pathSet.categoryIds, pathSet.props, vocabulary);
      return handler.buildReturn();
    });
    return Promise.all(promises).then(function (records) {
      return _.flatten(records);
    });
  }
}, {
  route: 'authorsById[{integers:userIds}][{keys:props}]',
  get: function get(pathSet) {
    var handler = new AuthorsById(this, pathSet.userIds, pathSet.props);
    return handler.buildReturn();
  }
}, {
  route: 'mediaById[{integers:mediaIds}][{keys:props}]',
  get: function get(pathSet) {
    var handler = new MediaById(this, pathSet.mediaIds, pathSet.props);
    return handler.buildReturn();
  }
}]));

module.exports = function (endpoint, auth) {
  return new WordpressRouter(endpoint, auth);
};