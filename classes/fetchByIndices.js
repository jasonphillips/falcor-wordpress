var _ = require('lodash');
var jsonGraph = require('falcor-json-graph');
var $ref = jsonGraph.ref;
var $error = jsonGraph.error;

class FetchByIndices {

  constructor(shared, indices, filter) {
    this.wp = shared.wp;
    this.log = shared.log;
    this.indices = indices;
    this.filter = filter;
    this.paging = this.getPaging();
  }

  // Override with wp api promise
  getRootQuery() {
    return null;
  }

  // responses will be references to a byId path
  getReferencePath(record) {
    return record.id;
  }

  // Override with specific Falcor return paths
  getReturnPath(index) {
    return (typeof index !== 'undefined') ? [index] : null;
  }

  getPromise() {
    var rangePromise = new Promise((resolve, reject) => {
      var query = this.getRootQuery();
      if (this.filter) {
        query = query.filter(this.filter);
      }
      if (this.paging) {
        query = query.per_page(this.paging.perPage)
          .page(this.paging.page);
      }
      this.log.info('GET: ' + query._renderURI());
      query
        .then((response) => {
          resolve(response);
        }).catch((err) => {
          this.log.error(err);
          resolve({error: `${err.status} for ${err.path}`});
        });
    });
    return rangePromise;
  }

  resolvePromise(rangePromise) {
    return rangePromise.then((records) => {
      var referencesList = _.map(
        records, (record) => $ref(this.getReferencePath(record))
      );
      var results = [];
      var offset = this.paging ? this.paging.offset : 0;
      var total = this.paging ? records._paging.total : records.length;

      this.indices.forEach((index) => {
        if (index === 'length') {
          results.push({
            path: this.getReturnPath(index),
            value: total
          });
        } else {
          results.push({
            path: this.getReturnPath(index),
            value: referencesList[index - offset]
          });
        }
      });

      return results;
    }).catch((err) => {
      this.log.error(err);
      return [
        {
          path: this.getReturnPath(),
          value: $error(`${err.status} for ${err.path}`)
        }
      ];
    });
  }

  buildReturn() {
    return this.resolvePromise(this.getPromise());
  }

  getPaging() {
    var perPage; var page;
    var indices = _.without(this.indices, 'length');
    if (!indices.length) {
      indices = [0];
    }
    [perPage, page] = this.calculatePage(_.min(indices), _.max(indices));
    return {
      perPage: perPage,
      page: page,
      offset: perPage * (page - 1)
    };
  }

  // Calculate smallest page for range
  calculatePage(low, high) {
    var range = high - low + 1;
    if (range < low) {
      let perpage;
      for (perpage = range; perpage <= low; perpage++) {
        if (low % perpage <= perpage - range) {
          let offset = Math.floor(low / perpage);
          return [perpage, offset + 1];
        }
      }
      return perpage;
    }
    return [high + 1, 1];
  }
}

export default FetchByIndices;
