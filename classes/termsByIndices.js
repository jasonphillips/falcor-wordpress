var FetchByIndices = require('./FetchByIndices.js');

class TermsByIndices extends FetchByIndices {

  constructor(shared, indices, filter, vocabulary) {
    super(shared, indices, filter);
    this.vocabulary = vocabulary;
  }

  getRootQuery() {
    return this.wp.taxonomy(this.vocabulary).terms();
  }

  getReferencePath(record) {
    return `termsById.${this.vocabulary}[${record.id}]`;
  }

  getReturnPath(index) {
    return (typeof index !== 'undefined')
      ? ['taxonomies', this.vocabulary, 'terms', index]
      : ['taxonomies', this.vocabulary, 'terms'];
  }
}

export default TermsByIndices;
