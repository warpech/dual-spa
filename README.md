## Dual SPA (single page application) proof of concept

### Features

This proof of concept shows a web application that:
- implements HTML5 History API
- loads partial content (HTML) when clicked on link, without reloading whole document
- retains current state (loads the full page) when page is reloaded
- (not finished) ~~bind partials to data using JSON-Patch~~
- (not finished) ~~compound components/directives that don't have to be declared in main page (e.g. `<btn-group>` that consists of `<btn>` elements)~~

### Versions

It implemented in two versions:

- AngularJS
- W3C Web Components

### How it works

The partial content is located in `angularjs\partials\` and `wc\partials\`. Both directories contain copies of the same files.

The main documents are duplicated for the routing purposes:

 - for AngularJS version: `angularjs\index.html`, `angularjs\page_1\index.html`, `angularjs\page_2\index.html`
 - for W3C Web Components version: `wc\index.html`, `wc\page_1\index.html`, `wc\page_2\index.html`
