// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function(global) {
  'use strict';

  function assert(v) {
    if (!v)
      throw new Error('Assertion failed');
  }

  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

  var filter = Array.prototype.filter.call.bind(Array.prototype.filter);

  function getTreeScope(node) {
    while (node.parentNode) {
      node = node.parentNode;
    }

    return typeof node.getElementById === 'function' ? node : null;
  }

  var Map;
  if (global.Map && typeof global.Map.prototype.forEach === 'function') {
    Map = global.Map;
  } else {
    Map = function() {
      this.keys = [];
      this.values = [];
    };

    Map.prototype = {
      set: function(key, value) {
        var index = this.keys.indexOf(key);
        if (index < 0) {
          this.keys.push(key);
          this.values.push(value);
        } else {
          this.values[index] = value;
        }
      },

      get: function(key) {
        var index = this.keys.indexOf(key);
        if (index < 0)
          return;

        return this.values[index];
      },

      delete: function(key, value) {
        var index = this.keys.indexOf(key);
        if (index < 0)
          return false;

        this.keys.splice(index, 1);
        this.values.splice(index, 1);
        return true;
      },

      forEach: function(f, opt_this) {
        for (var i = 0; i < this.keys.length; i++)
          f.call(opt_this || this, this.values[i], this.keys[i], this);
      }
    };
  }

  // JScript does not have __proto__. We wrap all object literals with
  // createObject which uses Object.create, Object.defineProperty and
  // Object.getOwnPropertyDescriptor to create a new object that does the exact
  // same thing. The main downside to this solution is that we have to extract
  // all those property descriptors for IE.
  var createObject = ('__proto__' in {}) ?
      function(obj) { return obj; } :
      function(obj) {
        var proto = obj.__proto__;
        if (!proto)
          return obj;
        var newObject = Object.create(proto);
        Object.getOwnPropertyNames(obj).forEach(function(name) {
          Object.defineProperty(newObject, name,
                               Object.getOwnPropertyDescriptor(obj, name));
        });
        return newObject;
      };

  // IE does not support have Document.prototype.contains.
  if (typeof document.contains != 'function') {
    Document.prototype.contains = function(node) {
      if (node === this || node.parentNode === this)
        return true;
      return this.documentElement.contains(node);
    }
  }

  var SideTable;
  "undefined" != typeof WeakMap && navigator.userAgent.indexOf("Firefox/") < 0 ? SideTable = WeakMap : function() {
      var a = Object.defineProperty, b = Object.hasOwnProperty, c = new Date().getTime() % 1e9;
      SideTable = function() {
          this.name = "__st" + (1e9 * Math.random() >>> 0) + (c++ + "__");
      }, SideTable.prototype = {
          set: function(b, c) {
              a(b, this.name, {
                  value: c,
                  writable: !0
              });
          },
          get: function(a) {
              return b.call(a, this.name) ? a[this.name] : void 0;
          },
          "delete": function(a) {
              this.set(a, void 0);
          }
      };
  }();

  function isNodeInDocument(node) {
    return node.ownerDocument.contains(node);
  }

  function bindNode(name, model, path) {
    console.error('Unhandled binding to Node: ', this, name, model, path);
  }

  function unbindNode(name) {}
  function unbindAllNode() {}

  Node.prototype.bind = bindNode;
  Node.prototype.unbind = unbindNode;
  Node.prototype.unbindAll = unbindAllNode;

  var textContentBindingTable = new SideTable();

  function Binding(model, path, changed) {
    this.model = model;
    this.path = path;
    this.changed = changed;
    this.observer = new PathObserver(this.model, this.path, this.changed);
    this.changed(this.observer.value);
  }

  Binding.prototype = {
    dispose: function() {
      if (this.model && typeof this.model.dispose == 'function')
        this.model.dispose();

      this.observer.close();
    },

    set value(newValue) {
      PathObserver.setValueAtPath(this.model, this.path, newValue);
    },

    reset: function() {
      this.observer.reset();
    }
  };

  function boundSetTextContent(textNode) {
    return function(value) {
      textNode.data = value == undefined ? '' : String(value);
    };
  }

  function bindText(name, model, path) {
    if (name !== 'textContent')
      return Node.prototype.bind.call(this, name, model, path);

    this.unbind('textContent');
    var binding = new Binding(model, path, boundSetTextContent(this));
    textContentBindingTable.set(this, binding);
  }

  function unbindText(name) {
    if (name != 'textContent')
      return Node.prototype.unbind.call(this, name);

    var binding = textContentBindingTable.get(this);
    if (!binding)
      return;

    binding.dispose();
    textContentBindingTable.delete(this);
  }

  function unbindAllText() {
    this.unbind('textContent');
    Node.prototype.unbindAll.call(this);
  }

  Text.prototype.bind = bindText;
  Text.prototype.unbind = unbindText;
  Text.prototype.unbindAll = unbindAllText;

  var attributeBindingsTable = new SideTable();

  function boundSetAttribute(element, attributeName, conditional) {
    if (conditional) {
      return function(value) {
        if (!value)
          element.removeAttribute(attributeName);
        else
          element.setAttribute(attributeName, '');
      };
    }

    return function(value) {
      element.setAttribute(attributeName,
                           String(value === undefined ? '' : value));
    };
  }

  function ElementAttributeBindings() {
    this.bindingMap = Object.create(null);
  }

  ElementAttributeBindings.prototype = {
    add: function(element, attributeName, model, path) {
      element.removeAttribute(attributeName);
      var conditional = attributeName[attributeName.length - 1] == '?';
      if (conditional)
        attributeName = attributeName.slice(0, -1);

      this.remove(attributeName);

      var binding = new Binding(model, path,
          boundSetAttribute(element, attributeName, conditional));

      this.bindingMap[attributeName] = binding;
    },

    remove: function(attributeName) {
      var binding = this.bindingMap[attributeName];
      if (!binding)
        return;

      binding.dispose();
      delete this.bindingMap[attributeName];
    },

    removeAll: function() {
      Object.keys(this.bindingMap).forEach(function(attributeName) {
        this.remove(attributeName);
      }, this);
    }
  };

  function bindElement(name, model, path) {
    var bindings = attributeBindingsTable.get(this);
    if (!bindings) {
      bindings = new ElementAttributeBindings();
      attributeBindingsTable.set(this, bindings);
    }

    // ElementAttributeBindings takes care of removing old binding as needed.
    bindings.add(this, name, model, path);
  }

  function unbindElement(name) {
    var bindings = attributeBindingsTable.get(this);
    if (bindings)
      bindings.remove(name);
  }

  function unbindAllElement(name) {
    var bindings = attributeBindingsTable.get(this);
    if (!bindings)
      return;
    attributeBindingsTable.delete(this);
    bindings.removeAll();
    Node.prototype.unbindAll.call(this);
  }


  Element.prototype.bind = bindElement;
  Element.prototype.unbind = unbindElement;
  Element.prototype.unbindAll = unbindAllElement;

  var valueBindingTable = new SideTable();
  var checkedBindingTable = new SideTable();

  var checkboxEventType;
  (function() {
    // Attempt to feature-detect which event (change or click) is fired first
    // for checkboxes.
    var div = document.createElement('div');
    var checkbox = div.appendChild(document.createElement('input'));
    checkbox.setAttribute('type', 'checkbox');
    var first;
    var count = 0;
    checkbox.addEventListener('click', function(e) {
      count++;
      first = first || 'click';
    });
    checkbox.addEventListener('change', function() {
      count++;
      first = first || 'change';
    });

    var event = document.createEvent('MouseEvent');
    event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false,
        false, false, false, 0, null);
    checkbox.dispatchEvent(event);
    // WebKit/Blink don't fire the change event if the element is outside the
    // document, so assume 'change' for that case.
    checkboxEventType = count == 1 ? 'change' : first;
  })();

  function getEventForInputType(element) {
    switch (element.type) {
      case 'checkbox':
        return checkboxEventType;
      case 'radio':
      case 'select-multiple':
      case 'select-one':
        return 'change';
      default:
        return 'input';
    }
  }

  function InputBinding(element, valueProperty, model, path) {
    this.element = element;
    this.valueProperty = valueProperty;
    this.boundValueChanged = this.valueChanged.bind(this);
    this.boundUpdateBinding = this.updateBinding.bind(this);

    this.binding = new Binding(model, path, this.boundValueChanged);
    this.element.addEventListener(getEventForInputType(this.element),
                                  this.boundUpdateBinding, true);
  }

  InputBinding.prototype = {
    valueChanged: function(newValue) {
      this.element[this.valueProperty] = this.produceElementValue(newValue);
    },

    updateBinding: function() {
      this.binding.value = this.element[this.valueProperty];
      this.binding.reset();
      if (this.postUpdateBinding)
        this.postUpdateBinding();

      Platform.performMicrotaskCheckpoint();
    },

    unbind: function() {
      this.binding.dispose();
      this.element.removeEventListener(getEventForInputType(this.element),
                                        this.boundUpdateBinding, true);
    }
  };

  function ValueBinding(element, model, path) {
    InputBinding.call(this, element, 'value', model, path);
  }

  ValueBinding.prototype = createObject({
    __proto__: InputBinding.prototype,

    produceElementValue: function(value) {
      return String(value == null ? '' : value);
    }
  });

  // |element| is assumed to be an HTMLInputElement with |type| == 'radio'.
  // Returns an array containing all radio buttons other than |element| that
  // have the same |name|, either in the form that |element| belongs to or,
  // if no form, in the document tree to which |element| belongs.
  //
  // This implementation is based upon the HTML spec definition of a
  // "radio button group":
  //   http://www.whatwg.org/specs/web-apps/current-work/multipage/number-state.html#radio-button-group
  //
  function getAssociatedRadioButtons(element) {
    if (!isNodeInDocument(element))
      return [];
    if (element.form) {
      return filter(element.form.elements, function(el) {
        return el != element &&
            el.tagName == 'INPUT' &&
            el.type == 'radio' &&
            el.name == element.name;
      });
    } else {
      var radios = element.ownerDocument.querySelectorAll(
          'input[type="radio"][name="' + element.name + '"]');
      return filter(radios, function(el) {
        return el != element && !el.form;
      });
    }
  }

  function CheckedBinding(element, model, path) {
    InputBinding.call(this, element, 'checked', model, path);
  }

  CheckedBinding.prototype = createObject({
    __proto__: InputBinding.prototype,

    produceElementValue: function(value) {
      return Boolean(value);
    },

    postUpdateBinding: function() {
      // Only the radio button that is getting checked gets an event. We
      // therefore find all the associated radio buttons and update their
      // CheckedBinding manually.
      if (this.element.tagName === 'INPUT' &&
          this.element.type === 'radio') {
        getAssociatedRadioButtons(this.element).forEach(function(r) {
          var checkedBinding = checkedBindingTable.get(r);
          if (checkedBinding) {
            // Set the value directly to avoid an infinite call stack.
            checkedBinding.binding.value = false;
          }
        });
      }
    }
  });

  function bindInput(name, model, path) {
    switch(this.tagName + '.' + name.toLowerCase()) {
      case 'INPUT.value':
      case 'TEXTAREA.value':
        this.unbind('value');
        this.removeAttribute('value');
        valueBindingTable.set(this, new ValueBinding(this, model, path));
        break;
      case 'INPUT.checked':
        this.unbind('checked');
        this.removeAttribute('checked');
        checkedBindingTable.set(this, new CheckedBinding(this, model, path));
        break;
      case 'SELECT.selectedindex':
        this.unbind('selectedindex');
        this.removeAttribute('selectedindex');
        valueBindingTable.set(this,
                              new SelectedIndexBinding(this, model, path));
        break;
      default:
        return Element.prototype.bind.call(this, name, model, path);
        break;
    }
  }

  function unbindInput(name) {
    switch(this.tagName + '.' + name.toLowerCase()) {
      case 'INPUT.value':
      case 'TEXTAREA.value':
        var valueBinding = valueBindingTable.get(this);
        if (valueBinding) {
          valueBinding.unbind();
          valueBindingTable.delete(this);
        }
        break;
      case 'INPUT.checked':
        var checkedBinding = checkedBindingTable.get(this);
        if (checkedBinding) {
          checkedBinding.unbind();
          checkedBindingTable.delete(this)
        }
        break;
      case 'SELECT.selectedindex':
        var valueBinding = valueBindingTable.get(this);
        if (valueBinding) {
          valueBinding.unbind();
          valueBindingTable.delete(this);
        }
        break;
      default:
        return Element.prototype.unbind.call(this, name);
        break;
    }
  }

  function unbindAllInput(name) {
    switch (this.tagName) {
      case 'INPUT':
        this.unbind('checked');
        // fallthrough
      case 'TEXTAREA':
        this.unbind('value');
        break;
      case 'SELECT':
        this.unbind('selectedindex');
        break;
    }

    Element.prototype.unbindAll.call(this);
  }

  HTMLInputElement.prototype.bind = bindInput;
  HTMLInputElement.prototype.unbind = unbindInput;
  HTMLInputElement.prototype.unbindAll = unbindAllInput;

  function SelectedIndexBinding(element, model, path) {
    InputBinding.call(this, element, 'selectedIndex', model, path);
  }

  SelectedIndexBinding.prototype = createObject({
    __proto__: InputBinding.prototype,

    valueChanged: function(newValue) {
      var newValue = this.produceElementValue(newValue);
      if (newValue <= this.element.length) {
        this.element[this.valueProperty] = newValue;
        return;
      }

      // The binding may wish to bind to an <option> which has not yet been
      // produced by a child <template>. Delay a maximum of two times: once for
      // each of <optgroup> and <option>
      var maxRetries = 2;
      var self = this;
      function delaySetSelectedIndex() {
        if (newValue > self.element.length && maxRetries--)
          ensureScheduled(delaySetSelectedIndex);
        else
          self.element[self.valueProperty] = newValue;
      }
      ensureScheduled(delaySetSelectedIndex);
    },

    produceElementValue: function(value) {
      return Number(value);
    }
  });

  HTMLSelectElement.prototype.bind = bindInput;
  HTMLSelectElement.prototype.unbind = unbindInput;
  HTMLSelectElement.prototype.unbindAll = unbindAllInput;

  HTMLTextAreaElement.prototype.bind = bindInput;
  HTMLTextAreaElement.prototype.unbind = unbindInput;
  HTMLTextAreaElement.prototype.unbindAll = unbindAllInput;

  var BIND = 'bind';
  var REPEAT = 'repeat';
  var IF = 'if';
  var GET_BINDING = 'getBinding';
  var GET_INSTANCE_MODEL = 'getInstanceModel';

  var templateAttributeDirectives = {
    'template': true,
    'repeat': true,
    'bind': true,
    'ref': true
  };

  var semanticTemplateElements = {
    'THEAD': true,
    'TBODY': true,
    'TFOOT': true,
    'TH': true,
    'TR': true,
    'TD': true,
    'COLGROUP': true,
    'COL': true,
    'CAPTION': true,
    'OPTION': true,
    'OPTGROUP': true
  };

  var hasTemplateElement = typeof HTMLTemplateElement !== 'undefined';

  var allTemplatesSelectors = 'template, ' +
      Object.keys(semanticTemplateElements).map(function(tagName) {
        return tagName.toLowerCase() + '[template]';
      }).join(', ');

  function isAttributeTemplate(el) {
    return semanticTemplateElements[el.tagName] &&
        el.hasAttribute('template');
  }

  function isTemplate(el) {
    return el.tagName == 'TEMPLATE' || isAttributeTemplate(el);
  }

  function isNativeTemplate(el) {
    return hasTemplateElement && el.tagName == 'TEMPLATE';
  }

  var ensureScheduled = function() {
    // We need to ping-pong between two Runners in order for the tests to
    // simulate proper end-of-microtask behavior for Object.observe. Without
    // this, we'll continue delivering to a single observer without allowing
    // other observers in the same microtask to make progress.
    var current;
    var next;

    function Runner() {
      var self = this;
      this.value = false;
      var lastValue = this.value;

      var scheduled = [];
      var running = false;

      this.schedule = function(fn) {
        if (scheduled.indexOf(fn) >= 0)
          return true;
        if (running)
          return false;

        scheduled.push(fn);
        if (lastValue === self.value)
          self.value = !self.value;

        return true;
      }

      var observer = new PathObserver(this, 'value', function() {
        running = true;

        for (var i = 0; i < scheduled.length; i++) {
          var fn = scheduled[i];
          scheduled[i] = undefined;
          fn();
        }

        scheduled = [];
        lastValue = self.value;

        current = next;
        next = self;

        running = false;
      });
    }

    current = new Runner();
    next = new Runner();

    function ensureScheduled(fn) {
      current.schedule(fn) || next.schedule(fn);
    }

    return ensureScheduled;
  }();

  // FIXME: Observe templates being added/removed from documents
  // FIXME: Expose imperative API to decorate and observe templates in
  // "disconnected tress" (e.g. ShadowRoot)
  document.addEventListener('DOMContentLoaded', function(e) {
    bootstrapTemplatesRecursivelyFrom(document);
    // FIXME: Is this needed? Seems like it shouldn't be.
    Platform.performMicrotaskCheckpoint();
  }, false);

  function forAllTemplatesFrom(node, fn) {
    var subTemplates = node.querySelectorAll(allTemplatesSelectors);

    if (isTemplate(node))
      fn(node)
    forEach(subTemplates, fn);
  }

  function bootstrapTemplatesRecursivelyFrom(node) {
    function bootstrap(template) {
      if (!HTMLTemplateElement.decorate(template))
        bootstrapTemplatesRecursivelyFrom(template.content);
    }

    forAllTemplatesFrom(node, bootstrap);
  }

  if (!hasTemplateElement) {
    /**
     * This represents a <template> element.
     * @constructor
     * @extends {HTMLElement}
     */
    global.HTMLTemplateElement = function() {
      throw TypeError('Illegal constructor');
    };
  }

  var hasProto = '__proto__' in {};

  function mixin(to, from) {
    Object.getOwnPropertyNames(from).forEach(function(name) {
      Object.defineProperty(to, name,
                            Object.getOwnPropertyDescriptor(from, name));
    });
  }

  var templateContentsTable = new SideTable();
  var templateContentsOwnerTable = new SideTable();
  var templateInstanceRefTable = new SideTable();

  // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/templates/index.html#dfn-template-contents-owner
  function getTemplateContentsOwner(doc) {
    if (!doc.defaultView)
      return doc;
    var d = templateContentsOwnerTable.get(doc);
    if (!d) {
      // TODO(arv): This should either be a Document or HTMLDocument depending
      // on doc.
      d = doc.implementation.createHTMLDocument('');
      while (d.lastChild) {
        d.removeChild(d.lastChild);
      }
      templateContentsOwnerTable.set(doc, d);
    }
    return d;
  }

  // For non-template browsers, the parser will disallow <template> in certain
  // locations, so we allow "attribute templates" which combine the template
  // element with the top-level container node of the content, e.g.
  //
  //   <tr template repeat="{{ foo }}"" class="bar"><td>Bar</td></tr>
  //
  // becomes
  //
  //   <template repeat="{{ foo }}">
  //   + #document-fragment
  //     + <tr class="bar">
  //       + <td>Bar</td>
  //
  function extractTemplateFromAttributeTemplate(el) {
    var template = el.ownerDocument.createElement('template');
    el.parentNode.insertBefore(template, el);

    var attribs = el.attributes;
    var count = attribs.length;
    while (count-- > 0) {
      var attrib = attribs[count];
      if (templateAttributeDirectives[attrib.name]) {
        if (attrib.name !== 'template')
          template.setAttribute(attrib.name, attrib.value);
        el.removeAttribute(attrib.name);
      }
    }

    return template;
  }

  function liftNonNativeTemplateChildrenIntoContent(template, el, useRoot) {
    var content = template.content;
    if (useRoot) {
      content.appendChild(el);
      return;
    }

    var child;
    while (child = el.firstChild) {
      content.appendChild(child);
    }
  }

  /**
   * Ensures proper API and content model for template elements.
   * @param {HTMLTemplateElement} opt_instanceRef The template element which
   *     |el| template element will return as the value of its ref(), and whose
   *     content will be used as source when createInstance() is invoked.
   */
  HTMLTemplateElement.decorate = function(el, opt_instanceRef) {
    if (el.templateIsDecorated_)
      return false;

    var templateElement = el;
    var isNative = isNativeTemplate(templateElement);
    var bootstrapContents = isNative;
    var liftContents = !isNative;
    var liftRoot = false;

    if (!isNative && isAttributeTemplate(templateElement)) {
      assert(!opt_instanceRef);
      templateElement = extractTemplateFromAttributeTemplate(el);
      isNative = isNativeTemplate(templateElement);
      liftRoot = true;
    }

    templateElement.templateIsDecorated_ = true;

    if (!isNative) {
      fixTemplateElementPrototype(templateElement);
      var doc = getTemplateContentsOwner(templateElement.ownerDocument);
      templateContentsTable.set(templateElement, doc.createDocumentFragment());
    }

    if (opt_instanceRef) {
      // template is contained within an instance, its direct content must be
      // empty
      templateInstanceRefTable.set(templateElement, opt_instanceRef);
    } else if (liftContents) {
      liftNonNativeTemplateChildrenIntoContent(templateElement,
                                               el,
                                               liftRoot);
    } else if (bootstrapContents) {
      bootstrapTemplatesRecursivelyFrom(templateElement.content);
    }

    return true;
  };

  // TODO(rafaelw): This used to decorate recursively all templates from a given
  // node. This happens by default on 'DOMContentLoaded', but may be needed
  // in subtrees not descendent from document (e.g. ShadowRoot).
  // Review whether this is the right public API.
  HTMLTemplateElement.bootstrap = bootstrapTemplatesRecursivelyFrom;

  var htmlElement = global.HTMLUnknownElement || HTMLElement;

  var contentDescriptor = {
    get: function() {
      return templateContentsTable.get(this);
    },
    enumerable: true,
    configurable: true
  };

  if (!hasTemplateElement) {
    // Gecko is more picky with the prototype than WebKit. Make sure to use the
    // same prototype as created in the constructor.
    HTMLTemplateElement.prototype = Object.create(htmlElement.prototype);

    Object.defineProperty(HTMLTemplateElement.prototype, 'content',
                          contentDescriptor);
  }

  function fixTemplateElementPrototype(el) {
    // Note: because we need to treat some semantic elements as template
    // elements (like tr or td), but don't want to reassign their proto (gecko
    // doesn't like that), we mixin the properties for those elements.
    if (el.tagName === 'TEMPLATE') {
      if (!hasTemplateElement) {
        if (hasProto)
          el.__proto__ = HTMLTemplateElement.prototype;
        else
          mixin(el, HTMLTemplateElement.prototype);
      }
    } else {
      mixin(el, HTMLTemplateElement.prototype);
      // FIXME: Won't need this when webkit methods move to the prototype.
      Object.defineProperty(el, 'content', contentDescriptor);
    }
  }

  var templateModelTable = new SideTable();
  var templateBindingDelegateTable = new SideTable();
  var templateSetModelFnTable = new SideTable();

  function ensureSetModelScheduled(template) {
    var setModelFn = templateSetModelFnTable.get(template);
    if (!setModelFn) {
      setModelFn = function() {
        addBindings(template, template.model, template.bindingDelegate);
      };

      templateSetModelFnTable.set(template, setModelFn);
    }

    ensureScheduled(setModelFn);
  }

  mixin(HTMLTemplateElement.prototype, {
    bind: function(name, model, path) {
      switch (name) {
        case BIND:
        case REPEAT:
        case IF:
          var templateIterator = templateIteratorTable.get(this);
          if (!templateIterator) {
            templateIterator = new TemplateIterator(this);
            templateIteratorTable.set(this, templateIterator);
          }

          templateIterator.inputs.bind(name, model, path || '');
          break;
        default:
          return Element.prototype.bind.call(this, name, model, path);
          break;
      }
    },

    unbind: function(name, model, path) {
      switch (name) {
        case BIND:
        case REPEAT:
        case IF:
          var templateIterator = templateIteratorTable.get(this);
          if (!templateIterator)
            break;

          // the template iterator will remove its instances and
          // abandon() itself if its inputs.size is 0.
          templateIterator.inputs.unbind(name);
          break;
        default:
          return Element.prototype.unbind.call(this, name, model, path);
          break;
      }
    },

    unbindAll: function() {
      this.unbind(BIND);
      this.unbind(REPEAT);
      this.unbind(IF);
      Element.prototype.unbindAll.call(this);
    },

    createInstance: function(model, delegate) {
      var instance = createDeepCloneAndDecorateTemplates(this.ref.content,
                                                         delegate);
      // TODO(rafaelw): This is a hack, and is neccesary for the polyfil
      // because custom elements are not upgraded during cloneNode()
      if (typeof HTMLTemplateElement.__instanceCreated == 'function')
        HTMLTemplateElement.__instanceCreated(instance);

      addBindings(instance, model, delegate);
      addTemplateInstanceRecord(instance, model);
      return instance;
    },

    get model() {
      return templateModelTable.get(this);
    },

    set model(model) {
      templateModelTable.set(this, model);
      ensureSetModelScheduled(this);
    },

    get bindingDelegate() {
      return templateBindingDelegateTable.get(this);
    },

    set bindingDelegate(bindingDelegate) {
      templateBindingDelegateTable.set(this, bindingDelegate);
      ensureSetModelScheduled(this);
    },

    get ref() {
      var ref;
      var refId = this.getAttribute('ref');
      if (refId) {
        var treeScope = getTreeScope(this);
        if (treeScope)
          ref = treeScope.getElementById(refId);
      }

      if (!ref)
        ref = templateInstanceRefTable.get(this);

      if (!ref)
        return this;

      var nextRef = ref.ref;
      return nextRef ? nextRef : ref;
    }
  });

  var TEXT = 0;
  var BINDING = 1;

  function Token(type, value) {
    this.type = type;
    this.value = value;
  }

  function parseMustacheTokens(s) {
    var result = [];
    var length = s.length;
    var index = 0, lastIndex = 0;
    while (lastIndex < length) {
      index = s.indexOf('{{', lastIndex);
      if (index < 0) {
        result.push(new Token(TEXT, s.slice(lastIndex)));
        break;
      } else {
        // There is a non-empty text run before the next path token.
        if (index > 0 && lastIndex < index) {
          result.push(new Token(TEXT, s.slice(lastIndex, index)));
        }
        lastIndex = index + 2;
        index = s.indexOf('}}', lastIndex);
        if (index < 0) {
          var text = s.slice(lastIndex - 2);
          var lastToken = result[result.length - 1];
          if (lastToken && lastToken.type == TEXT)
            lastToken.value += text;
          else
            result.push(new Token(TEXT, text));
          break;
        }

        var value = s.slice(lastIndex, index).trim();
        result.push(new Token(BINDING, value));
        lastIndex = index + 2;
      }
    }
    return result;
  }

  function bindOrDelegate(node, name, model, path, delegate) {
    var delegateBinding;
    var delegateFunction = delegate && delegate[GET_BINDING];
    if (delegateFunction && typeof delegateFunction == 'function') {
      delegateBinding = delegateFunction(model, path, name, node);
      if (delegateBinding) {
        model = delegateBinding;
        path = 'value';
      }
    }

    node.bind(name, model, path);
  }

  function parseAndBind(node, name, text, model, delegate) {
    var tokens = parseMustacheTokens(text);
    if (!tokens.length || (tokens.length == 1 && tokens[0].type == TEXT))
      return;

    if (tokens.length == 1 && tokens[0].type == BINDING) {
      bindOrDelegate(node, name, model, tokens[0].value, delegate);
      return;
    }

    var replacementBinding = new CompoundBinding();
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (token.type == BINDING)
        bindOrDelegate(replacementBinding, i, model, token.value, delegate);
    }

    replacementBinding.combinator = function(values) {
      var newValue = '';

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.type === TEXT) {
          newValue += token.value;
        } else {
          var value = values[i];
          if (value !== undefined)
            newValue += value;
        }
      }

      return newValue;
    };

    node.bind(name, replacementBinding, 'value');
  }

  function addAttributeBindings(element, model, delegate) {
    assert(element);

    var attrs = {};
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }

    if (isTemplate(element)) {
      // Accept 'naked' bind & repeat.
      if (attrs[BIND] === '')
        attrs[BIND] = '{{}}';
      if (attrs[REPEAT] === '')
        attrs[REPEAT] = '{{}}';

      // Treat <template if> as <template bind if>
      if (attrs[IF] !== undefined &&
          attrs[BIND] === undefined &&
          attrs[REPEAT] === undefined) {
        attrs[BIND] = '{{}}';
      }
    }

    Object.keys(attrs).forEach(function(attrName) {
      parseAndBind(element, attrName, attrs[attrName], model, delegate);
    });
  }

  function addBindings(node, model, delegate) {
    assert(node);

    if (node.nodeType === Node.ELEMENT_NODE) {
      addAttributeBindings(node, model, delegate);
    } else if (node.nodeType === Node.TEXT_NODE) {
      parseAndBind(node, 'textContent', node.data, model, delegate);
    }

    for (var child = node.firstChild; child ; child = child.nextSibling)
      addBindings(child, model, delegate);
  }

  function unbindAllRecursively(node) {
    templateInstanceTable.delete(node);
    if (isTemplate(node)) {
      // Make sure we stop observing when we remove an element.
      var templateIterator = templateIteratorTable.get(node);
      if (templateIterator) {
        templateIterator.abandon();
        templateIteratorTable.delete(node);
      }
    }

    node.unbindAll();
    for (var child = node.firstChild; child; child = child.nextSibling) {
      unbindAllRecursively(child);
    }
  }

  function createDeepCloneAndDecorateTemplates(node, delegate) {
    var clone = node.cloneNode(false);  // Shallow clone.
    if (isTemplate(clone)) {
      HTMLTemplateElement.decorate(clone, node);
      if (delegate)
        templateBindingDelegateTable.set(clone, delegate);
    }

     for (var child = node.firstChild; child; child = child.nextSibling) {
      clone.appendChild(createDeepCloneAndDecorateTemplates(child, delegate))
    }
    return clone;
  }

  function TemplateInstance(firstNode, lastNode, model) {
    // TODO(rafaelw): firstNode & lastNode should be read-synchronous
    // in cases where script has modified the template instance boundary.
    // All should be read-only.
    this.firstNode = firstNode;
    this.lastNode = lastNode;
    this.model = model;
  }

  function addTemplateInstanceRecord(fragment, model) {
    if (!fragment.firstChild)
      return;

    var instanceRecord = new TemplateInstance(fragment.firstChild,
                                              fragment.lastChild, model);
    var node = instanceRecord.firstNode;
    while (node) {
      templateInstanceTable.set(node, instanceRecord);
      node = node.nextSibling;
    }
  }

  var templateInstanceTable = new SideTable();

  Object.defineProperty(Node.prototype, 'templateInstance', {
    get: function() {
      var instance = templateInstanceTable.get(this);
      return instance ? instance :
          (this.parentNode ? this.parentNode.templateInstance : undefined);
    }
  });

  function CompoundBinding(combinator) {
    this.bindings = {};
    this.values = {};
    this.value = undefined;
    this.size = 0;
    this.combinator_ = combinator;
    this.boundResolve = this.resolve.bind(this);
    this.disposed = false;
  }

  CompoundBinding.prototype = {
    set combinator(combinator) {
      this.combinator_ = combinator;
      this.scheduleResolve();
    },

    bind: function(name, model, path) {
      this.unbind(name);

      this.size++;
      this.bindings[name] = new Binding(model, path, function(value) {
        this.values[name] = value;
        this.scheduleResolve();
      }.bind(this));
    },

    unbind: function(name, suppressResolve) {
      if (!this.bindings[name])
        return;

      this.size--;
      this.bindings[name].dispose();
      delete this.bindings[name];
      delete this.values[name];
      if (!suppressResolve)
        this.scheduleResolve();
    },

    // TODO(rafaelw): Is this the right processing model?
    // TODO(rafaelw): Consider having a seperate ChangeSummary for
    // CompoundBindings so to excess dirtyChecks.
    scheduleResolve: function() {
      ensureScheduled(this.boundResolve);
    },

    resolve: function() {
      if (this.disposed)
        return;

      if (!this.combinator_) {
        throw Error('CompoundBinding attempted to resolve without a ' +
                    'combinator');
      }

      this.value = this.combinator_(this.values);
    },

    dispose: function() {
      Object.keys(this.bindings).forEach(function(name) {
        this.unbind(name, true);
      }, this);

      this.disposed = true;
      this.value = undefined;
    }
  };

  function TemplateIterator(templateElement) {
    this.templateElement_ = templateElement;
    this.terminators = [];
    this.iteratedValue = undefined;
    this.arrayObserver = undefined;
    this.boundHandleSplices = this.handleSplices.bind(this);
    this.inputs = new CompoundBinding(this.resolveInputs.bind(this));
  }

  TemplateIterator.prototype = {
    resolveInputs: function(values) {
      if (IF in values && !values[IF])
        this.valueChanged(undefined);
      else if (REPEAT in values)
        this.valueChanged(values[REPEAT]);
      else if (BIND in values || IF in values)
        this.valueChanged([values[BIND]]);
      else
        this.valueChanged(undefined);
    },

    valueChanged: function(value) {
      if (!Array.isArray(value))
        value = undefined;

      var oldValue = this.iteratedValue;
      this.unobserve();
      this.iteratedValue = value;

      if (this.iteratedValue) {
        this.arrayObserver =
            new ArrayObserver(this.iteratedValue, this.boundHandleSplices);
      }

      var splices = ArrayObserver.calculateSplices(this.iteratedValue || [],
                                                   oldValue || []);

      if (splices.length)
        this.handleSplices(splices);

      if (!this.inputs.size) {
        // End iteration
        templateIteratorTable.delete(this);
        this.abandon();
      }
    },

    getTerminatorAt: function(index) {
      if (index == -1)
        return this.templateElement_;
      var terminator = this.terminators[index];
      if (terminator.nodeType !== Node.ELEMENT_NODE ||
          this.templateElement_ === terminator) {
        return terminator;
      }

      var subIterator = templateIteratorTable.get(terminator);
      if (!subIterator)
        return terminator;

      return subIterator.getTerminatorAt(subIterator.terminators.length - 1);
    },

    insertInstanceAt: function(index, instanceNodes) {
      var previousTerminator = this.getTerminatorAt(index - 1);
      var terminator =
        instanceNodes[instanceNodes.length - 1] || previousTerminator;
      this.terminators.splice(index, 0, terminator);
      var parent = this.templateElement_.parentNode;
      var insertBeforeNode = previousTerminator.nextSibling;
      for (var i = 0; i < instanceNodes.length; i++)
        parent.insertBefore(instanceNodes[i], insertBeforeNode);
    },

    extractInstanceAt: function(index) {
      var instanceNodes = [];
      var previousTerminator = this.getTerminatorAt(index - 1);
      var terminator = this.getTerminatorAt(index);
      this.terminators.splice(index, 1);

      var parent = this.templateElement_.parentNode;
      while (terminator !== previousTerminator) {
        var node = previousTerminator.nextSibling;
        if (node == terminator)
          terminator = previousTerminator;

        parent.removeChild(node);
        instanceNodes.push(node);
      }

      return instanceNodes;
    },

    getInstanceModel: function(template, model, delegate) {
      var delegateFunction = delegate && delegate[GET_INSTANCE_MODEL];
      if (delegateFunction && typeof delegateFunction == 'function')
        return delegateFunction(template, model);
      else
        return model;
    },

    getInstanceNodes: function(model, delegate, instanceCache) {
      var instanceNodes = instanceCache.get(model);
      if (instanceNodes) {
        instanceCache.delete(model);
        return instanceNodes;
      }

      instanceNodes = [];
      var fragment = this.templateElement_.createInstance(model, delegate);
      while (fragment.firstChild)
        instanceNodes.push(fragment.removeChild(fragment.firstChild));

      return instanceNodes;
    },

    handleSplices: function(splices) {
      var template = this.templateElement_;
      if (!template.parentNode || !template.ownerDocument.defaultView) {
        this.abandon();
        templateIteratorTable.delete(this);
        return;
      }

      var delegate = template.bindingDelegate;

      var instanceCache = new Map;
      var removeDelta = 0;
      splices.forEach(function(splice) {
        splice.removed.forEach(function(model) {
          var instanceNodes =
              this.extractInstanceAt(splice.index + removeDelta, instanceNodes);
          instanceCache.set(model, instanceNodes);
        }, this);

        removeDelta -= splice.addedCount;
      }, this);

      splices.forEach(function(splice) {
        var addIndex = splice.index;
        for (; addIndex < splice.index + splice.addedCount; addIndex++) {
          var model = this.getInstanceModel(template,
                                            this.iteratedValue[addIndex],
                                            delegate);
          var instanceNodes = this.getInstanceNodes(model, delegate,
                                                    instanceCache);
          this.insertInstanceAt(addIndex, instanceNodes);
        }
      }, this);

      instanceCache.forEach(function(instanceNodes) {
        for (var i = 0; i < instanceNodes.length; i++)
          unbindAllRecursively(instanceNodes[i]);
      });
    },

    unobserve: function() {
      if (!this.arrayObserver)
        return;

      this.arrayObserver.close();
      this.arrayObserver = undefined;
    },

    abandon: function() {
      this.unobserve();
      this.terminators.length = 0;
      Object.defineProperty(this.inputs, 'value', {
        configurable: true,
        writable: true,
        value: undefined
      });
      this.inputs.dispose();
    }
  };

  var templateIteratorTable = new SideTable();

  global.CompoundBinding = CompoundBinding;

  // Polyfill-specific API.
  HTMLTemplateElement.forAllTemplatesFrom_ = forAllTemplatesFrom;
  HTMLTemplateElement.bindAllMustachesFrom_ = addBindings;
  HTMLTemplateElement.parseAndBind_ = parseAndBind;
})(this);
