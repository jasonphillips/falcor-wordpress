# Falcor Wordpress Router

This project is a work in-progress implementation for consuming the [Wordpress REST API](https://github.com/WP-API/WP-API) via a Falcor endpoint running in node.js. The result will be far cleaner client code and a dramatic reduction in client network requests when pulling in a variety of related or interlinked content.

## Getting Started

```
# clone repo
npm install
npm start
# open your browser and visit http://localhost:9090
```

The demo page allows you to test live queries against the offical [Wordpress Rest API demo site](http://demo.wp-api.org/), including a couple of examples to get you started.

**Note:** there are some differences betweeen the 1.0 and 2.0 branches of the WP API. The demo site used here is on 2.0.

## Currently implemented routes

- [x] postsById
- [x] recentPosts
- [x] taxonomies (meta, terms list)
- [x] termsById
- [x] authorsById
- [ ] more to come...
