# Falcor Wordpress Router

This project is a work in-progress implementation for consuming the [Wordpress REST API](https://github.com/WP-API/WP-API) via a Falcor endpoint running in node.js. The result will be far cleaner client code and a dramatic reduction in client network requests when pulling in a variety of related or interlinked content.

## Getting Started

A demo running in `express` with a simple front-end is included.

```
# install library dependencies
npm install

# install demo dependencies and run
cd demo
npm install
npm start

# open your browser and visit http://localhost:9090
```

The demo page allows you to test live queries against the offical [Wordpress Rest API demo site](http://demo.wp-api.org/), including a number of examples to get you started.

**Note:** there are some differences betweeen the 1.0 and 2.0 branches of the WP API. This package targets  2.0, and uses a 2.0 endpoint for its demo.

## Currently implemented top-level routes

Below are the top-level routes available, along with some example paths that might be requested (try these live on the included demo).

### postsById

Basic example:  `postsById[171,131]["title","slug","link"]`

```json
{
   "postsById": {
      "131": {
         "title": "Ipsam mollitia eveniet hic",
         "slug": "ipsam-mollitia-eveniet-hic",
         "link": "http://demo.wp-api.org/2015/08/21/ipsam-mollitia-eveniet-hic/"
      },
      "171": {
         "title": "Sint aperiam autem molestiae debitis",
         "slug": "sint-aperiam-autem-molestiae-debitis",
         "link": "http://demo.wp-api.org/2015/08/12/sint-aperiam-autem-molestiae-debitis/"
      }
   }
}
```

Going deeper: `postsById[131].terms.category[0].name`

```json
{
   "postsById": {
      "131": {
         "terms": {
            "category": {
               "0": {
                  "name": "Illum in fugit assumenda quo et reprehenderit maxime saepe"
               }
            }
         }
      }
   }
}
```

### recentPosts

Basic example: `recentPosts[0..2].title`

```json
{
   "recentPosts": {
      "0": {
         "title": "Repellat dolor architecto inventore"
      },
      "1": {
         "title": "Dolor adipisci soluta eum ipsam deserunt"
      },
      "2": {
         "title": "Ipsam mollitia eveniet hic"
      }
   }
}
```

Going deeper: `recentPosts[5].terms.category[0].name`

```json
{
   "recentPosts": {
      "5": {
         "terms": {
            "category": {
               "0": {
                  "name": "In fugit quae libero a"
               }
            }
         }
      }
   }
}
```

## termsById[vocabulary]

Categories example: `termsById.category[4,70]['name','description']`

```json
{
   "termsById": {
      "category": {
         "4": {
            "name": "Ab iusto",
            "description": "Sunt distinctio asperiores dolores quae odit necessitatibus dolor dolore quo doloremque nam incidunt molestiae facilis quisquam voluptatem voluptas et voluptas sapiente laudantium fugiat"
         },
         "70": {
            "name": "Accusantium nulla omnis quos",
            "description": "Occaecati placeat et dolores tempore unde est laudantium ipsam tempora accusamus culpa sequi aut aut dolore minus pariatur fugit ut ipsa et distinctio minus amet ut id molestiae assumenda aliquam vel qui quibusdam"
         }
      }
   }
}
```

Tags example: `termsById.tag[36]['slug','name']`

```json
{
   "termsById": {
      "tag": {
         "36": {
            "slug": "accusantium-dolore-porro-nihil-eveniet-dolores-impedit-quisquam",
            "name": "Accusantium dolore porro nihil eveniet dolores impedit quisquam"
         }
      }
   }
}
```

## taxonomies

Metadata: `taxonomies.category.meta['name','slug']`

```json
{
   "taxonomies": {
      "category": {
         "meta": {
            "name": "Categories",
            "slug": "category"
         }
      }
   }
}
```

Number of available terms: `taxonomies.category.terms.length`

```json
{
   "taxonomies": {
      "category": {
         "terms": {
            "length": "52"
         }
      }
   }
}
```

Terms range: `taxonomies.tag.terms[0..2]['name']`

```json
{
   "taxonomies": {
      "tag": {
         "terms": {
            "0": {
               "name": "Accusantium dolore porro nihil eveniet dolores impedit quisquam"
            },
            "1": {
               "name": "Ad et modi ipsam in iure"
            },
            "2": {
               "name": "Adipisci ut tempora quisquam"
            }
         }
      }
   }
}
```

## Other routes

These are also available at root, though generally more useful where referenced elsewhere:  

`authorsById`
`mediaById`

**Media** linked as featured image: `postsById[131].featured_image.media_details.sizes.thumbnail.file`

```json
{
   "postsById": {
      "131": {
         "featured_image": {
            "media_details": {
               "sizes": {
                  "thumbnail": {
                     "file": "fba2be87-deae-3077-96b4-d1754a1802ca-150x150.jpg"
                  }
               }
            }
         }
      }
   }
}
```

**Author** of a post: `postsById[171].author.name`

```json
{
   "postsById": {
      "171": {
         "author": {
            "name": "Cassidy"
         }
      }
   }
}
```





## Roadmap

- [x] postsById
- [x] recentPosts
- [x] taxonomies (meta, terms list)
- [x] termsById
- [x] authorsById
- [x] mediaById
- [ ] posts by term
- [ ] more linked subqueries
- [ ] additional listings by varied sorts
