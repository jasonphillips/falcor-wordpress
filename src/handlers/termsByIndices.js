var FetchByIndices = require('./FetchByIndices.js');

class TermsByIndices extends FetchByIndices {

  constructor(shared, indices, filter, vocabulary, parentId) {
    super(shared, indices, filter);
    this.vocabulary = vocabulary;
    this.parentId = parentId;
  }

  getRootQuery() {
    let query = this.wp[this.vocabulary]();
    if (this.parentId) {
      query = query.parent(this.parentId);
    }
    return query;
  }

  getReferencePath(record) {
    return `termsById.${this.vocabulary}[${record.id}]`;
  }

  getReturnPath(index) {
    let base = ['taxonomies', this.vocabulary, this.parentId ? 'termsByParentId' : 'terms'];
    if (this.parentId) {
      base.push(this.parentId);
    }
    return (typeof index !== 'undefined')
      ? base.concat([index])
      : base;
  }
}

export default TermsByIndices;
