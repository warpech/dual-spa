/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

// imports

var flags = scope.flags;
var base = scope.basePath;

// truthy value for any of these flags or failure to detect native
// shadowDOM results in polyfill
flags.shadow = (flags.shadowdom || flags.shadow || flags.polyfill ||
    !HTMLElement.prototype.webkitCreateShadowRoot) && 'polyfill';

// module dependencies

var ShadowDOMNative = [
  'lib/patches-shadowdom-native.js'
];

var ShadowDOMPolyfill = [
  '../ShadowDOM/shadowdom.js',
  'lib/patches-shadowdom-polyfill.js'
];

var Lib = [
  'lib/lang.js',
  'lib/dom.js',
  'lib/template.js',
  'lib/inspector.js',
];

var MDV = [
  '../mdv/mdv.js',
  'lib/patches-mdv.js'
];

var Pointer = [
  '../PointerGestures/pointergestures.js'
];

var WebElements = [
  '../HTMLImports/html-imports.js',
  '../CustomElements/custom-elements.js',
  'lib/patches-custom-elements.js'
];

// select ShadowDOM impl

var ShadowDOM = flags.shadow ? ShadowDOMPolyfill : ShadowDOMNative;

// construct active dependency list

modules = [].concat(
  ShadowDOM,
  Lib,
  WebElements,
  Pointer,
  MDV
);

// write script tags for dependencies

modules.forEach(function(inSrc) {
  document.write('<script src="' + base + inSrc + '"></script>');
});

})(Platform);
