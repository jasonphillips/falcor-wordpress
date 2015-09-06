var _ = require('lodash');
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

class FetchById {

  constructor(shared, ids, keys) {
    this.wp = shared.wp;
    this.log = shared.log;
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

  getPromises() {
    var promises = _.map(this.ids, (id) => {
      var itemPromise = new Promise((resolve, reject) => {
        this.getIdQuery(id).then((response) => {
          resolve(response);
        }).catch((err) => {
          this.log.error(err);
          resolve({error: `${err.status} for ${err.path}`});
        });
      });

      return itemPromise;
    });

    return promises;
  }

  resolvePromises(promises) {
    return Promise.all(promises).then((records) => {
      var results = [];

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
            // handle WP 2.0 {rendered} values
            if (typeof value === 'object' && value.rendered) {
              value = value.rendered;
            }
            results.push({
                path: this.getReturnPath(id, key),
                value: value
            });
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
