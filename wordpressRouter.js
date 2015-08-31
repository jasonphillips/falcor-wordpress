'use strict';

var Router = require('falcor-router');
var Promise = require('promise');
var _ = require('lodash');

var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

var WP = require( '../wordpress-rest-api/wp.js' );
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
      route: 'recentPosts[{keys:indices}]',
      get: function(pathSet) {
        var userId = this.userId;

        //caculate paging
        var indices = _.without(pathSet.indices,'length');
        if (!indices.length) indices = [0];
        var [per_page, page] = getPage(_.min(indices), _.max(indices));
        var page_offset = per_page * (page - 1);

        var recentPromise = new Promise( (resolve, reject) => {

          wp.posts().filter({orderby:'date'}).per_page(per_page).page(page).then( (posts) => {
            var postList = _.map(posts, (post) => $ref(`postsById[${post.id}]`) );
            var returnValues = [];

            pathSet.indices.forEach( (i) => {
              if (i=='length') {
                returnValues.push({
                  path: ['recentPosts', i],
                  value: posts._paging.total
                })
              } else {
                returnValues.push({
                  path: ['recentPosts',i],
                  value: postList[i - page_offset]
                })
              }
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
    },

    {
      route: 'taxonomies[{keys:vocabularies}].terms[{keys:indices}]',
      get: function(pathSet) {
        var userId = this.userId;

        //caculate paging
        var indices = _.without(pathSet.indices,'length');
        if (!indices.length) indices = [0];
        var [per_page, page] = getPage(_.min(indices), _.max(indices));
        var page_offset = per_page * (page - 1);

        var promises = _.map(pathSet.vocabularies, (vocabulary)=> {
          var taxPromise = new Promise( (resolve, reject) => {

            wp.taxonomy(vocabulary).terms().per_page(per_page).page(page).then( (response) => {
              resolve(response);

            }).catch( (err) => {
              console.log(err);
              resolve({error: `${err.status} for ${err.path}`})
            })
          })

          return taxPromise;
        });

        return Promise.all(promises).then( (vocabularies) => {
          var results = [];

          pathSet.vocabularies.forEach(function(vocabularyName, offset) {
            var vocabularyTerms = vocabularies[offset];

            if (vocabularyTerms.error) {
              pathSet.indices.forEach( (i) => {
                results.push({
                    path: ['taxonomies', vocabularyName, 'terms', i],
                    value: $error(vocabularyTerms.error)
                });
              });
            } else if (typeof(vocabularyTerms)=='object') {

              pathSet.indices.forEach( (i) => {
                if (i=='length') {
                  results.push({
                    path: ['taxonomies', vocabularyName, 'terms', 'length'],
                    value: vocabularyTerms._paging.total
                  })
                } else {
                  results.push({
                    path: ['taxonomies', vocabularyName, 'terms', i],
                    value: $ref(`termsById.${vocabularyName}[${vocabularyTerms[i - page_offset].id}]`)
                  })
                }
              });
            } else {
              pathSet.indices.forEach( (i) => {
                results.push({
                    path: ['taxonomies', vocabularyName, terms, i],
                    value: []
                });
              });
            }
          });

          return results;
        });
      }
    },

    {
      route: 'taxonomies[{keys:vocabularies}].meta[{keys:props}]',
      get: function(pathSet) {
        var userId = this.userId;

        var promises = _.map(pathSet.vocabularies, (vocabulary)=> {
          var taxPromise = new Promise( (resolve, reject) => {

            wp.taxonomy(vocabulary).then( (response) => {
              resolve(response);

            }).catch( (err) => {
              console.log(err);
              resolve({error: `${err.status} for ${err.path}`})
            })
          })

          return taxPromise;
        });

        return Promise.all(promises).then( (vocabularies) => {
          var results = [];

          pathSet.vocabularies.forEach(function(vocabularyName, offset) {
            var vocabularyRecord = vocabularies[offset];

            pathSet.props.forEach(function(key) {

              if (vocabularyRecord.error) {
                results.push({
                    path: ['taxonomies', vocabularyName, 'meta', key],
                    value: $error(vocabularyRecord.error)
                });
              } else if (vocabularyRecord.name) {
                var value = vocabularyRecord[key];
                if (typeof(value)=='object' && value.rendered) value = value.rendered;
                results.push({
                    path: ['taxonomies', vocabularyName, 'meta', key],
                    value: value
                });
              } else {
                results.push({
                    path: ['taxonomies', vocabularyName, 'meta', key],
                    value: undefined
                });
              }
            });
          });

          return results;
        });

      }
    },

    {
      route: 'termsById.category.[{integers:categoryIds}][{keys:props}]',
      get: function(pathSet) {
        var userId = this.userId;

        var promises = _.map(pathSet.categoryIds, (id)=> {
          var taxPromise = new Promise( (resolve, reject) => {

            wp.taxonomy('category').terms().term(id).then( (term) => {
              resolve(term);

            }).catch( (err) => {
              console.log(err);
              resolve({error: `${err.status} for ${err.path}`})
            })
          })

          return taxPromise;
        });

        return Promise.all(promises).then( (terms) => {
          var results = [];

          pathSet.categoryIds.forEach(function(categoryId, offset) {
            var termRecord = terms[offset];

              pathSet.props.forEach(function(key) {

                if (termRecord.error) {
                  results.push({
                      path: ['termsById', 'category', categoryId, key],
                      value: $error(termRecord.error)
                  });
                } else if (termRecord.ID || termRecord.id) {
                  var value = termRecord[key];
                  if (typeof(value)=='object' && value.rendered) value = value.rendered;
                  results.push({
                      path: ['termsById', 'category', categoryId, key],
                      value: value
                  });
                } else {
                  results.push({
                      path: ['termsById', 'category', categoryId],
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
      route: 'termsById.tag.[{integers:tagIds}][{keys:props}]',
      get: function(pathSet) {
        var userId = this.userId;

        var promises = _.map(pathSet.tagIds, (id)=> {
          var taxPromise = new Promise( (resolve, reject) => {

            wp.taxonomy('tag').terms().term(id).then( (term) => {
              resolve(term);

            }).catch( (err) => {
              console.log(err);
              resolve({error: `${err.status} for ${err.path}`})
            })
          })

          return taxPromise;
        });

        return Promise.all(promises).then( (terms) => {
          var results = [];

          pathSet.tagIds.forEach(function(tagId, offset) {
            var termRecord = terms[offset];

              pathSet.props.forEach(function(key) {

                if (termRecord.error) {
                  results.push({
                      path: ['termsById', 'tag', tagId, key],
                      value: $error(termRecord.error)
                  });
                } else if (termRecord.ID || termRecord.id) {
                  var value = termRecord[key];
                  if (typeof(value)=='object' && value.rendered) value = value.rendered;
                  results.push({
                      path: ['termsById', 'tag', tagId, key],
                      value: value
                  });
                } else {
                  results.push({
                      path: ['termsById', 'tag', tagId],
                      value: undefined
                  });
                }
              })
          })
          return results;
        });
      }
    }]) {

    constructor(userId) {
        super();
        this.userId = userId;
    }
}

/*
 * Calculate smallest page for range
 */

function getPage(low, high) {
  var range = high - low + 1;
  if (range < low) {
    for (var perpage = range; perpage <= low; perpage++ ) {
      if (low % perpage <= perpage - range) {
        var offset = Math.floor(low / perpage);
        return [perpage, offset + 1];
      }
    }
    return perpage;
  } else {
    return [high + 1, 1];
  }
}

module.exports = function(userId) {
    return new WordpressRouter(userId);
};
