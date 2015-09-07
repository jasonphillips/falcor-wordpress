var _ = require('lodash');
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

class FetchById {

  constructor(shared, ids, keys) {
    this.wp = shared.wp;
    this.log = shared.log;
    this.cacheGet = shared.cacheGet.bind(shared);
    this.ids = ids;
    this.keys = keys;
  }

  // Override with wp api promise
  getIdQuery(id) {
    return null;
  }

  // Override with specific Falcor return paths
  getReturnPath(id, key) {
    // keyless for error handler
    return (typeof key !== 'undefined') ? [id, key] : [id];
  }

  // Override with cache path to check for already retrieved object
  getCachedPath(id) {
    return `${id}`;
  }

  // Override with keys that should return references {key=>path}
  getReferenceKeys() {
    return {};
  }

  getPromises() {
    var promises = _.map(this.ids, (id) => {
      var itemPromise = new Promise((resolve, reject) => {
        // check cache for already fetched item this flight
        let cached = this.cacheGet(this.getCachedPath(id));
        if (typeof cached !== 'undefined') {
          resolve(cached);
        } else {
          let query = this.getIdQuery(id);
          this.log.info('GET: ' + query._renderURI());

          query.then((response) => {
            resolve(response);
          }).catch((err) => {
            this.log.error(err);
            resolve({error: `${err.status} for ${err.path}`});
          });
        }
      });

      return itemPromise;
    });

    return promises;
  }

  resolvePromises(promises) {
    return Promise.all(promises).then((records) => {
      var results = [];
      var referenceKeys = this.getReferenceKeys();

      this.ids.forEach((id, offset) => {
        var record = records[offset];

        this.keys.forEach((key) => {
          if (record.error) {
            results.push({
                path: this.getReturnPath(id, key),
                value: $error(record.error)
            });
          } else if (record.id || record.name) {
            let value = record[key];
            // reference keys
            if (typeof referenceKeys[key] === 'function') {
              results.push({
                path: this.getReturnPath(id, key),
                value: $ref(referenceKeys[key](id, value))
              });
            } else {
              if (typeof value === 'object' && value.rendered) {
                // handle WP 2.0 {rendered} values
                value = value.rendered;
              }
              results.push({
                  path: this.getReturnPath(id, key),
                  value: value
              });
            }
          } else {
            results.push({
                path: this.getReturnPath(id),
                value: $error(id + ' not found')
            });
          }
        });
      });
      return results;
    });
  }

  buildReturn() {
    return this.resolvePromises(this.getPromises());
  }
}

export default FetchById;
