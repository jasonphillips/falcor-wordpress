'use strict';

var Router = require('falcor-router');
var Promise = require('promise');
var _ = require('lodash');

var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

var WP = require( 'wordpress-rest-api' );
var wp = new WP({ endpoint: 'http://demo.wp-api.org/wp-json/wp/v2' });

class WordpressRouter extends
  Router.createClass([
    {
      route: "postsById[{integers:postIds}][{keys:props}]",
      get: function(pathSet) {
          var userId = this.userId;

          var promises = _.map(pathSet.postIds, (id)=> {
            var postPromise = new Promise( (resolve, reject) => {

              wp.posts().id(id).then( (post) => {
                resolve(post)

              }).catch( (err) => {
                console.log(err);
                resolve({error: `${err.status} for ${err.path}`})
              })

            })

            return postPromise;
          })

          return Promise.all(promises).then( (posts) => {
            var results = [];

            pathSet.postIds.forEach(function(postId, offset) {
              var postRecord = posts[offset];

                pathSet.props.forEach(function(key) {

                  if (postRecord.error) {
                    results.push({
                        path: ['postsById', postId, key],
                        value: $error(postRecord.error)
                    });
                  } else if (postRecord.ID || postRecord.id) {
                    var value = postRecord[key];
                    if (typeof(value)=='object' && value.rendered) value = value.rendered;
                    results.push({
                        path: ['postsById', postId, key],
                        value: value
                    });
                  } else {
                    results.push({
                        path: ['postsById', postId],
                        value: undefined
                    });
                  }
                })
            })
            return results;
          });
      }
    },

    {
      route: 'recentPosts[{integers:indices}]',
      get: function(pathSet) {
          var userId = this.userId;
          var top = _.max(pathSet.indices) + 1;

          var recentPromise = new Promise( (resolve, reject) => {

            wp.posts().filter({posts_per_page:top}).then( (posts) => {
              var postList = _.map(posts, (post) => $ref(`postsById[${post.id}]`) );
              var returnValues = [];

              pathSet.indices.forEach( (i) => {
                returnValues.push({
                  path: ['recentPosts',i],
                  value: postList[i]
                })
              });
              resolve(returnValues);

            }).catch( (err) => {
              console.log(err);
              resolve([
                {
                  path: ['recentPosts'],
                  value: $error(`${err.status} for ${err.path}`)
                }
              ]);

            })
          })

        return recentPromise;
      }
    }]) {

    constructor(userId) {
        super();
        this.userId = userId;
    }
}


module.exports = function(userId) {
    return new WordpressRouter(userId);
};
