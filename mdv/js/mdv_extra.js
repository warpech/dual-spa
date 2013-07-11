
(function() {

  // BEGIN Attach MDV TemplateIterator to Template (as we can't reach the side tables)
  var xx = Function.prototype.bind;
  Function.prototype.bind = function() {
    var ret = xx.apply(this,arguments);
    ret.BOUND_THIS = this;
    ret.BOUND_ARGUMENTS = arguments;
    return ret;
  }
  var yy = window.CompoundBinding.prototype.bind;
  window.CompoundBinding.prototype.bind = function() {
    var ret = yy.apply(this,arguments);
    var c = this.combinator_;
    if (c && c.BOUND_ARGUMENTS.length>0) {
      var iterator = this.combinator_.BOUND_ARGUMENTS[0];
      var template = iterator.templateElement_.ref;
      template._ATTACHED_ITERATOR = iterator;
    }
    return ret;
  }
  // END

  Object.defineProperty(HTMLTemplateElement.prototype, "instanceModel", {
    get : function() {
      var template = this.ref;
      var iterator = template._ATTACHED_ITERATOR;
      if (iterator && template) {
        var model = template._ATTACHED_ITERATOR.getInstanceModel(template, iterator.iteratedValue[0],null);
        var instanceModel = iterator.getInstanceModel(template,model);
        return instanceModel;
      }
      return null;
    },
    enumerable : true,
    configurable : true });

}());
