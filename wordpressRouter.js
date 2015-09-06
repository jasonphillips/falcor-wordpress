'use strict';

var Router = require('falcor-router');
var Promise = require('promise');
var _ = require('lodash');

// falcor basics
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

// wordpress client for API 2.0
var WP = require('../wordpress-rest-api/wp.js');

// handlers
var PostsById = require('./classes/postsById.js');
var PostsByIndices = require('./classes/postsByIndices.js');
var TermsById = require('./classes/termsById.js');
var TaxonomiesById = require('./classes/taxonomiesById.js');
var TermsByIndices = require('./classes/TermsByIndices.js');
var AuthorsById = require('./classes/authorsById.js');

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
      route: 'recentPosts[{keys:indices}]',
      get: function (pathSet) {
        var handler = new PostsByIndices(this, pathSet.indices, {orderby: 'date'});
        return handler.buildReturn();
      }
    },

    {
      route: 'taxonomies[{keys:vocabularies}].terms[{keys:indices}]',
      get: function (pathSet) {
        var userId = this.userId;
        var promises = _.map(pathSet.vocabularies, (vocabulary) => {
          var handler = new TermsByIndices(
            this, pathSet.indices, {orderby: 'date'}, vocabulary
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
      route: 'termsById.category.[{integers:categoryIds}][{keys:props}]',
      get: function (pathSet) {
        var handler = new TermsById(this, pathSet.categoryIds, pathSet.props, 'category');
        return handler.buildReturn();
      }
    },

    {
      route: 'termsById.tag.[{integers:tagIds}][{keys:props}]',
      get: function (pathSet) {
        var handler = new TermsById(this, pathSet.tagIds, pathSet.props, 'tag');
        return handler.buildReturn();
      }
    },

    {
      route: 'authorsById[{integers:userIds}][{keys:props}]',
      get: function (pathSet) {
        var handler = new AuthorsById(this, pathSet.userIds, pathSet.props);
        return handler.buildReturn();
      }
    }

  ]) {
    constructor(userId, endpoint) {
      super();
      // userId placeholder for future authenticated option
      this.userId = userId;
      this.wp = new WP({endpoint: endpoint});
      this.log = log;
    }
}

/*
 * Export generator for disposable instances
 */

module.exports = function (userId, endpoint) {
  return new WordpressRouter(userId, endpoint);
};
