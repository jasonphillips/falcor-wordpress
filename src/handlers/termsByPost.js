var FetchByIndices = require('./FetchByIndices.js');

class TermsByPost extends FetchByIndices {

  constructor(shared, indices, filter, postId, vocabulary) {
    super(shared, indices, filter);
    this.postId = postId;
    this.vocabulary = vocabulary;
  }

  getRootQuery() {
    return this.wp.posts().id(this.postId).terms(this.vocabulary);
  }

  // pagination does not exist on post terms
  getPaging() {
    return false;
  }

  getReferencePath(record) {
    return `termsById.${this.vocabulary}[${record.id}]`;
  }

  getReturnPath(index) {
    return (typeof index !== 'undefined')
      ? ['termsByPost', this.postId, this.vocabulary, index]
      : ['termsByPost', this.postId, this.vocabulary];
  }
}

export default TermsByPost;
