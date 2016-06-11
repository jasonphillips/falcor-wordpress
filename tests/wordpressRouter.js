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
  var savedIds = {posts:[]};

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

            expect(info).to.be.calledWith(
              'GET: '+ endpoint + '/wp/v2/posts?filter%5Borderby%5D=date&page=1&per_page=4'
            );
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

            expect(info).to.be.calledWith('GET: '+ endpoint + '/wp/v2/posts/' + postId)
            expect(error.notCalled).to.be.true;
            expect(data.json).to.have.key('postsById');
            expect(data.json.postsById).to.have.key('' + postId);
            expect(data.json.postsById[postId].id).to.equal(postId);

            nockDone();
          });
        });
      });
    });

    it( 'requests multiple posts by id', function(done) {
      var postIds = savedIds.posts.slice(0,2);

      nockBack('postsByIdMultiple', function(nockDone) {
        model.get('postsById[' + postIds.join(',') + '].id').subscribe( function(data) {
          check(done, function() {

            expect(info).to.be.calledWith('GET: ' + endpoint + '/wp/v2/posts/' + postIds[0])
            expect(info).to.be.calledWith('GET: ' + endpoint + '/wp/v2/posts/' + postIds[1])
            expect(error.notCalled).to.be.true;

            postIds.forEach(function (postId) {
              expect(data.json.postsById).to.have.property('' + postId);
              var post = data.json.postsById[postId];
              expect(post).to.have.property('id');
              expect(post.id).to.equal(postId);
            });

            nockDone();
          });
        });
      });
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
