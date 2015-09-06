var FetchById = require('./fetchById.js');

class MediaById extends FetchById {

  getIdQuery(id) {
    return this.wp.media().id(id);
  }

  getReturnPath(id, key) {
    return (typeof key !== 'undefined') ? ['mediaById', id, key] : ['mediaById', id];
  }
}

export default MediaById;
