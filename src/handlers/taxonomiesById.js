var FetchById = require('./fetchById.js');

class TaxonomiesById extends FetchById {

  getIdQuery(id) {
    return this.wp.taxonomies().taxonomy(id);
  }

  getReturnPath(id, key) {
    return (typeof key !== 'undefined')
      ? ['taxonomies', id, 'meta', key]
      : ['taxonomies', id, 'meta'];
  }
}

export default TaxonomiesById;
