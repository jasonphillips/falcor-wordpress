'use strict';

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
var log = bunyan.createLogger({name: 'wordpressRouter'});
log.level(process.env.NODE_ENV === 'production' ? 'fatal' : 'info');

/*
 * Extend Falcor Router
 */
class WordpressRouter extends
  Router.createClass([
    {
      route: 'postsById[{integers:postIds}][{keys:props}]',
      get: function (pathSet) {
        var handler = new PostsById(this, pathSet.postIds, pathSet.props);
        return handler.buildReturn();
      }
    },

    {
      route: 'postsByTerm[{keys:vocabularies}][{keys:terms}][{keys:indices}]',
      get: function (pathSet) {
        var promises = _.map(pathSet.vocabularies, (vocabulary) => {
          return _.map(pathSet.terms, (term) => {
            var handler = new PostsByTerm(
              this, pathSet.indices, {orderby: 'date'}, vocabulary, term
            );
            return handler.buildReturn();
          });
        });
        return Promise.all(_.flatten(promises)).then((records) => {
          return _.flatten(records);
        });
      }
    },

    {
      route: 'termsByPost[{integers:postIds}][{keys:vocabularies}][{keys:indices}]',
      get: function (pathSet) {
        var promises = [];
        _.forEach(pathSet.postIds, (postId) => {
          _.forEach(pathSet.vocabularies, (vocabulary) => {
            var handler = new TermsByPost(
              this, pathSet.indices, {}, postId, vocabulary
            );
            promises.push(handler.buildReturn());
          });
        });
        return Promise.all(promises).then((records) => {
          return _.flatten(records);
        });
      }
    },

    {
      route: 'taxonomies[{keys:vocabularies}].termsByParentId[{integers:parentIds}][{keys:indices}]',
      get: function (pathSet) {
        var promises = [];
        _.forEach(pathSet.vocabularies, (vocabulary) => {
          _.forEach(pathSet.parentIds, (parentId) => {
            var handler = new TermsByIndices(
              this, pathSet.indices, {orderby: 'date'}, vocabulary, parentId
            );
            promises.push(handler.buildReturn());
          });
        });
        return Promise.all(promises).then((records) => {
          return _.flatten(records);
        });
      }
    },

    {
      route: 'recentPosts[{keys:indices}]',
      get: function (pathSet) {
        var handler = new PostsByIndices(this, pathSet.indices, {orderby: 'date'});
        return handler.buildReturn();
      }
    },

    {
      route: 'taxonomies[{keys:vocabularies}].terms[{keys:indices}]',
      get: function (pathSet) {
        var promises = _.map(pathSet.vocabularies, (vocabulary) => {
          var handler = new TermsByIndices(
            this, pathSet.indices, null, vocabulary
          );
          return handler.buildReturn();
        });
        return Promise.all(promises).then((records) => {
          return _.flatten(records);
        });
      }
    },

    {
      route: 'taxonomies[{keys:vocabularies}].meta[{keys:props}]',
      get: function (pathSet) {
        var handler = new TaxonomiesById(this, pathSet.vocabularies, pathSet.props);
        return handler.buildReturn();
      }
    },

    {
      route: 'termsById[{keys:vocabularies}][{integers:categoryIds}][{keys:props}]',
      get: function (pathSet) {
        var promises = _.map(pathSet.vocabularies, (vocabulary) => {
          var handler = new TermsById(
            this, pathSet.categoryIds, pathSet.props, vocabulary
          );
          return handler.buildReturn();
        });
        return Promise.all(promises).then((records) => {
          return _.flatten(records);
        });
      }
    },

    {
      route: 'authorsById[{integers:userIds}][{keys:props}]',
      get: function (pathSet) {
        var handler = new AuthorsById(this, pathSet.userIds, pathSet.props);
        return handler.buildReturn();
      }
    },

    {
      route: 'mediaById[{integers:mediaIds}][{keys:props}]',
      get: function (pathSet) {
        var handler = new MediaById(this, pathSet.mediaIds, pathSet.props);
        return handler.buildReturn();
      }
    }

  ]) {
    constructor(endpoint, auth) {
      super();
      let options = {endpoint: endpoint};
      // auth object should have username, password fields
      if (typeof auth !== 'undefined') {
        _.merge(options, auth, {auth: true});
      }
      this.wp = new WP(options);
      this.log = log;
      // caching for rendundant data in a single flight
      this.cache = {};
    }

    cacheSet(identifier, value) {
      this.cache[identifier] = value;
    }

    cacheGet(identifier) {
      return this.cache[identifier];
    }
}

/*
 * Export generator for disposable instances
 */

module.exports = function (endpoint, auth) {
  return new WordpressRouter(endpoint, auth);
};
