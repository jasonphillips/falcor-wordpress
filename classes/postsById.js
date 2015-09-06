var FetchById = require('./fetchById.js');

class PostsById extends FetchById {

  getIdQuery(id) {
    return this.wp.posts().id(id);
  }

  getReturnPath(id, key) {
    return (typeof key !== 'undefined') ? ['postsById', id, key] : ['postsById', id];
  }
}

export default PostsById;
