var FetchById = require('./fetchById.js');

// handler is "authors" rather than "users" because
// it does not request via authentication, and only
// users with posts (authors) are retrievable by
// anonymous request in the WP API 2.0

class AuthorsById extends FetchById {

  getIdQuery(id) {
    return this.wp.users().id(id);
  }

  getReturnPath(id, key) {
    return (typeof key !== 'undefined') ? ['authorsById', id, key] : ['authorsById', id];
  }
}

export default AuthorsById;
