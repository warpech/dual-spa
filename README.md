## Dual SPA (single page application) proof of concept

### Features

This demo shows a proof of concept of a web application that:

- loads partial content while changing the URL using HTML5 History API
- (not finished) ~~binds partial content to JSON data source~~
- (not finished) ~~uses compound component `<btn-group>` that consists of `<btn>` elements~~

### Versions

The POC is implemented in two versions:

- AngularJS
- W3C Web Components

### How it works

The partial content is located in `angularjs\partials\` and `wc\partials\`. Both directories contain copies of the same files.

The main documents are duplicated for the routing purposes:

 - for AngularJS version: `angularjs\index.html`, `angularjs\page_1\index.html`, `angularjs\page_2\index.html`
 - for W3C Web Components version: `wc\index.html`, `wc\page_1\index.html`, `wc\page_2\index.html`
