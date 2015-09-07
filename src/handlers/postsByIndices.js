var FetchByIndices = require('./FetchByIndices.js');

class PostsByIndices extends FetchByIndices {

  getRootQuery() {
    return this.wp.posts();
  }

  getReferencePath(record) {
    return `postsById[${record.id}]`;
  }

  getReturnPath(index) {
    return (typeof index !== 'undefined') ? ['recentPosts', index] : ['recentPosts'];
  }
}

export default PostsByIndices;
