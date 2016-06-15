var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var nock = require('nock');
var nockBack = require('nock').back;
nockBack.setMode('record');
nockBack.fixtures = __dirname + '/fixtures/responses';

var wordpressRouter = require('../lib/wordpressRouter');
var falcor = require('falcor');
var endpoint = 'https://demo.wp-api.org/wp-json';


describe( 'wordpress router', function() {

  var router, model, info, error;
  var savedIds = {posts:[], termSlug:null};

  beforeEach(function() {
    router = new wordpressRouter(endpoint);
    info = sinon.spy();
    error = sinon.spy();
    router.log = {info: info, error: error};
    model = new falcor.Model({source: router});
	});

  it( 'imports correctly as a class', function() {
    expect(wordpressRouter).to.be.a( 'function' );
    expect(router).to.be.an( 'object' );
  });

  it( 'can be used as a model source', function() {
    expect(model).to.be.an( 'object' );
  });

  describe( 'recentPosts', function() {

    it( 'retrieves recents posts by indices', function(done) {
      nockBack('recentPostsBasic', function(nockDone) {
        model.get('recentPosts[0..3].id').subscribe( function(data) {
          check(done, function() {

            expect(error.notCalled).to.be.true;
            expect(data.json).to.have.key('recentPosts');

            ['0','1','2','3'].forEach(function (index) {
              expect(data.json.recentPosts).to.have.property(index);
              var post = data.json.recentPosts[index];
              expect(post).to.have.property('id');
              savedIds.posts.push(post.id);
            });

            nockDone();
          });
        });
      });
    });

  });

  describe( 'postsById', function() {

    it( 'requests a single post by id', function(done) {
      var postId = savedIds.posts[0];

      nockBack('postsByIdSingle', function(nockDone) {
        model.get('postsById[' + postId + '].id').subscribe( function(data) {
          check(done, function() {

            expect(error.notCalled).to.be.true;

            expect(data.json).to.have.key('postsById');
            expect(data.json.postsById).to.have.key('' + postId);
            expect(data.json.postsById[postId].id).to.equal(postId);

            nockDone();
          });
        });
      });
    });

    it( 'requests multiple posts by id with keyed properties', function(done) {
      var postIds = savedIds.posts.slice(0,2);

      nockBack('postsByIdMultiple', function(nockDone) {
        model.get('postsById[' + postIds.join(',') + ']["id","title","slug"]').subscribe( function(data) {
          check(done, function() {

            expect(error.notCalled).to.be.true;

            postIds.forEach(function (postId) {
              expect(data.json.postsById).to.have.property('' + postId);
              var post = data.json.postsById[postId];
              expect(post).to.have.keys('id','title','slug');
              expect(post.id).to.equal(postId);
            });

            nockDone();
          });
        });
      });
    });

  });

  describe( 'taxonomies', function() {

    it( 'fetches metadata for a taxonomy', function(done) {
      nockBack('taxonomiesMeta', function(nockDone) {
        model.get('taxonomies.category.meta["name","slug"]').subscribe( function(data) {
          check(done, function() {

            expect(error.notCalled).to.be.true;
            expect(data.json).to.deep.equal({
               "taxonomies": {
                  "category": {
                     "meta": {
                        "name": "Categories",
                        "slug": "category"
                     }
                  }
               }
            })

            nockDone();
          });
        });
      });
    });

    it( 'fetches terms for a taxonomy by index', function(done) {
      nockBack('taxonomyTermsByIndex', function(nockDone) {
        model.get('taxonomies.categories.terms[0]["name","slug"]').subscribe( function(data) {
          check(done, function() {

            expect(error.notCalled).to.be.true;
            expect(data.json).to.have.deep.property('taxonomies.categories.terms');
            expect(data.json.taxonomies.categories.terms[0]).to.have.keys('slug','name')
            savedIds.termSlug = data.json.taxonomies.categories.terms[0].slug;

            nockDone();
          });
        });
      });
    });

    it( 'fetches posts by a specified term slug', function(done) {
      nockBack('postsByTermSlug', function(nockDone) {
        var slug = savedIds.termSlug;

        model.get('postsByTerm.categories.' + slug + '[0..3]["title","id"]').subscribe( function(data) {
          check(done, function() {

            expect(error.notCalled).to.be.true;
            expect(data.json).to.have.deep.property('postsByTerm.categories.' + slug);
            var postList = data.json.postsByTerm.categories[slug];

            ['0','1','2','3'].forEach(function (index) {
              expect(postList).to.have.property(index);
              expect(postList[index]).to.have.keys('id','title');
            });

            nockDone();
          });
        });
      });
    });




  });

  describe( 'postsById', function() {

    it( 'requests a single post by id', function(done) {
      done();
    });
  });

});

function check( done, f ) {
  try {
    f();
    done();
  } catch( e ) {
    done( e );
  }
}
