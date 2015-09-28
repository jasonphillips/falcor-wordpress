var FetchByIndices = require('./FetchByIndices.js');

class PostsByTerm extends FetchByIndices {

  constructor(shared, indices, filter, vocabulary, term) {
    super(shared, indices, filter);
    this.vocabulary = vocabulary;
    this.term = term;
  }

  getRootQuery() {
    return this.wp.posts().taxonomy(this.vocabulary, this.term);
  }

  getReferencePath(record) {
    return `postsById[${record.id}]`;
  }

  getReturnPath(index) {
    return (typeof index !== 'undefined')
      ? ['postsByTerm', this.vocabulary, this.term, index]
      : ['postsByTerm', this.vocabulary, this.term];
  }
}

export default PostsByTerm;
