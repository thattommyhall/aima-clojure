var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6773 = x == null ? null : x;
  if(p[goog.typeOf(x__6773)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6774__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6774 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6774__delegate.call(this, array, i, idxs)
    };
    G__6774.cljs$lang$maxFixedArity = 2;
    G__6774.cljs$lang$applyTo = function(arglist__6775) {
      var array = cljs.core.first(arglist__6775);
      var i = cljs.core.first(cljs.core.next(arglist__6775));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6775));
      return G__6774__delegate(array, i, idxs)
    };
    G__6774.cljs$lang$arity$variadic = G__6774__delegate;
    return G__6774
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6860 = this$;
      if(and__3822__auto____6860) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6860
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2418__auto____6861 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6862 = cljs.core._invoke[goog.typeOf(x__2418__auto____6861)];
        if(or__3824__auto____6862) {
          return or__3824__auto____6862
        }else {
          var or__3824__auto____6863 = cljs.core._invoke["_"];
          if(or__3824__auto____6863) {
            return or__3824__auto____6863
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6864 = this$;
      if(and__3822__auto____6864) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6864
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2418__auto____6865 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6866 = cljs.core._invoke[goog.typeOf(x__2418__auto____6865)];
        if(or__3824__auto____6866) {
          return or__3824__auto____6866
        }else {
          var or__3824__auto____6867 = cljs.core._invoke["_"];
          if(or__3824__auto____6867) {
            return or__3824__auto____6867
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6868 = this$;
      if(and__3822__auto____6868) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6868
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2418__auto____6869 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6870 = cljs.core._invoke[goog.typeOf(x__2418__auto____6869)];
        if(or__3824__auto____6870) {
          return or__3824__auto____6870
        }else {
          var or__3824__auto____6871 = cljs.core._invoke["_"];
          if(or__3824__auto____6871) {
            return or__3824__auto____6871
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6872 = this$;
      if(and__3822__auto____6872) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6872
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2418__auto____6873 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6874 = cljs.core._invoke[goog.typeOf(x__2418__auto____6873)];
        if(or__3824__auto____6874) {
          return or__3824__auto____6874
        }else {
          var or__3824__auto____6875 = cljs.core._invoke["_"];
          if(or__3824__auto____6875) {
            return or__3824__auto____6875
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6876 = this$;
      if(and__3822__auto____6876) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6876
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2418__auto____6877 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6878 = cljs.core._invoke[goog.typeOf(x__2418__auto____6877)];
        if(or__3824__auto____6878) {
          return or__3824__auto____6878
        }else {
          var or__3824__auto____6879 = cljs.core._invoke["_"];
          if(or__3824__auto____6879) {
            return or__3824__auto____6879
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6880 = this$;
      if(and__3822__auto____6880) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6880
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2418__auto____6881 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6882 = cljs.core._invoke[goog.typeOf(x__2418__auto____6881)];
        if(or__3824__auto____6882) {
          return or__3824__auto____6882
        }else {
          var or__3824__auto____6883 = cljs.core._invoke["_"];
          if(or__3824__auto____6883) {
            return or__3824__auto____6883
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6884 = this$;
      if(and__3822__auto____6884) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6884
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2418__auto____6885 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6886 = cljs.core._invoke[goog.typeOf(x__2418__auto____6885)];
        if(or__3824__auto____6886) {
          return or__3824__auto____6886
        }else {
          var or__3824__auto____6887 = cljs.core._invoke["_"];
          if(or__3824__auto____6887) {
            return or__3824__auto____6887
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6888 = this$;
      if(and__3822__auto____6888) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6888
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2418__auto____6889 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6890 = cljs.core._invoke[goog.typeOf(x__2418__auto____6889)];
        if(or__3824__auto____6890) {
          return or__3824__auto____6890
        }else {
          var or__3824__auto____6891 = cljs.core._invoke["_"];
          if(or__3824__auto____6891) {
            return or__3824__auto____6891
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6892 = this$;
      if(and__3822__auto____6892) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6892
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2418__auto____6893 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6894 = cljs.core._invoke[goog.typeOf(x__2418__auto____6893)];
        if(or__3824__auto____6894) {
          return or__3824__auto____6894
        }else {
          var or__3824__auto____6895 = cljs.core._invoke["_"];
          if(or__3824__auto____6895) {
            return or__3824__auto____6895
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6896 = this$;
      if(and__3822__auto____6896) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6896
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2418__auto____6897 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6898 = cljs.core._invoke[goog.typeOf(x__2418__auto____6897)];
        if(or__3824__auto____6898) {
          return or__3824__auto____6898
        }else {
          var or__3824__auto____6899 = cljs.core._invoke["_"];
          if(or__3824__auto____6899) {
            return or__3824__auto____6899
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6900 = this$;
      if(and__3822__auto____6900) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6900
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2418__auto____6901 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6902 = cljs.core._invoke[goog.typeOf(x__2418__auto____6901)];
        if(or__3824__auto____6902) {
          return or__3824__auto____6902
        }else {
          var or__3824__auto____6903 = cljs.core._invoke["_"];
          if(or__3824__auto____6903) {
            return or__3824__auto____6903
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6904 = this$;
      if(and__3822__auto____6904) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6904
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2418__auto____6905 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6906 = cljs.core._invoke[goog.typeOf(x__2418__auto____6905)];
        if(or__3824__auto____6906) {
          return or__3824__auto____6906
        }else {
          var or__3824__auto____6907 = cljs.core._invoke["_"];
          if(or__3824__auto____6907) {
            return or__3824__auto____6907
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6908 = this$;
      if(and__3822__auto____6908) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6908
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2418__auto____6909 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6910 = cljs.core._invoke[goog.typeOf(x__2418__auto____6909)];
        if(or__3824__auto____6910) {
          return or__3824__auto____6910
        }else {
          var or__3824__auto____6911 = cljs.core._invoke["_"];
          if(or__3824__auto____6911) {
            return or__3824__auto____6911
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6912 = this$;
      if(and__3822__auto____6912) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6912
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2418__auto____6913 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6914 = cljs.core._invoke[goog.typeOf(x__2418__auto____6913)];
        if(or__3824__auto____6914) {
          return or__3824__auto____6914
        }else {
          var or__3824__auto____6915 = cljs.core._invoke["_"];
          if(or__3824__auto____6915) {
            return or__3824__auto____6915
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6916 = this$;
      if(and__3822__auto____6916) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6916
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2418__auto____6917 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6918 = cljs.core._invoke[goog.typeOf(x__2418__auto____6917)];
        if(or__3824__auto____6918) {
          return or__3824__auto____6918
        }else {
          var or__3824__auto____6919 = cljs.core._invoke["_"];
          if(or__3824__auto____6919) {
            return or__3824__auto____6919
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6920 = this$;
      if(and__3822__auto____6920) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6920
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2418__auto____6921 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6922 = cljs.core._invoke[goog.typeOf(x__2418__auto____6921)];
        if(or__3824__auto____6922) {
          return or__3824__auto____6922
        }else {
          var or__3824__auto____6923 = cljs.core._invoke["_"];
          if(or__3824__auto____6923) {
            return or__3824__auto____6923
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6924 = this$;
      if(and__3822__auto____6924) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6924
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2418__auto____6925 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6926 = cljs.core._invoke[goog.typeOf(x__2418__auto____6925)];
        if(or__3824__auto____6926) {
          return or__3824__auto____6926
        }else {
          var or__3824__auto____6927 = cljs.core._invoke["_"];
          if(or__3824__auto____6927) {
            return or__3824__auto____6927
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6928 = this$;
      if(and__3822__auto____6928) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6928
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2418__auto____6929 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6930 = cljs.core._invoke[goog.typeOf(x__2418__auto____6929)];
        if(or__3824__auto____6930) {
          return or__3824__auto____6930
        }else {
          var or__3824__auto____6931 = cljs.core._invoke["_"];
          if(or__3824__auto____6931) {
            return or__3824__auto____6931
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6932 = this$;
      if(and__3822__auto____6932) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6932
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2418__auto____6933 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6934 = cljs.core._invoke[goog.typeOf(x__2418__auto____6933)];
        if(or__3824__auto____6934) {
          return or__3824__auto____6934
        }else {
          var or__3824__auto____6935 = cljs.core._invoke["_"];
          if(or__3824__auto____6935) {
            return or__3824__auto____6935
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6936 = this$;
      if(and__3822__auto____6936) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6936
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2418__auto____6937 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6938 = cljs.core._invoke[goog.typeOf(x__2418__auto____6937)];
        if(or__3824__auto____6938) {
          return or__3824__auto____6938
        }else {
          var or__3824__auto____6939 = cljs.core._invoke["_"];
          if(or__3824__auto____6939) {
            return or__3824__auto____6939
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6940 = this$;
      if(and__3822__auto____6940) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6940
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2418__auto____6941 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6942 = cljs.core._invoke[goog.typeOf(x__2418__auto____6941)];
        if(or__3824__auto____6942) {
          return or__3824__auto____6942
        }else {
          var or__3824__auto____6943 = cljs.core._invoke["_"];
          if(or__3824__auto____6943) {
            return or__3824__auto____6943
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6948 = coll;
    if(and__3822__auto____6948) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6948
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2418__auto____6949 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6950 = cljs.core._count[goog.typeOf(x__2418__auto____6949)];
      if(or__3824__auto____6950) {
        return or__3824__auto____6950
      }else {
        var or__3824__auto____6951 = cljs.core._count["_"];
        if(or__3824__auto____6951) {
          return or__3824__auto____6951
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6956 = coll;
    if(and__3822__auto____6956) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6956
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2418__auto____6957 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6958 = cljs.core._empty[goog.typeOf(x__2418__auto____6957)];
      if(or__3824__auto____6958) {
        return or__3824__auto____6958
      }else {
        var or__3824__auto____6959 = cljs.core._empty["_"];
        if(or__3824__auto____6959) {
          return or__3824__auto____6959
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6964 = coll;
    if(and__3822__auto____6964) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6964
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2418__auto____6965 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6966 = cljs.core._conj[goog.typeOf(x__2418__auto____6965)];
      if(or__3824__auto____6966) {
        return or__3824__auto____6966
      }else {
        var or__3824__auto____6967 = cljs.core._conj["_"];
        if(or__3824__auto____6967) {
          return or__3824__auto____6967
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6976 = coll;
      if(and__3822__auto____6976) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6976
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2418__auto____6977 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6978 = cljs.core._nth[goog.typeOf(x__2418__auto____6977)];
        if(or__3824__auto____6978) {
          return or__3824__auto____6978
        }else {
          var or__3824__auto____6979 = cljs.core._nth["_"];
          if(or__3824__auto____6979) {
            return or__3824__auto____6979
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6980 = coll;
      if(and__3822__auto____6980) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6980
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2418__auto____6981 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6982 = cljs.core._nth[goog.typeOf(x__2418__auto____6981)];
        if(or__3824__auto____6982) {
          return or__3824__auto____6982
        }else {
          var or__3824__auto____6983 = cljs.core._nth["_"];
          if(or__3824__auto____6983) {
            return or__3824__auto____6983
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6988 = coll;
    if(and__3822__auto____6988) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6988
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2418__auto____6989 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6990 = cljs.core._first[goog.typeOf(x__2418__auto____6989)];
      if(or__3824__auto____6990) {
        return or__3824__auto____6990
      }else {
        var or__3824__auto____6991 = cljs.core._first["_"];
        if(or__3824__auto____6991) {
          return or__3824__auto____6991
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6996 = coll;
    if(and__3822__auto____6996) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6996
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2418__auto____6997 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6998 = cljs.core._rest[goog.typeOf(x__2418__auto____6997)];
      if(or__3824__auto____6998) {
        return or__3824__auto____6998
      }else {
        var or__3824__auto____6999 = cljs.core._rest["_"];
        if(or__3824__auto____6999) {
          return or__3824__auto____6999
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____7004 = coll;
    if(and__3822__auto____7004) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____7004
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2418__auto____7005 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7006 = cljs.core._next[goog.typeOf(x__2418__auto____7005)];
      if(or__3824__auto____7006) {
        return or__3824__auto____7006
      }else {
        var or__3824__auto____7007 = cljs.core._next["_"];
        if(or__3824__auto____7007) {
          return or__3824__auto____7007
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____7016 = o;
      if(and__3822__auto____7016) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____7016
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2418__auto____7017 = o == null ? null : o;
      return function() {
        var or__3824__auto____7018 = cljs.core._lookup[goog.typeOf(x__2418__auto____7017)];
        if(or__3824__auto____7018) {
          return or__3824__auto____7018
        }else {
          var or__3824__auto____7019 = cljs.core._lookup["_"];
          if(or__3824__auto____7019) {
            return or__3824__auto____7019
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____7020 = o;
      if(and__3822__auto____7020) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____7020
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2418__auto____7021 = o == null ? null : o;
      return function() {
        var or__3824__auto____7022 = cljs.core._lookup[goog.typeOf(x__2418__auto____7021)];
        if(or__3824__auto____7022) {
          return or__3824__auto____7022
        }else {
          var or__3824__auto____7023 = cljs.core._lookup["_"];
          if(or__3824__auto____7023) {
            return or__3824__auto____7023
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____7028 = coll;
    if(and__3822__auto____7028) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____7028
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2418__auto____7029 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7030 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2418__auto____7029)];
      if(or__3824__auto____7030) {
        return or__3824__auto____7030
      }else {
        var or__3824__auto____7031 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____7031) {
          return or__3824__auto____7031
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____7036 = coll;
    if(and__3822__auto____7036) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____7036
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2418__auto____7037 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7038 = cljs.core._assoc[goog.typeOf(x__2418__auto____7037)];
      if(or__3824__auto____7038) {
        return or__3824__auto____7038
      }else {
        var or__3824__auto____7039 = cljs.core._assoc["_"];
        if(or__3824__auto____7039) {
          return or__3824__auto____7039
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____7044 = coll;
    if(and__3822__auto____7044) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____7044
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2418__auto____7045 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7046 = cljs.core._dissoc[goog.typeOf(x__2418__auto____7045)];
      if(or__3824__auto____7046) {
        return or__3824__auto____7046
      }else {
        var or__3824__auto____7047 = cljs.core._dissoc["_"];
        if(or__3824__auto____7047) {
          return or__3824__auto____7047
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____7052 = coll;
    if(and__3822__auto____7052) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____7052
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2418__auto____7053 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7054 = cljs.core._key[goog.typeOf(x__2418__auto____7053)];
      if(or__3824__auto____7054) {
        return or__3824__auto____7054
      }else {
        var or__3824__auto____7055 = cljs.core._key["_"];
        if(or__3824__auto____7055) {
          return or__3824__auto____7055
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____7060 = coll;
    if(and__3822__auto____7060) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____7060
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2418__auto____7061 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7062 = cljs.core._val[goog.typeOf(x__2418__auto____7061)];
      if(or__3824__auto____7062) {
        return or__3824__auto____7062
      }else {
        var or__3824__auto____7063 = cljs.core._val["_"];
        if(or__3824__auto____7063) {
          return or__3824__auto____7063
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____7068 = coll;
    if(and__3822__auto____7068) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____7068
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2418__auto____7069 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7070 = cljs.core._disjoin[goog.typeOf(x__2418__auto____7069)];
      if(or__3824__auto____7070) {
        return or__3824__auto____7070
      }else {
        var or__3824__auto____7071 = cljs.core._disjoin["_"];
        if(or__3824__auto____7071) {
          return or__3824__auto____7071
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____7076 = coll;
    if(and__3822__auto____7076) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____7076
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2418__auto____7077 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7078 = cljs.core._peek[goog.typeOf(x__2418__auto____7077)];
      if(or__3824__auto____7078) {
        return or__3824__auto____7078
      }else {
        var or__3824__auto____7079 = cljs.core._peek["_"];
        if(or__3824__auto____7079) {
          return or__3824__auto____7079
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____7084 = coll;
    if(and__3822__auto____7084) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____7084
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2418__auto____7085 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7086 = cljs.core._pop[goog.typeOf(x__2418__auto____7085)];
      if(or__3824__auto____7086) {
        return or__3824__auto____7086
      }else {
        var or__3824__auto____7087 = cljs.core._pop["_"];
        if(or__3824__auto____7087) {
          return or__3824__auto____7087
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____7092 = coll;
    if(and__3822__auto____7092) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____7092
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2418__auto____7093 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7094 = cljs.core._assoc_n[goog.typeOf(x__2418__auto____7093)];
      if(or__3824__auto____7094) {
        return or__3824__auto____7094
      }else {
        var or__3824__auto____7095 = cljs.core._assoc_n["_"];
        if(or__3824__auto____7095) {
          return or__3824__auto____7095
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____7100 = o;
    if(and__3822__auto____7100) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____7100
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2418__auto____7101 = o == null ? null : o;
    return function() {
      var or__3824__auto____7102 = cljs.core._deref[goog.typeOf(x__2418__auto____7101)];
      if(or__3824__auto____7102) {
        return or__3824__auto____7102
      }else {
        var or__3824__auto____7103 = cljs.core._deref["_"];
        if(or__3824__auto____7103) {
          return or__3824__auto____7103
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____7108 = o;
    if(and__3822__auto____7108) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____7108
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2418__auto____7109 = o == null ? null : o;
    return function() {
      var or__3824__auto____7110 = cljs.core._deref_with_timeout[goog.typeOf(x__2418__auto____7109)];
      if(or__3824__auto____7110) {
        return or__3824__auto____7110
      }else {
        var or__3824__auto____7111 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____7111) {
          return or__3824__auto____7111
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____7116 = o;
    if(and__3822__auto____7116) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____7116
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2418__auto____7117 = o == null ? null : o;
    return function() {
      var or__3824__auto____7118 = cljs.core._meta[goog.typeOf(x__2418__auto____7117)];
      if(or__3824__auto____7118) {
        return or__3824__auto____7118
      }else {
        var or__3824__auto____7119 = cljs.core._meta["_"];
        if(or__3824__auto____7119) {
          return or__3824__auto____7119
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____7124 = o;
    if(and__3822__auto____7124) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____7124
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2418__auto____7125 = o == null ? null : o;
    return function() {
      var or__3824__auto____7126 = cljs.core._with_meta[goog.typeOf(x__2418__auto____7125)];
      if(or__3824__auto____7126) {
        return or__3824__auto____7126
      }else {
        var or__3824__auto____7127 = cljs.core._with_meta["_"];
        if(or__3824__auto____7127) {
          return or__3824__auto____7127
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____7136 = coll;
      if(and__3822__auto____7136) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____7136
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2418__auto____7137 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7138 = cljs.core._reduce[goog.typeOf(x__2418__auto____7137)];
        if(or__3824__auto____7138) {
          return or__3824__auto____7138
        }else {
          var or__3824__auto____7139 = cljs.core._reduce["_"];
          if(or__3824__auto____7139) {
            return or__3824__auto____7139
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____7140 = coll;
      if(and__3822__auto____7140) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____7140
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2418__auto____7141 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7142 = cljs.core._reduce[goog.typeOf(x__2418__auto____7141)];
        if(or__3824__auto____7142) {
          return or__3824__auto____7142
        }else {
          var or__3824__auto____7143 = cljs.core._reduce["_"];
          if(or__3824__auto____7143) {
            return or__3824__auto____7143
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____7148 = coll;
    if(and__3822__auto____7148) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____7148
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2418__auto____7149 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7150 = cljs.core._kv_reduce[goog.typeOf(x__2418__auto____7149)];
      if(or__3824__auto____7150) {
        return or__3824__auto____7150
      }else {
        var or__3824__auto____7151 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____7151) {
          return or__3824__auto____7151
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____7156 = o;
    if(and__3822__auto____7156) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7156
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2418__auto____7157 = o == null ? null : o;
    return function() {
      var or__3824__auto____7158 = cljs.core._equiv[goog.typeOf(x__2418__auto____7157)];
      if(or__3824__auto____7158) {
        return or__3824__auto____7158
      }else {
        var or__3824__auto____7159 = cljs.core._equiv["_"];
        if(or__3824__auto____7159) {
          return or__3824__auto____7159
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____7164 = o;
    if(and__3822__auto____7164) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7164
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2418__auto____7165 = o == null ? null : o;
    return function() {
      var or__3824__auto____7166 = cljs.core._hash[goog.typeOf(x__2418__auto____7165)];
      if(or__3824__auto____7166) {
        return or__3824__auto____7166
      }else {
        var or__3824__auto____7167 = cljs.core._hash["_"];
        if(or__3824__auto____7167) {
          return or__3824__auto____7167
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____7172 = o;
    if(and__3822__auto____7172) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7172
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2418__auto____7173 = o == null ? null : o;
    return function() {
      var or__3824__auto____7174 = cljs.core._seq[goog.typeOf(x__2418__auto____7173)];
      if(or__3824__auto____7174) {
        return or__3824__auto____7174
      }else {
        var or__3824__auto____7175 = cljs.core._seq["_"];
        if(or__3824__auto____7175) {
          return or__3824__auto____7175
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____7180 = coll;
    if(and__3822__auto____7180) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7180
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2418__auto____7181 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7182 = cljs.core._rseq[goog.typeOf(x__2418__auto____7181)];
      if(or__3824__auto____7182) {
        return or__3824__auto____7182
      }else {
        var or__3824__auto____7183 = cljs.core._rseq["_"];
        if(or__3824__auto____7183) {
          return or__3824__auto____7183
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7188 = coll;
    if(and__3822__auto____7188) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7188
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2418__auto____7189 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7190 = cljs.core._sorted_seq[goog.typeOf(x__2418__auto____7189)];
      if(or__3824__auto____7190) {
        return or__3824__auto____7190
      }else {
        var or__3824__auto____7191 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7191) {
          return or__3824__auto____7191
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7196 = coll;
    if(and__3822__auto____7196) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7196
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2418__auto____7197 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7198 = cljs.core._sorted_seq_from[goog.typeOf(x__2418__auto____7197)];
      if(or__3824__auto____7198) {
        return or__3824__auto____7198
      }else {
        var or__3824__auto____7199 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7199) {
          return or__3824__auto____7199
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7204 = coll;
    if(and__3822__auto____7204) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7204
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2418__auto____7205 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7206 = cljs.core._entry_key[goog.typeOf(x__2418__auto____7205)];
      if(or__3824__auto____7206) {
        return or__3824__auto____7206
      }else {
        var or__3824__auto____7207 = cljs.core._entry_key["_"];
        if(or__3824__auto____7207) {
          return or__3824__auto____7207
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7212 = coll;
    if(and__3822__auto____7212) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7212
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2418__auto____7213 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7214 = cljs.core._comparator[goog.typeOf(x__2418__auto____7213)];
      if(or__3824__auto____7214) {
        return or__3824__auto____7214
      }else {
        var or__3824__auto____7215 = cljs.core._comparator["_"];
        if(or__3824__auto____7215) {
          return or__3824__auto____7215
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____7220 = o;
    if(and__3822__auto____7220) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7220
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2418__auto____7221 = o == null ? null : o;
    return function() {
      var or__3824__auto____7222 = cljs.core._pr_seq[goog.typeOf(x__2418__auto____7221)];
      if(or__3824__auto____7222) {
        return or__3824__auto____7222
      }else {
        var or__3824__auto____7223 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7223) {
          return or__3824__auto____7223
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____7228 = d;
    if(and__3822__auto____7228) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7228
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2418__auto____7229 = d == null ? null : d;
    return function() {
      var or__3824__auto____7230 = cljs.core._realized_QMARK_[goog.typeOf(x__2418__auto____7229)];
      if(or__3824__auto____7230) {
        return or__3824__auto____7230
      }else {
        var or__3824__auto____7231 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7231) {
          return or__3824__auto____7231
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____7236 = this$;
    if(and__3822__auto____7236) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7236
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2418__auto____7237 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7238 = cljs.core._notify_watches[goog.typeOf(x__2418__auto____7237)];
      if(or__3824__auto____7238) {
        return or__3824__auto____7238
      }else {
        var or__3824__auto____7239 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7239) {
          return or__3824__auto____7239
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7244 = this$;
    if(and__3822__auto____7244) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7244
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2418__auto____7245 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7246 = cljs.core._add_watch[goog.typeOf(x__2418__auto____7245)];
      if(or__3824__auto____7246) {
        return or__3824__auto____7246
      }else {
        var or__3824__auto____7247 = cljs.core._add_watch["_"];
        if(or__3824__auto____7247) {
          return or__3824__auto____7247
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7252 = this$;
    if(and__3822__auto____7252) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7252
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2418__auto____7253 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7254 = cljs.core._remove_watch[goog.typeOf(x__2418__auto____7253)];
      if(or__3824__auto____7254) {
        return or__3824__auto____7254
      }else {
        var or__3824__auto____7255 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7255) {
          return or__3824__auto____7255
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____7260 = coll;
    if(and__3822__auto____7260) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7260
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2418__auto____7261 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7262 = cljs.core._as_transient[goog.typeOf(x__2418__auto____7261)];
      if(or__3824__auto____7262) {
        return or__3824__auto____7262
      }else {
        var or__3824__auto____7263 = cljs.core._as_transient["_"];
        if(or__3824__auto____7263) {
          return or__3824__auto____7263
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____7268 = tcoll;
    if(and__3822__auto____7268) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7268
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2418__auto____7269 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7270 = cljs.core._conj_BANG_[goog.typeOf(x__2418__auto____7269)];
      if(or__3824__auto____7270) {
        return or__3824__auto____7270
      }else {
        var or__3824__auto____7271 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7271) {
          return or__3824__auto____7271
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7276 = tcoll;
    if(and__3822__auto____7276) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7276
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____7277 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7278 = cljs.core._persistent_BANG_[goog.typeOf(x__2418__auto____7277)];
      if(or__3824__auto____7278) {
        return or__3824__auto____7278
      }else {
        var or__3824__auto____7279 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7279) {
          return or__3824__auto____7279
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____7284 = tcoll;
    if(and__3822__auto____7284) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7284
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2418__auto____7285 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7286 = cljs.core._assoc_BANG_[goog.typeOf(x__2418__auto____7285)];
      if(or__3824__auto____7286) {
        return or__3824__auto____7286
      }else {
        var or__3824__auto____7287 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7287) {
          return or__3824__auto____7287
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____7292 = tcoll;
    if(and__3822__auto____7292) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7292
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2418__auto____7293 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7294 = cljs.core._dissoc_BANG_[goog.typeOf(x__2418__auto____7293)];
      if(or__3824__auto____7294) {
        return or__3824__auto____7294
      }else {
        var or__3824__auto____7295 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7295) {
          return or__3824__auto____7295
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____7300 = tcoll;
    if(and__3822__auto____7300) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7300
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2418__auto____7301 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7302 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2418__auto____7301)];
      if(or__3824__auto____7302) {
        return or__3824__auto____7302
      }else {
        var or__3824__auto____7303 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7303) {
          return or__3824__auto____7303
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7308 = tcoll;
    if(and__3822__auto____7308) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7308
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____7309 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7310 = cljs.core._pop_BANG_[goog.typeOf(x__2418__auto____7309)];
      if(or__3824__auto____7310) {
        return or__3824__auto____7310
      }else {
        var or__3824__auto____7311 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7311) {
          return or__3824__auto____7311
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____7316 = tcoll;
    if(and__3822__auto____7316) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7316
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2418__auto____7317 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7318 = cljs.core._disjoin_BANG_[goog.typeOf(x__2418__auto____7317)];
      if(or__3824__auto____7318) {
        return or__3824__auto____7318
      }else {
        var or__3824__auto____7319 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7319) {
          return or__3824__auto____7319
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____7324 = x;
    if(and__3822__auto____7324) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7324
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2418__auto____7325 = x == null ? null : x;
    return function() {
      var or__3824__auto____7326 = cljs.core._compare[goog.typeOf(x__2418__auto____7325)];
      if(or__3824__auto____7326) {
        return or__3824__auto____7326
      }else {
        var or__3824__auto____7327 = cljs.core._compare["_"];
        if(or__3824__auto____7327) {
          return or__3824__auto____7327
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____7332 = coll;
    if(and__3822__auto____7332) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7332
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2418__auto____7333 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7334 = cljs.core._drop_first[goog.typeOf(x__2418__auto____7333)];
      if(or__3824__auto____7334) {
        return or__3824__auto____7334
      }else {
        var or__3824__auto____7335 = cljs.core._drop_first["_"];
        if(or__3824__auto____7335) {
          return or__3824__auto____7335
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____7340 = coll;
    if(and__3822__auto____7340) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7340
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2418__auto____7341 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7342 = cljs.core._chunked_first[goog.typeOf(x__2418__auto____7341)];
      if(or__3824__auto____7342) {
        return or__3824__auto____7342
      }else {
        var or__3824__auto____7343 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7343) {
          return or__3824__auto____7343
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7348 = coll;
    if(and__3822__auto____7348) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7348
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2418__auto____7349 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7350 = cljs.core._chunked_rest[goog.typeOf(x__2418__auto____7349)];
      if(or__3824__auto____7350) {
        return or__3824__auto____7350
      }else {
        var or__3824__auto____7351 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7351) {
          return or__3824__auto____7351
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____7356 = coll;
    if(and__3822__auto____7356) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7356
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2418__auto____7357 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7358 = cljs.core._chunked_next[goog.typeOf(x__2418__auto____7357)];
      if(or__3824__auto____7358) {
        return or__3824__auto____7358
      }else {
        var or__3824__auto____7359 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7359) {
          return or__3824__auto____7359
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____7361 = x === y;
    if(or__3824__auto____7361) {
      return or__3824__auto____7361
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7362__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7363 = y;
            var G__7364 = cljs.core.first.call(null, more);
            var G__7365 = cljs.core.next.call(null, more);
            x = G__7363;
            y = G__7364;
            more = G__7365;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7362 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7362__delegate.call(this, x, y, more)
    };
    G__7362.cljs$lang$maxFixedArity = 2;
    G__7362.cljs$lang$applyTo = function(arglist__7366) {
      var x = cljs.core.first(arglist__7366);
      var y = cljs.core.first(cljs.core.next(arglist__7366));
      var more = cljs.core.rest(cljs.core.next(arglist__7366));
      return G__7362__delegate(x, y, more)
    };
    G__7362.cljs$lang$arity$variadic = G__7362__delegate;
    return G__7362
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7367 = null;
  var G__7367__2 = function(o, k) {
    return null
  };
  var G__7367__3 = function(o, k, not_found) {
    return not_found
  };
  G__7367 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7367__2.call(this, o, k);
      case 3:
        return G__7367__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7367
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7368 = null;
  var G__7368__2 = function(_, f) {
    return f.call(null)
  };
  var G__7368__3 = function(_, f, start) {
    return start
  };
  G__7368 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7368__2.call(this, _, f);
      case 3:
        return G__7368__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7368
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7369 = null;
  var G__7369__2 = function(_, n) {
    return null
  };
  var G__7369__3 = function(_, n, not_found) {
    return not_found
  };
  G__7369 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7369__2.call(this, _, n);
      case 3:
        return G__7369__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7369
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____7370 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7370) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7370
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__7383 = cljs.core._count.call(null, cicoll);
    if(cnt__7383 === 0) {
      return f.call(null)
    }else {
      var val__7384 = cljs.core._nth.call(null, cicoll, 0);
      var n__7385 = 1;
      while(true) {
        if(n__7385 < cnt__7383) {
          var nval__7386 = f.call(null, val__7384, cljs.core._nth.call(null, cicoll, n__7385));
          if(cljs.core.reduced_QMARK_.call(null, nval__7386)) {
            return cljs.core.deref.call(null, nval__7386)
          }else {
            var G__7395 = nval__7386;
            var G__7396 = n__7385 + 1;
            val__7384 = G__7395;
            n__7385 = G__7396;
            continue
          }
        }else {
          return val__7384
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7387 = cljs.core._count.call(null, cicoll);
    var val__7388 = val;
    var n__7389 = 0;
    while(true) {
      if(n__7389 < cnt__7387) {
        var nval__7390 = f.call(null, val__7388, cljs.core._nth.call(null, cicoll, n__7389));
        if(cljs.core.reduced_QMARK_.call(null, nval__7390)) {
          return cljs.core.deref.call(null, nval__7390)
        }else {
          var G__7397 = nval__7390;
          var G__7398 = n__7389 + 1;
          val__7388 = G__7397;
          n__7389 = G__7398;
          continue
        }
      }else {
        return val__7388
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7391 = cljs.core._count.call(null, cicoll);
    var val__7392 = val;
    var n__7393 = idx;
    while(true) {
      if(n__7393 < cnt__7391) {
        var nval__7394 = f.call(null, val__7392, cljs.core._nth.call(null, cicoll, n__7393));
        if(cljs.core.reduced_QMARK_.call(null, nval__7394)) {
          return cljs.core.deref.call(null, nval__7394)
        }else {
          var G__7399 = nval__7394;
          var G__7400 = n__7393 + 1;
          val__7392 = G__7399;
          n__7393 = G__7400;
          continue
        }
      }else {
        return val__7392
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__7413 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7414 = arr[0];
      var n__7415 = 1;
      while(true) {
        if(n__7415 < cnt__7413) {
          var nval__7416 = f.call(null, val__7414, arr[n__7415]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7416)) {
            return cljs.core.deref.call(null, nval__7416)
          }else {
            var G__7425 = nval__7416;
            var G__7426 = n__7415 + 1;
            val__7414 = G__7425;
            n__7415 = G__7426;
            continue
          }
        }else {
          return val__7414
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7417 = arr.length;
    var val__7418 = val;
    var n__7419 = 0;
    while(true) {
      if(n__7419 < cnt__7417) {
        var nval__7420 = f.call(null, val__7418, arr[n__7419]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7420)) {
          return cljs.core.deref.call(null, nval__7420)
        }else {
          var G__7427 = nval__7420;
          var G__7428 = n__7419 + 1;
          val__7418 = G__7427;
          n__7419 = G__7428;
          continue
        }
      }else {
        return val__7418
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7421 = arr.length;
    var val__7422 = val;
    var n__7423 = idx;
    while(true) {
      if(n__7423 < cnt__7421) {
        var nval__7424 = f.call(null, val__7422, arr[n__7423]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7424)) {
          return cljs.core.deref.call(null, nval__7424)
        }else {
          var G__7429 = nval__7424;
          var G__7430 = n__7423 + 1;
          val__7422 = G__7429;
          n__7423 = G__7430;
          continue
        }
      }else {
        return val__7422
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7431 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7432 = this;
  if(this__7432.i + 1 < this__7432.a.length) {
    return new cljs.core.IndexedSeq(this__7432.a, this__7432.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7433 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7434 = this;
  var c__7435 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7435 > 0) {
    return new cljs.core.RSeq(coll, c__7435 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7436 = this;
  var this__7437 = this;
  return cljs.core.pr_str.call(null, this__7437)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7438 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7438.a)) {
    return cljs.core.ci_reduce.call(null, this__7438.a, f, this__7438.a[this__7438.i], this__7438.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7438.a[this__7438.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7439 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7439.a)) {
    return cljs.core.ci_reduce.call(null, this__7439.a, f, start, this__7439.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7440 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7441 = this;
  return this__7441.a.length - this__7441.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7442 = this;
  return this__7442.a[this__7442.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7443 = this;
  if(this__7443.i + 1 < this__7443.a.length) {
    return new cljs.core.IndexedSeq(this__7443.a, this__7443.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7444 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7445 = this;
  var i__7446 = n + this__7445.i;
  if(i__7446 < this__7445.a.length) {
    return this__7445.a[i__7446]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7447 = this;
  var i__7448 = n + this__7447.i;
  if(i__7448 < this__7447.a.length) {
    return this__7447.a[i__7448]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7449 = null;
  var G__7449__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7449__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7449 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7449__2.call(this, array, f);
      case 3:
        return G__7449__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7449
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7450 = null;
  var G__7450__2 = function(array, k) {
    return array[k]
  };
  var G__7450__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7450 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7450__2.call(this, array, k);
      case 3:
        return G__7450__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7450
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7451 = null;
  var G__7451__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7451__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7451 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7451__2.call(this, array, n);
      case 3:
        return G__7451__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7451
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7452 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7453 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7454 = this;
  var this__7455 = this;
  return cljs.core.pr_str.call(null, this__7455)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7456 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7457 = this;
  return this__7457.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7458 = this;
  return cljs.core._nth.call(null, this__7458.ci, this__7458.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7459 = this;
  if(this__7459.i > 0) {
    return new cljs.core.RSeq(this__7459.ci, this__7459.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7460 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7461 = this;
  return new cljs.core.RSeq(this__7461.ci, this__7461.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7462 = this;
  return this__7462.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7466__7467 = coll;
      if(G__7466__7467) {
        if(function() {
          var or__3824__auto____7468 = G__7466__7467.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7468) {
            return or__3824__auto____7468
          }else {
            return G__7466__7467.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7466__7467.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7466__7467)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7466__7467)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7473__7474 = coll;
      if(G__7473__7474) {
        if(function() {
          var or__3824__auto____7475 = G__7473__7474.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7475) {
            return or__3824__auto____7475
          }else {
            return G__7473__7474.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7473__7474.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7473__7474)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7473__7474)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7476 = cljs.core.seq.call(null, coll);
      if(s__7476 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7476)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7481__7482 = coll;
      if(G__7481__7482) {
        if(function() {
          var or__3824__auto____7483 = G__7481__7482.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7483) {
            return or__3824__auto____7483
          }else {
            return G__7481__7482.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7481__7482.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7481__7482)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7481__7482)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7484 = cljs.core.seq.call(null, coll);
      if(!(s__7484 == null)) {
        return cljs.core._rest.call(null, s__7484)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7488__7489 = coll;
      if(G__7488__7489) {
        if(function() {
          var or__3824__auto____7490 = G__7488__7489.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7490) {
            return or__3824__auto____7490
          }else {
            return G__7488__7489.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7488__7489.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7488__7489)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7488__7489)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__7492 = cljs.core.next.call(null, s);
    if(!(sn__7492 == null)) {
      var G__7493 = sn__7492;
      s = G__7493;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__7494__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7495 = conj.call(null, coll, x);
          var G__7496 = cljs.core.first.call(null, xs);
          var G__7497 = cljs.core.next.call(null, xs);
          coll = G__7495;
          x = G__7496;
          xs = G__7497;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7494 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7494__delegate.call(this, coll, x, xs)
    };
    G__7494.cljs$lang$maxFixedArity = 2;
    G__7494.cljs$lang$applyTo = function(arglist__7498) {
      var coll = cljs.core.first(arglist__7498);
      var x = cljs.core.first(cljs.core.next(arglist__7498));
      var xs = cljs.core.rest(cljs.core.next(arglist__7498));
      return G__7494__delegate(coll, x, xs)
    };
    G__7494.cljs$lang$arity$variadic = G__7494__delegate;
    return G__7494
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__7501 = cljs.core.seq.call(null, coll);
  var acc__7502 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7501)) {
      return acc__7502 + cljs.core._count.call(null, s__7501)
    }else {
      var G__7503 = cljs.core.next.call(null, s__7501);
      var G__7504 = acc__7502 + 1;
      s__7501 = G__7503;
      acc__7502 = G__7504;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7511__7512 = coll;
        if(G__7511__7512) {
          if(function() {
            var or__3824__auto____7513 = G__7511__7512.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7513) {
              return or__3824__auto____7513
            }else {
              return G__7511__7512.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7511__7512.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7511__7512)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7511__7512)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7514__7515 = coll;
        if(G__7514__7515) {
          if(function() {
            var or__3824__auto____7516 = G__7514__7515.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7516) {
              return or__3824__auto____7516
            }else {
              return G__7514__7515.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7514__7515.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7514__7515)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7514__7515)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__7519__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7518 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7520 = ret__7518;
          var G__7521 = cljs.core.first.call(null, kvs);
          var G__7522 = cljs.core.second.call(null, kvs);
          var G__7523 = cljs.core.nnext.call(null, kvs);
          coll = G__7520;
          k = G__7521;
          v = G__7522;
          kvs = G__7523;
          continue
        }else {
          return ret__7518
        }
        break
      }
    };
    var G__7519 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7519__delegate.call(this, coll, k, v, kvs)
    };
    G__7519.cljs$lang$maxFixedArity = 3;
    G__7519.cljs$lang$applyTo = function(arglist__7524) {
      var coll = cljs.core.first(arglist__7524);
      var k = cljs.core.first(cljs.core.next(arglist__7524));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7524)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7524)));
      return G__7519__delegate(coll, k, v, kvs)
    };
    G__7519.cljs$lang$arity$variadic = G__7519__delegate;
    return G__7519
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7527__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7526 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7528 = ret__7526;
          var G__7529 = cljs.core.first.call(null, ks);
          var G__7530 = cljs.core.next.call(null, ks);
          coll = G__7528;
          k = G__7529;
          ks = G__7530;
          continue
        }else {
          return ret__7526
        }
        break
      }
    };
    var G__7527 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7527__delegate.call(this, coll, k, ks)
    };
    G__7527.cljs$lang$maxFixedArity = 2;
    G__7527.cljs$lang$applyTo = function(arglist__7531) {
      var coll = cljs.core.first(arglist__7531);
      var k = cljs.core.first(cljs.core.next(arglist__7531));
      var ks = cljs.core.rest(cljs.core.next(arglist__7531));
      return G__7527__delegate(coll, k, ks)
    };
    G__7527.cljs$lang$arity$variadic = G__7527__delegate;
    return G__7527
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7535__7536 = o;
    if(G__7535__7536) {
      if(function() {
        var or__3824__auto____7537 = G__7535__7536.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7537) {
          return or__3824__auto____7537
        }else {
          return G__7535__7536.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7535__7536.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7535__7536)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7535__7536)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7540__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7539 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7541 = ret__7539;
          var G__7542 = cljs.core.first.call(null, ks);
          var G__7543 = cljs.core.next.call(null, ks);
          coll = G__7541;
          k = G__7542;
          ks = G__7543;
          continue
        }else {
          return ret__7539
        }
        break
      }
    };
    var G__7540 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7540__delegate.call(this, coll, k, ks)
    };
    G__7540.cljs$lang$maxFixedArity = 2;
    G__7540.cljs$lang$applyTo = function(arglist__7544) {
      var coll = cljs.core.first(arglist__7544);
      var k = cljs.core.first(cljs.core.next(arglist__7544));
      var ks = cljs.core.rest(cljs.core.next(arglist__7544));
      return G__7540__delegate(coll, k, ks)
    };
    G__7540.cljs$lang$arity$variadic = G__7540__delegate;
    return G__7540
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7546 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7546;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7546
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7548 = cljs.core.string_hash_cache[k];
  if(!(h__7548 == null)) {
    return h__7548
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7550 = goog.isString(o);
      if(and__3822__auto____7550) {
        return check_cache
      }else {
        return and__3822__auto____7550
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7554__7555 = x;
    if(G__7554__7555) {
      if(function() {
        var or__3824__auto____7556 = G__7554__7555.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7556) {
          return or__3824__auto____7556
        }else {
          return G__7554__7555.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7554__7555.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7554__7555)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7554__7555)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7560__7561 = x;
    if(G__7560__7561) {
      if(function() {
        var or__3824__auto____7562 = G__7560__7561.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7562) {
          return or__3824__auto____7562
        }else {
          return G__7560__7561.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7560__7561.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7560__7561)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7560__7561)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7566__7567 = x;
  if(G__7566__7567) {
    if(function() {
      var or__3824__auto____7568 = G__7566__7567.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7568) {
        return or__3824__auto____7568
      }else {
        return G__7566__7567.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7566__7567.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7566__7567)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7566__7567)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7572__7573 = x;
  if(G__7572__7573) {
    if(function() {
      var or__3824__auto____7574 = G__7572__7573.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7574) {
        return or__3824__auto____7574
      }else {
        return G__7572__7573.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7572__7573.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7572__7573)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7572__7573)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7578__7579 = x;
  if(G__7578__7579) {
    if(function() {
      var or__3824__auto____7580 = G__7578__7579.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7580) {
        return or__3824__auto____7580
      }else {
        return G__7578__7579.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7578__7579.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7578__7579)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7578__7579)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7584__7585 = x;
  if(G__7584__7585) {
    if(function() {
      var or__3824__auto____7586 = G__7584__7585.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7586) {
        return or__3824__auto____7586
      }else {
        return G__7584__7585.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7584__7585.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7584__7585)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7584__7585)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7590__7591 = x;
  if(G__7590__7591) {
    if(function() {
      var or__3824__auto____7592 = G__7590__7591.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7592) {
        return or__3824__auto____7592
      }else {
        return G__7590__7591.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7590__7591.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7590__7591)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7590__7591)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7596__7597 = x;
    if(G__7596__7597) {
      if(function() {
        var or__3824__auto____7598 = G__7596__7597.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7598) {
          return or__3824__auto____7598
        }else {
          return G__7596__7597.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7596__7597.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7596__7597)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7596__7597)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7602__7603 = x;
  if(G__7602__7603) {
    if(function() {
      var or__3824__auto____7604 = G__7602__7603.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7604) {
        return or__3824__auto____7604
      }else {
        return G__7602__7603.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7602__7603.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7602__7603)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7602__7603)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7608__7609 = x;
  if(G__7608__7609) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7610 = null;
      if(cljs.core.truth_(or__3824__auto____7610)) {
        return or__3824__auto____7610
      }else {
        return G__7608__7609.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7608__7609.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7608__7609)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7608__7609)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7611__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7611 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7611__delegate.call(this, keyvals)
    };
    G__7611.cljs$lang$maxFixedArity = 0;
    G__7611.cljs$lang$applyTo = function(arglist__7612) {
      var keyvals = cljs.core.seq(arglist__7612);
      return G__7611__delegate(keyvals)
    };
    G__7611.cljs$lang$arity$variadic = G__7611__delegate;
    return G__7611
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7614 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7614.push(key)
  });
  return keys__7614
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7618 = i;
  var j__7619 = j;
  var len__7620 = len;
  while(true) {
    if(len__7620 === 0) {
      return to
    }else {
      to[j__7619] = from[i__7618];
      var G__7621 = i__7618 + 1;
      var G__7622 = j__7619 + 1;
      var G__7623 = len__7620 - 1;
      i__7618 = G__7621;
      j__7619 = G__7622;
      len__7620 = G__7623;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7627 = i + (len - 1);
  var j__7628 = j + (len - 1);
  var len__7629 = len;
  while(true) {
    if(len__7629 === 0) {
      return to
    }else {
      to[j__7628] = from[i__7627];
      var G__7630 = i__7627 - 1;
      var G__7631 = j__7628 - 1;
      var G__7632 = len__7629 - 1;
      i__7627 = G__7630;
      j__7628 = G__7631;
      len__7629 = G__7632;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7636__7637 = s;
    if(G__7636__7637) {
      if(function() {
        var or__3824__auto____7638 = G__7636__7637.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7638) {
          return or__3824__auto____7638
        }else {
          return G__7636__7637.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7636__7637.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7636__7637)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7636__7637)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7642__7643 = s;
  if(G__7642__7643) {
    if(function() {
      var or__3824__auto____7644 = G__7642__7643.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7644) {
        return or__3824__auto____7644
      }else {
        return G__7642__7643.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7642__7643.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7642__7643)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7642__7643)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7647 = goog.isString(x);
  if(and__3822__auto____7647) {
    return!function() {
      var or__3824__auto____7648 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7648) {
        return or__3824__auto____7648
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7647
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7650 = goog.isString(x);
  if(and__3822__auto____7650) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7650
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7652 = goog.isString(x);
  if(and__3822__auto____7652) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7652
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7657 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7657) {
    return or__3824__auto____7657
  }else {
    var G__7658__7659 = f;
    if(G__7658__7659) {
      if(function() {
        var or__3824__auto____7660 = G__7658__7659.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7660) {
          return or__3824__auto____7660
        }else {
          return G__7658__7659.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7658__7659.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7658__7659)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7658__7659)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7662 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7662) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7662
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7665 = coll;
    if(cljs.core.truth_(and__3822__auto____7665)) {
      var and__3822__auto____7666 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7666) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7666
      }
    }else {
      return and__3822__auto____7665
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7675__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7671 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7672 = more;
        while(true) {
          var x__7673 = cljs.core.first.call(null, xs__7672);
          var etc__7674 = cljs.core.next.call(null, xs__7672);
          if(cljs.core.truth_(xs__7672)) {
            if(cljs.core.contains_QMARK_.call(null, s__7671, x__7673)) {
              return false
            }else {
              var G__7676 = cljs.core.conj.call(null, s__7671, x__7673);
              var G__7677 = etc__7674;
              s__7671 = G__7676;
              xs__7672 = G__7677;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7675 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7675__delegate.call(this, x, y, more)
    };
    G__7675.cljs$lang$maxFixedArity = 2;
    G__7675.cljs$lang$applyTo = function(arglist__7678) {
      var x = cljs.core.first(arglist__7678);
      var y = cljs.core.first(cljs.core.next(arglist__7678));
      var more = cljs.core.rest(cljs.core.next(arglist__7678));
      return G__7675__delegate(x, y, more)
    };
    G__7675.cljs$lang$arity$variadic = G__7675__delegate;
    return G__7675
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7682__7683 = x;
            if(G__7682__7683) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7684 = null;
                if(cljs.core.truth_(or__3824__auto____7684)) {
                  return or__3824__auto____7684
                }else {
                  return G__7682__7683.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7682__7683.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7682__7683)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7682__7683)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7689 = cljs.core.count.call(null, xs);
    var yl__7690 = cljs.core.count.call(null, ys);
    if(xl__7689 < yl__7690) {
      return-1
    }else {
      if(xl__7689 > yl__7690) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7689, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7691 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7692 = d__7691 === 0;
        if(and__3822__auto____7692) {
          return n + 1 < len
        }else {
          return and__3822__auto____7692
        }
      }()) {
        var G__7693 = xs;
        var G__7694 = ys;
        var G__7695 = len;
        var G__7696 = n + 1;
        xs = G__7693;
        ys = G__7694;
        len = G__7695;
        n = G__7696;
        continue
      }else {
        return d__7691
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7698 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7698)) {
        return r__7698
      }else {
        if(cljs.core.truth_(r__7698)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7700 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7700, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7700)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7706 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7706) {
      var s__7707 = temp__3971__auto____7706;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7707), cljs.core.next.call(null, s__7707))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7708 = val;
    var coll__7709 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7709) {
        var nval__7710 = f.call(null, val__7708, cljs.core.first.call(null, coll__7709));
        if(cljs.core.reduced_QMARK_.call(null, nval__7710)) {
          return cljs.core.deref.call(null, nval__7710)
        }else {
          var G__7711 = nval__7710;
          var G__7712 = cljs.core.next.call(null, coll__7709);
          val__7708 = G__7711;
          coll__7709 = G__7712;
          continue
        }
      }else {
        return val__7708
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7714 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7714);
  return cljs.core.vec.call(null, a__7714)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7721__7722 = coll;
      if(G__7721__7722) {
        if(function() {
          var or__3824__auto____7723 = G__7721__7722.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7723) {
            return or__3824__auto____7723
          }else {
            return G__7721__7722.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7721__7722.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7721__7722)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7721__7722)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7724__7725 = coll;
      if(G__7724__7725) {
        if(function() {
          var or__3824__auto____7726 = G__7724__7725.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7726) {
            return or__3824__auto____7726
          }else {
            return G__7724__7725.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7724__7725.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7724__7725)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7724__7725)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7727 = this;
  return this__7727.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7728__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7728 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7728__delegate.call(this, x, y, more)
    };
    G__7728.cljs$lang$maxFixedArity = 2;
    G__7728.cljs$lang$applyTo = function(arglist__7729) {
      var x = cljs.core.first(arglist__7729);
      var y = cljs.core.first(cljs.core.next(arglist__7729));
      var more = cljs.core.rest(cljs.core.next(arglist__7729));
      return G__7728__delegate(x, y, more)
    };
    G__7728.cljs$lang$arity$variadic = G__7728__delegate;
    return G__7728
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7730__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7730 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7730__delegate.call(this, x, y, more)
    };
    G__7730.cljs$lang$maxFixedArity = 2;
    G__7730.cljs$lang$applyTo = function(arglist__7731) {
      var x = cljs.core.first(arglist__7731);
      var y = cljs.core.first(cljs.core.next(arglist__7731));
      var more = cljs.core.rest(cljs.core.next(arglist__7731));
      return G__7730__delegate(x, y, more)
    };
    G__7730.cljs$lang$arity$variadic = G__7730__delegate;
    return G__7730
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7732__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7732 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7732__delegate.call(this, x, y, more)
    };
    G__7732.cljs$lang$maxFixedArity = 2;
    G__7732.cljs$lang$applyTo = function(arglist__7733) {
      var x = cljs.core.first(arglist__7733);
      var y = cljs.core.first(cljs.core.next(arglist__7733));
      var more = cljs.core.rest(cljs.core.next(arglist__7733));
      return G__7732__delegate(x, y, more)
    };
    G__7732.cljs$lang$arity$variadic = G__7732__delegate;
    return G__7732
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7734__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7734 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7734__delegate.call(this, x, y, more)
    };
    G__7734.cljs$lang$maxFixedArity = 2;
    G__7734.cljs$lang$applyTo = function(arglist__7735) {
      var x = cljs.core.first(arglist__7735);
      var y = cljs.core.first(cljs.core.next(arglist__7735));
      var more = cljs.core.rest(cljs.core.next(arglist__7735));
      return G__7734__delegate(x, y, more)
    };
    G__7734.cljs$lang$arity$variadic = G__7734__delegate;
    return G__7734
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7736__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7737 = y;
            var G__7738 = cljs.core.first.call(null, more);
            var G__7739 = cljs.core.next.call(null, more);
            x = G__7737;
            y = G__7738;
            more = G__7739;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7736 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7736__delegate.call(this, x, y, more)
    };
    G__7736.cljs$lang$maxFixedArity = 2;
    G__7736.cljs$lang$applyTo = function(arglist__7740) {
      var x = cljs.core.first(arglist__7740);
      var y = cljs.core.first(cljs.core.next(arglist__7740));
      var more = cljs.core.rest(cljs.core.next(arglist__7740));
      return G__7736__delegate(x, y, more)
    };
    G__7736.cljs$lang$arity$variadic = G__7736__delegate;
    return G__7736
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7741__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7742 = y;
            var G__7743 = cljs.core.first.call(null, more);
            var G__7744 = cljs.core.next.call(null, more);
            x = G__7742;
            y = G__7743;
            more = G__7744;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7741 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7741__delegate.call(this, x, y, more)
    };
    G__7741.cljs$lang$maxFixedArity = 2;
    G__7741.cljs$lang$applyTo = function(arglist__7745) {
      var x = cljs.core.first(arglist__7745);
      var y = cljs.core.first(cljs.core.next(arglist__7745));
      var more = cljs.core.rest(cljs.core.next(arglist__7745));
      return G__7741__delegate(x, y, more)
    };
    G__7741.cljs$lang$arity$variadic = G__7741__delegate;
    return G__7741
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7746__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7747 = y;
            var G__7748 = cljs.core.first.call(null, more);
            var G__7749 = cljs.core.next.call(null, more);
            x = G__7747;
            y = G__7748;
            more = G__7749;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7746 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7746__delegate.call(this, x, y, more)
    };
    G__7746.cljs$lang$maxFixedArity = 2;
    G__7746.cljs$lang$applyTo = function(arglist__7750) {
      var x = cljs.core.first(arglist__7750);
      var y = cljs.core.first(cljs.core.next(arglist__7750));
      var more = cljs.core.rest(cljs.core.next(arglist__7750));
      return G__7746__delegate(x, y, more)
    };
    G__7746.cljs$lang$arity$variadic = G__7746__delegate;
    return G__7746
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7751__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7752 = y;
            var G__7753 = cljs.core.first.call(null, more);
            var G__7754 = cljs.core.next.call(null, more);
            x = G__7752;
            y = G__7753;
            more = G__7754;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7751 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7751__delegate.call(this, x, y, more)
    };
    G__7751.cljs$lang$maxFixedArity = 2;
    G__7751.cljs$lang$applyTo = function(arglist__7755) {
      var x = cljs.core.first(arglist__7755);
      var y = cljs.core.first(cljs.core.next(arglist__7755));
      var more = cljs.core.rest(cljs.core.next(arglist__7755));
      return G__7751__delegate(x, y, more)
    };
    G__7751.cljs$lang$arity$variadic = G__7751__delegate;
    return G__7751
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7756__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7756 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7756__delegate.call(this, x, y, more)
    };
    G__7756.cljs$lang$maxFixedArity = 2;
    G__7756.cljs$lang$applyTo = function(arglist__7757) {
      var x = cljs.core.first(arglist__7757);
      var y = cljs.core.first(cljs.core.next(arglist__7757));
      var more = cljs.core.rest(cljs.core.next(arglist__7757));
      return G__7756__delegate(x, y, more)
    };
    G__7756.cljs$lang$arity$variadic = G__7756__delegate;
    return G__7756
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7758__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7758 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7758__delegate.call(this, x, y, more)
    };
    G__7758.cljs$lang$maxFixedArity = 2;
    G__7758.cljs$lang$applyTo = function(arglist__7759) {
      var x = cljs.core.first(arglist__7759);
      var y = cljs.core.first(cljs.core.next(arglist__7759));
      var more = cljs.core.rest(cljs.core.next(arglist__7759));
      return G__7758__delegate(x, y, more)
    };
    G__7758.cljs$lang$arity$variadic = G__7758__delegate;
    return G__7758
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7761 = n % d;
  return cljs.core.fix.call(null, (n - rem__7761) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7763 = cljs.core.quot.call(null, n, d);
  return n - d * q__7763
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7766 = v - (v >> 1 & 1431655765);
  var v__7767 = (v__7766 & 858993459) + (v__7766 >> 2 & 858993459);
  return(v__7767 + (v__7767 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7768__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7769 = y;
            var G__7770 = cljs.core.first.call(null, more);
            var G__7771 = cljs.core.next.call(null, more);
            x = G__7769;
            y = G__7770;
            more = G__7771;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7768 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7768__delegate.call(this, x, y, more)
    };
    G__7768.cljs$lang$maxFixedArity = 2;
    G__7768.cljs$lang$applyTo = function(arglist__7772) {
      var x = cljs.core.first(arglist__7772);
      var y = cljs.core.first(cljs.core.next(arglist__7772));
      var more = cljs.core.rest(cljs.core.next(arglist__7772));
      return G__7768__delegate(x, y, more)
    };
    G__7768.cljs$lang$arity$variadic = G__7768__delegate;
    return G__7768
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7776 = n;
  var xs__7777 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7778 = xs__7777;
      if(and__3822__auto____7778) {
        return n__7776 > 0
      }else {
        return and__3822__auto____7778
      }
    }())) {
      var G__7779 = n__7776 - 1;
      var G__7780 = cljs.core.next.call(null, xs__7777);
      n__7776 = G__7779;
      xs__7777 = G__7780;
      continue
    }else {
      return xs__7777
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7781__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7782 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7783 = cljs.core.next.call(null, more);
            sb = G__7782;
            more = G__7783;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7781 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7781__delegate.call(this, x, ys)
    };
    G__7781.cljs$lang$maxFixedArity = 1;
    G__7781.cljs$lang$applyTo = function(arglist__7784) {
      var x = cljs.core.first(arglist__7784);
      var ys = cljs.core.rest(arglist__7784);
      return G__7781__delegate(x, ys)
    };
    G__7781.cljs$lang$arity$variadic = G__7781__delegate;
    return G__7781
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7785__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7786 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7787 = cljs.core.next.call(null, more);
            sb = G__7786;
            more = G__7787;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7785 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7785__delegate.call(this, x, ys)
    };
    G__7785.cljs$lang$maxFixedArity = 1;
    G__7785.cljs$lang$applyTo = function(arglist__7788) {
      var x = cljs.core.first(arglist__7788);
      var ys = cljs.core.rest(arglist__7788);
      return G__7785__delegate(x, ys)
    };
    G__7785.cljs$lang$arity$variadic = G__7785__delegate;
    return G__7785
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7789) {
    var fmt = cljs.core.first(arglist__7789);
    var args = cljs.core.rest(arglist__7789);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7792 = cljs.core.seq.call(null, x);
    var ys__7793 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7792 == null) {
        return ys__7793 == null
      }else {
        if(ys__7793 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7792), cljs.core.first.call(null, ys__7793))) {
            var G__7794 = cljs.core.next.call(null, xs__7792);
            var G__7795 = cljs.core.next.call(null, ys__7793);
            xs__7792 = G__7794;
            ys__7793 = G__7795;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7796_SHARP_, p2__7797_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7796_SHARP_, cljs.core.hash.call(null, p2__7797_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7801 = 0;
  var s__7802 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7802) {
      var e__7803 = cljs.core.first.call(null, s__7802);
      var G__7804 = (h__7801 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7803)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7803)))) % 4503599627370496;
      var G__7805 = cljs.core.next.call(null, s__7802);
      h__7801 = G__7804;
      s__7802 = G__7805;
      continue
    }else {
      return h__7801
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7809 = 0;
  var s__7810 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7810) {
      var e__7811 = cljs.core.first.call(null, s__7810);
      var G__7812 = (h__7809 + cljs.core.hash.call(null, e__7811)) % 4503599627370496;
      var G__7813 = cljs.core.next.call(null, s__7810);
      h__7809 = G__7812;
      s__7810 = G__7813;
      continue
    }else {
      return h__7809
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7834__7835 = cljs.core.seq.call(null, fn_map);
  if(G__7834__7835) {
    var G__7837__7839 = cljs.core.first.call(null, G__7834__7835);
    var vec__7838__7840 = G__7837__7839;
    var key_name__7841 = cljs.core.nth.call(null, vec__7838__7840, 0, null);
    var f__7842 = cljs.core.nth.call(null, vec__7838__7840, 1, null);
    var G__7834__7843 = G__7834__7835;
    var G__7837__7844 = G__7837__7839;
    var G__7834__7845 = G__7834__7843;
    while(true) {
      var vec__7846__7847 = G__7837__7844;
      var key_name__7848 = cljs.core.nth.call(null, vec__7846__7847, 0, null);
      var f__7849 = cljs.core.nth.call(null, vec__7846__7847, 1, null);
      var G__7834__7850 = G__7834__7845;
      var str_name__7851 = cljs.core.name.call(null, key_name__7848);
      obj[str_name__7851] = f__7849;
      var temp__3974__auto____7852 = cljs.core.next.call(null, G__7834__7850);
      if(temp__3974__auto____7852) {
        var G__7834__7853 = temp__3974__auto____7852;
        var G__7854 = cljs.core.first.call(null, G__7834__7853);
        var G__7855 = G__7834__7853;
        G__7837__7844 = G__7854;
        G__7834__7845 = G__7855;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7856 = this;
  var h__2247__auto____7857 = this__7856.__hash;
  if(!(h__2247__auto____7857 == null)) {
    return h__2247__auto____7857
  }else {
    var h__2247__auto____7858 = cljs.core.hash_coll.call(null, coll);
    this__7856.__hash = h__2247__auto____7858;
    return h__2247__auto____7858
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7859 = this;
  if(this__7859.count === 1) {
    return null
  }else {
    return this__7859.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7860 = this;
  return new cljs.core.List(this__7860.meta, o, coll, this__7860.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7861 = this;
  var this__7862 = this;
  return cljs.core.pr_str.call(null, this__7862)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7863 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7864 = this;
  return this__7864.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7865 = this;
  return this__7865.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7866 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7867 = this;
  return this__7867.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7868 = this;
  if(this__7868.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7868.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7869 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7870 = this;
  return new cljs.core.List(meta, this__7870.first, this__7870.rest, this__7870.count, this__7870.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7871 = this;
  return this__7871.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7872 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7873 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7874 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7875 = this;
  return new cljs.core.List(this__7875.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7876 = this;
  var this__7877 = this;
  return cljs.core.pr_str.call(null, this__7877)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7878 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7879 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7880 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7881 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7882 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7883 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7884 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7885 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7886 = this;
  return this__7886.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7887 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7891__7892 = coll;
  if(G__7891__7892) {
    if(function() {
      var or__3824__auto____7893 = G__7891__7892.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7893) {
        return or__3824__auto____7893
      }else {
        return G__7891__7892.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7891__7892.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7891__7892)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7891__7892)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7894__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7894 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7894__delegate.call(this, x, y, z, items)
    };
    G__7894.cljs$lang$maxFixedArity = 3;
    G__7894.cljs$lang$applyTo = function(arglist__7895) {
      var x = cljs.core.first(arglist__7895);
      var y = cljs.core.first(cljs.core.next(arglist__7895));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7895)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7895)));
      return G__7894__delegate(x, y, z, items)
    };
    G__7894.cljs$lang$arity$variadic = G__7894__delegate;
    return G__7894
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7896 = this;
  var h__2247__auto____7897 = this__7896.__hash;
  if(!(h__2247__auto____7897 == null)) {
    return h__2247__auto____7897
  }else {
    var h__2247__auto____7898 = cljs.core.hash_coll.call(null, coll);
    this__7896.__hash = h__2247__auto____7898;
    return h__2247__auto____7898
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7899 = this;
  if(this__7899.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7899.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7900 = this;
  return new cljs.core.Cons(null, o, coll, this__7900.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7901 = this;
  var this__7902 = this;
  return cljs.core.pr_str.call(null, this__7902)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7903 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7904 = this;
  return this__7904.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7905 = this;
  if(this__7905.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7905.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7906 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7907 = this;
  return new cljs.core.Cons(meta, this__7907.first, this__7907.rest, this__7907.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7908 = this;
  return this__7908.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7909 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7909.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7914 = coll == null;
    if(or__3824__auto____7914) {
      return or__3824__auto____7914
    }else {
      var G__7915__7916 = coll;
      if(G__7915__7916) {
        if(function() {
          var or__3824__auto____7917 = G__7915__7916.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7917) {
            return or__3824__auto____7917
          }else {
            return G__7915__7916.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7915__7916.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7915__7916)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7915__7916)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7921__7922 = x;
  if(G__7921__7922) {
    if(function() {
      var or__3824__auto____7923 = G__7921__7922.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7923) {
        return or__3824__auto____7923
      }else {
        return G__7921__7922.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7921__7922.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7921__7922)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7921__7922)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7924 = null;
  var G__7924__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7924__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7924 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7924__2.call(this, string, f);
      case 3:
        return G__7924__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7924
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7925 = null;
  var G__7925__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7925__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7925 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7925__2.call(this, string, k);
      case 3:
        return G__7925__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7925
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7926 = null;
  var G__7926__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7926__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7926 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7926__2.call(this, string, n);
      case 3:
        return G__7926__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7926
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7938 = null;
  var G__7938__2 = function(this_sym7929, coll) {
    var this__7931 = this;
    var this_sym7929__7932 = this;
    var ___7933 = this_sym7929__7932;
    if(coll == null) {
      return null
    }else {
      var strobj__7934 = coll.strobj;
      if(strobj__7934 == null) {
        return cljs.core._lookup.call(null, coll, this__7931.k, null)
      }else {
        return strobj__7934[this__7931.k]
      }
    }
  };
  var G__7938__3 = function(this_sym7930, coll, not_found) {
    var this__7931 = this;
    var this_sym7930__7935 = this;
    var ___7936 = this_sym7930__7935;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7931.k, not_found)
    }
  };
  G__7938 = function(this_sym7930, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7938__2.call(this, this_sym7930, coll);
      case 3:
        return G__7938__3.call(this, this_sym7930, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7938
}();
cljs.core.Keyword.prototype.apply = function(this_sym7927, args7928) {
  var this__7937 = this;
  return this_sym7927.call.apply(this_sym7927, [this_sym7927].concat(args7928.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7947 = null;
  var G__7947__2 = function(this_sym7941, coll) {
    var this_sym7941__7943 = this;
    var this__7944 = this_sym7941__7943;
    return cljs.core._lookup.call(null, coll, this__7944.toString(), null)
  };
  var G__7947__3 = function(this_sym7942, coll, not_found) {
    var this_sym7942__7945 = this;
    var this__7946 = this_sym7942__7945;
    return cljs.core._lookup.call(null, coll, this__7946.toString(), not_found)
  };
  G__7947 = function(this_sym7942, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7947__2.call(this, this_sym7942, coll);
      case 3:
        return G__7947__3.call(this, this_sym7942, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7947
}();
String.prototype.apply = function(this_sym7939, args7940) {
  return this_sym7939.call.apply(this_sym7939, [this_sym7939].concat(args7940.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7949 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7949
  }else {
    lazy_seq.x = x__7949.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7950 = this;
  var h__2247__auto____7951 = this__7950.__hash;
  if(!(h__2247__auto____7951 == null)) {
    return h__2247__auto____7951
  }else {
    var h__2247__auto____7952 = cljs.core.hash_coll.call(null, coll);
    this__7950.__hash = h__2247__auto____7952;
    return h__2247__auto____7952
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7953 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7954 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7955 = this;
  var this__7956 = this;
  return cljs.core.pr_str.call(null, this__7956)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7957 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7958 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7959 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7960 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7961 = this;
  return new cljs.core.LazySeq(meta, this__7961.realized, this__7961.x, this__7961.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7962 = this;
  return this__7962.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7963 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7963.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7964 = this;
  return this__7964.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7965 = this;
  var ___7966 = this;
  this__7965.buf[this__7965.end] = o;
  return this__7965.end = this__7965.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7967 = this;
  var ___7968 = this;
  var ret__7969 = new cljs.core.ArrayChunk(this__7967.buf, 0, this__7967.end);
  this__7967.buf = null;
  return ret__7969
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7970 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7970.arr[this__7970.off], this__7970.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7971 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7971.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7972 = this;
  if(this__7972.off === this__7972.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7972.arr, this__7972.off + 1, this__7972.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7973 = this;
  return this__7973.arr[this__7973.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7974 = this;
  if(function() {
    var and__3822__auto____7975 = i >= 0;
    if(and__3822__auto____7975) {
      return i < this__7974.end - this__7974.off
    }else {
      return and__3822__auto____7975
    }
  }()) {
    return this__7974.arr[this__7974.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7976 = this;
  return this__7976.end - this__7976.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7977 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7978 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7979 = this;
  return cljs.core._nth.call(null, this__7979.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7980 = this;
  if(cljs.core._count.call(null, this__7980.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7980.chunk), this__7980.more, this__7980.meta)
  }else {
    if(this__7980.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7980.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7981 = this;
  if(this__7981.more == null) {
    return null
  }else {
    return this__7981.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7982 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7983 = this;
  return new cljs.core.ChunkedCons(this__7983.chunk, this__7983.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7984 = this;
  return this__7984.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7985 = this;
  return this__7985.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7986 = this;
  if(this__7986.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7986.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7990__7991 = s;
    if(G__7990__7991) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7992 = null;
        if(cljs.core.truth_(or__3824__auto____7992)) {
          return or__3824__auto____7992
        }else {
          return G__7990__7991.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7990__7991.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7990__7991)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7990__7991)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7995 = [];
  var s__7996 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7996)) {
      ary__7995.push(cljs.core.first.call(null, s__7996));
      var G__7997 = cljs.core.next.call(null, s__7996);
      s__7996 = G__7997;
      continue
    }else {
      return ary__7995
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__8001 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__8002 = 0;
  var xs__8003 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__8003) {
      ret__8001[i__8002] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__8003));
      var G__8004 = i__8002 + 1;
      var G__8005 = cljs.core.next.call(null, xs__8003);
      i__8002 = G__8004;
      xs__8003 = G__8005;
      continue
    }else {
    }
    break
  }
  return ret__8001
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__8013 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8014 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8015 = 0;
      var s__8016 = s__8014;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8017 = s__8016;
          if(and__3822__auto____8017) {
            return i__8015 < size
          }else {
            return and__3822__auto____8017
          }
        }())) {
          a__8013[i__8015] = cljs.core.first.call(null, s__8016);
          var G__8020 = i__8015 + 1;
          var G__8021 = cljs.core.next.call(null, s__8016);
          i__8015 = G__8020;
          s__8016 = G__8021;
          continue
        }else {
          return a__8013
        }
        break
      }
    }else {
      var n__2582__auto____8018 = size;
      var i__8019 = 0;
      while(true) {
        if(i__8019 < n__2582__auto____8018) {
          a__8013[i__8019] = init_val_or_seq;
          var G__8022 = i__8019 + 1;
          i__8019 = G__8022;
          continue
        }else {
        }
        break
      }
      return a__8013
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__8030 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8031 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8032 = 0;
      var s__8033 = s__8031;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8034 = s__8033;
          if(and__3822__auto____8034) {
            return i__8032 < size
          }else {
            return and__3822__auto____8034
          }
        }())) {
          a__8030[i__8032] = cljs.core.first.call(null, s__8033);
          var G__8037 = i__8032 + 1;
          var G__8038 = cljs.core.next.call(null, s__8033);
          i__8032 = G__8037;
          s__8033 = G__8038;
          continue
        }else {
          return a__8030
        }
        break
      }
    }else {
      var n__2582__auto____8035 = size;
      var i__8036 = 0;
      while(true) {
        if(i__8036 < n__2582__auto____8035) {
          a__8030[i__8036] = init_val_or_seq;
          var G__8039 = i__8036 + 1;
          i__8036 = G__8039;
          continue
        }else {
        }
        break
      }
      return a__8030
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__8047 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8048 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8049 = 0;
      var s__8050 = s__8048;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8051 = s__8050;
          if(and__3822__auto____8051) {
            return i__8049 < size
          }else {
            return and__3822__auto____8051
          }
        }())) {
          a__8047[i__8049] = cljs.core.first.call(null, s__8050);
          var G__8054 = i__8049 + 1;
          var G__8055 = cljs.core.next.call(null, s__8050);
          i__8049 = G__8054;
          s__8050 = G__8055;
          continue
        }else {
          return a__8047
        }
        break
      }
    }else {
      var n__2582__auto____8052 = size;
      var i__8053 = 0;
      while(true) {
        if(i__8053 < n__2582__auto____8052) {
          a__8047[i__8053] = init_val_or_seq;
          var G__8056 = i__8053 + 1;
          i__8053 = G__8056;
          continue
        }else {
        }
        break
      }
      return a__8047
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__8061 = s;
    var i__8062 = n;
    var sum__8063 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____8064 = i__8062 > 0;
        if(and__3822__auto____8064) {
          return cljs.core.seq.call(null, s__8061)
        }else {
          return and__3822__auto____8064
        }
      }())) {
        var G__8065 = cljs.core.next.call(null, s__8061);
        var G__8066 = i__8062 - 1;
        var G__8067 = sum__8063 + 1;
        s__8061 = G__8065;
        i__8062 = G__8066;
        sum__8063 = G__8067;
        continue
      }else {
        return sum__8063
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__8072 = cljs.core.seq.call(null, x);
      if(s__8072) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8072)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__8072), concat.call(null, cljs.core.chunk_rest.call(null, s__8072), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__8072), concat.call(null, cljs.core.rest.call(null, s__8072), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__8076__delegate = function(x, y, zs) {
      var cat__8075 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__8074 = cljs.core.seq.call(null, xys);
          if(xys__8074) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__8074)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__8074), cat.call(null, cljs.core.chunk_rest.call(null, xys__8074), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__8074), cat.call(null, cljs.core.rest.call(null, xys__8074), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__8075.call(null, concat.call(null, x, y), zs)
    };
    var G__8076 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8076__delegate.call(this, x, y, zs)
    };
    G__8076.cljs$lang$maxFixedArity = 2;
    G__8076.cljs$lang$applyTo = function(arglist__8077) {
      var x = cljs.core.first(arglist__8077);
      var y = cljs.core.first(cljs.core.next(arglist__8077));
      var zs = cljs.core.rest(cljs.core.next(arglist__8077));
      return G__8076__delegate(x, y, zs)
    };
    G__8076.cljs$lang$arity$variadic = G__8076__delegate;
    return G__8076
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__8078__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__8078 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8078__delegate.call(this, a, b, c, d, more)
    };
    G__8078.cljs$lang$maxFixedArity = 4;
    G__8078.cljs$lang$applyTo = function(arglist__8079) {
      var a = cljs.core.first(arglist__8079);
      var b = cljs.core.first(cljs.core.next(arglist__8079));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8079)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8079))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8079))));
      return G__8078__delegate(a, b, c, d, more)
    };
    G__8078.cljs$lang$arity$variadic = G__8078__delegate;
    return G__8078
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__8121 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__8122 = cljs.core._first.call(null, args__8121);
    var args__8123 = cljs.core._rest.call(null, args__8121);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__8122)
      }else {
        return f.call(null, a__8122)
      }
    }else {
      var b__8124 = cljs.core._first.call(null, args__8123);
      var args__8125 = cljs.core._rest.call(null, args__8123);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__8122, b__8124)
        }else {
          return f.call(null, a__8122, b__8124)
        }
      }else {
        var c__8126 = cljs.core._first.call(null, args__8125);
        var args__8127 = cljs.core._rest.call(null, args__8125);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__8122, b__8124, c__8126)
          }else {
            return f.call(null, a__8122, b__8124, c__8126)
          }
        }else {
          var d__8128 = cljs.core._first.call(null, args__8127);
          var args__8129 = cljs.core._rest.call(null, args__8127);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__8122, b__8124, c__8126, d__8128)
            }else {
              return f.call(null, a__8122, b__8124, c__8126, d__8128)
            }
          }else {
            var e__8130 = cljs.core._first.call(null, args__8129);
            var args__8131 = cljs.core._rest.call(null, args__8129);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__8122, b__8124, c__8126, d__8128, e__8130)
              }else {
                return f.call(null, a__8122, b__8124, c__8126, d__8128, e__8130)
              }
            }else {
              var f__8132 = cljs.core._first.call(null, args__8131);
              var args__8133 = cljs.core._rest.call(null, args__8131);
              if(argc === 6) {
                if(f__8132.cljs$lang$arity$6) {
                  return f__8132.cljs$lang$arity$6(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132)
                }else {
                  return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132)
                }
              }else {
                var g__8134 = cljs.core._first.call(null, args__8133);
                var args__8135 = cljs.core._rest.call(null, args__8133);
                if(argc === 7) {
                  if(f__8132.cljs$lang$arity$7) {
                    return f__8132.cljs$lang$arity$7(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134)
                  }else {
                    return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134)
                  }
                }else {
                  var h__8136 = cljs.core._first.call(null, args__8135);
                  var args__8137 = cljs.core._rest.call(null, args__8135);
                  if(argc === 8) {
                    if(f__8132.cljs$lang$arity$8) {
                      return f__8132.cljs$lang$arity$8(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136)
                    }else {
                      return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136)
                    }
                  }else {
                    var i__8138 = cljs.core._first.call(null, args__8137);
                    var args__8139 = cljs.core._rest.call(null, args__8137);
                    if(argc === 9) {
                      if(f__8132.cljs$lang$arity$9) {
                        return f__8132.cljs$lang$arity$9(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138)
                      }else {
                        return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138)
                      }
                    }else {
                      var j__8140 = cljs.core._first.call(null, args__8139);
                      var args__8141 = cljs.core._rest.call(null, args__8139);
                      if(argc === 10) {
                        if(f__8132.cljs$lang$arity$10) {
                          return f__8132.cljs$lang$arity$10(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140)
                        }else {
                          return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140)
                        }
                      }else {
                        var k__8142 = cljs.core._first.call(null, args__8141);
                        var args__8143 = cljs.core._rest.call(null, args__8141);
                        if(argc === 11) {
                          if(f__8132.cljs$lang$arity$11) {
                            return f__8132.cljs$lang$arity$11(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142)
                          }else {
                            return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142)
                          }
                        }else {
                          var l__8144 = cljs.core._first.call(null, args__8143);
                          var args__8145 = cljs.core._rest.call(null, args__8143);
                          if(argc === 12) {
                            if(f__8132.cljs$lang$arity$12) {
                              return f__8132.cljs$lang$arity$12(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144)
                            }else {
                              return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144)
                            }
                          }else {
                            var m__8146 = cljs.core._first.call(null, args__8145);
                            var args__8147 = cljs.core._rest.call(null, args__8145);
                            if(argc === 13) {
                              if(f__8132.cljs$lang$arity$13) {
                                return f__8132.cljs$lang$arity$13(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146)
                              }else {
                                return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146)
                              }
                            }else {
                              var n__8148 = cljs.core._first.call(null, args__8147);
                              var args__8149 = cljs.core._rest.call(null, args__8147);
                              if(argc === 14) {
                                if(f__8132.cljs$lang$arity$14) {
                                  return f__8132.cljs$lang$arity$14(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148)
                                }else {
                                  return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148)
                                }
                              }else {
                                var o__8150 = cljs.core._first.call(null, args__8149);
                                var args__8151 = cljs.core._rest.call(null, args__8149);
                                if(argc === 15) {
                                  if(f__8132.cljs$lang$arity$15) {
                                    return f__8132.cljs$lang$arity$15(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150)
                                  }else {
                                    return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150)
                                  }
                                }else {
                                  var p__8152 = cljs.core._first.call(null, args__8151);
                                  var args__8153 = cljs.core._rest.call(null, args__8151);
                                  if(argc === 16) {
                                    if(f__8132.cljs$lang$arity$16) {
                                      return f__8132.cljs$lang$arity$16(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152)
                                    }else {
                                      return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152)
                                    }
                                  }else {
                                    var q__8154 = cljs.core._first.call(null, args__8153);
                                    var args__8155 = cljs.core._rest.call(null, args__8153);
                                    if(argc === 17) {
                                      if(f__8132.cljs$lang$arity$17) {
                                        return f__8132.cljs$lang$arity$17(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154)
                                      }else {
                                        return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154)
                                      }
                                    }else {
                                      var r__8156 = cljs.core._first.call(null, args__8155);
                                      var args__8157 = cljs.core._rest.call(null, args__8155);
                                      if(argc === 18) {
                                        if(f__8132.cljs$lang$arity$18) {
                                          return f__8132.cljs$lang$arity$18(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154, r__8156)
                                        }else {
                                          return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154, r__8156)
                                        }
                                      }else {
                                        var s__8158 = cljs.core._first.call(null, args__8157);
                                        var args__8159 = cljs.core._rest.call(null, args__8157);
                                        if(argc === 19) {
                                          if(f__8132.cljs$lang$arity$19) {
                                            return f__8132.cljs$lang$arity$19(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154, r__8156, s__8158)
                                          }else {
                                            return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154, r__8156, s__8158)
                                          }
                                        }else {
                                          var t__8160 = cljs.core._first.call(null, args__8159);
                                          var args__8161 = cljs.core._rest.call(null, args__8159);
                                          if(argc === 20) {
                                            if(f__8132.cljs$lang$arity$20) {
                                              return f__8132.cljs$lang$arity$20(a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154, r__8156, s__8158, t__8160)
                                            }else {
                                              return f__8132.call(null, a__8122, b__8124, c__8126, d__8128, e__8130, f__8132, g__8134, h__8136, i__8138, j__8140, k__8142, l__8144, m__8146, n__8148, o__8150, p__8152, q__8154, r__8156, s__8158, t__8160)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__8176 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8177 = cljs.core.bounded_count.call(null, args, fixed_arity__8176 + 1);
      if(bc__8177 <= fixed_arity__8176) {
        return cljs.core.apply_to.call(null, f, bc__8177, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8178 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8179 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8180 = cljs.core.bounded_count.call(null, arglist__8178, fixed_arity__8179 + 1);
      if(bc__8180 <= fixed_arity__8179) {
        return cljs.core.apply_to.call(null, f, bc__8180, arglist__8178)
      }else {
        return f.cljs$lang$applyTo(arglist__8178)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8178))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8181 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8182 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8183 = cljs.core.bounded_count.call(null, arglist__8181, fixed_arity__8182 + 1);
      if(bc__8183 <= fixed_arity__8182) {
        return cljs.core.apply_to.call(null, f, bc__8183, arglist__8181)
      }else {
        return f.cljs$lang$applyTo(arglist__8181)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8181))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8184 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8185 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8186 = cljs.core.bounded_count.call(null, arglist__8184, fixed_arity__8185 + 1);
      if(bc__8186 <= fixed_arity__8185) {
        return cljs.core.apply_to.call(null, f, bc__8186, arglist__8184)
      }else {
        return f.cljs$lang$applyTo(arglist__8184)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8184))
    }
  };
  var apply__6 = function() {
    var G__8190__delegate = function(f, a, b, c, d, args) {
      var arglist__8187 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8188 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8189 = cljs.core.bounded_count.call(null, arglist__8187, fixed_arity__8188 + 1);
        if(bc__8189 <= fixed_arity__8188) {
          return cljs.core.apply_to.call(null, f, bc__8189, arglist__8187)
        }else {
          return f.cljs$lang$applyTo(arglist__8187)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8187))
      }
    };
    var G__8190 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8190__delegate.call(this, f, a, b, c, d, args)
    };
    G__8190.cljs$lang$maxFixedArity = 5;
    G__8190.cljs$lang$applyTo = function(arglist__8191) {
      var f = cljs.core.first(arglist__8191);
      var a = cljs.core.first(cljs.core.next(arglist__8191));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8191)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8191))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8191)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8191)))));
      return G__8190__delegate(f, a, b, c, d, args)
    };
    G__8190.cljs$lang$arity$variadic = G__8190__delegate;
    return G__8190
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__8192) {
    var obj = cljs.core.first(arglist__8192);
    var f = cljs.core.first(cljs.core.next(arglist__8192));
    var args = cljs.core.rest(cljs.core.next(arglist__8192));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__8193__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8193 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8193__delegate.call(this, x, y, more)
    };
    G__8193.cljs$lang$maxFixedArity = 2;
    G__8193.cljs$lang$applyTo = function(arglist__8194) {
      var x = cljs.core.first(arglist__8194);
      var y = cljs.core.first(cljs.core.next(arglist__8194));
      var more = cljs.core.rest(cljs.core.next(arglist__8194));
      return G__8193__delegate(x, y, more)
    };
    G__8193.cljs$lang$arity$variadic = G__8193__delegate;
    return G__8193
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__8195 = pred;
        var G__8196 = cljs.core.next.call(null, coll);
        pred = G__8195;
        coll = G__8196;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____8198 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8198)) {
        return or__3824__auto____8198
      }else {
        var G__8199 = pred;
        var G__8200 = cljs.core.next.call(null, coll);
        pred = G__8199;
        coll = G__8200;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__8201 = null;
    var G__8201__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8201__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8201__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8201__3 = function() {
      var G__8202__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8202 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8202__delegate.call(this, x, y, zs)
      };
      G__8202.cljs$lang$maxFixedArity = 2;
      G__8202.cljs$lang$applyTo = function(arglist__8203) {
        var x = cljs.core.first(arglist__8203);
        var y = cljs.core.first(cljs.core.next(arglist__8203));
        var zs = cljs.core.rest(cljs.core.next(arglist__8203));
        return G__8202__delegate(x, y, zs)
      };
      G__8202.cljs$lang$arity$variadic = G__8202__delegate;
      return G__8202
    }();
    G__8201 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8201__0.call(this);
        case 1:
          return G__8201__1.call(this, x);
        case 2:
          return G__8201__2.call(this, x, y);
        default:
          return G__8201__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8201.cljs$lang$maxFixedArity = 2;
    G__8201.cljs$lang$applyTo = G__8201__3.cljs$lang$applyTo;
    return G__8201
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8204__delegate = function(args) {
      return x
    };
    var G__8204 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8204__delegate.call(this, args)
    };
    G__8204.cljs$lang$maxFixedArity = 0;
    G__8204.cljs$lang$applyTo = function(arglist__8205) {
      var args = cljs.core.seq(arglist__8205);
      return G__8204__delegate(args)
    };
    G__8204.cljs$lang$arity$variadic = G__8204__delegate;
    return G__8204
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__8212 = null;
      var G__8212__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8212__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8212__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8212__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8212__4 = function() {
        var G__8213__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8213 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8213__delegate.call(this, x, y, z, args)
        };
        G__8213.cljs$lang$maxFixedArity = 3;
        G__8213.cljs$lang$applyTo = function(arglist__8214) {
          var x = cljs.core.first(arglist__8214);
          var y = cljs.core.first(cljs.core.next(arglist__8214));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8214)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8214)));
          return G__8213__delegate(x, y, z, args)
        };
        G__8213.cljs$lang$arity$variadic = G__8213__delegate;
        return G__8213
      }();
      G__8212 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8212__0.call(this);
          case 1:
            return G__8212__1.call(this, x);
          case 2:
            return G__8212__2.call(this, x, y);
          case 3:
            return G__8212__3.call(this, x, y, z);
          default:
            return G__8212__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8212.cljs$lang$maxFixedArity = 3;
      G__8212.cljs$lang$applyTo = G__8212__4.cljs$lang$applyTo;
      return G__8212
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8215 = null;
      var G__8215__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8215__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8215__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8215__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8215__4 = function() {
        var G__8216__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8216 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8216__delegate.call(this, x, y, z, args)
        };
        G__8216.cljs$lang$maxFixedArity = 3;
        G__8216.cljs$lang$applyTo = function(arglist__8217) {
          var x = cljs.core.first(arglist__8217);
          var y = cljs.core.first(cljs.core.next(arglist__8217));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8217)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8217)));
          return G__8216__delegate(x, y, z, args)
        };
        G__8216.cljs$lang$arity$variadic = G__8216__delegate;
        return G__8216
      }();
      G__8215 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8215__0.call(this);
          case 1:
            return G__8215__1.call(this, x);
          case 2:
            return G__8215__2.call(this, x, y);
          case 3:
            return G__8215__3.call(this, x, y, z);
          default:
            return G__8215__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8215.cljs$lang$maxFixedArity = 3;
      G__8215.cljs$lang$applyTo = G__8215__4.cljs$lang$applyTo;
      return G__8215
    }()
  };
  var comp__4 = function() {
    var G__8218__delegate = function(f1, f2, f3, fs) {
      var fs__8209 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8219__delegate = function(args) {
          var ret__8210 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8209), args);
          var fs__8211 = cljs.core.next.call(null, fs__8209);
          while(true) {
            if(fs__8211) {
              var G__8220 = cljs.core.first.call(null, fs__8211).call(null, ret__8210);
              var G__8221 = cljs.core.next.call(null, fs__8211);
              ret__8210 = G__8220;
              fs__8211 = G__8221;
              continue
            }else {
              return ret__8210
            }
            break
          }
        };
        var G__8219 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8219__delegate.call(this, args)
        };
        G__8219.cljs$lang$maxFixedArity = 0;
        G__8219.cljs$lang$applyTo = function(arglist__8222) {
          var args = cljs.core.seq(arglist__8222);
          return G__8219__delegate(args)
        };
        G__8219.cljs$lang$arity$variadic = G__8219__delegate;
        return G__8219
      }()
    };
    var G__8218 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8218__delegate.call(this, f1, f2, f3, fs)
    };
    G__8218.cljs$lang$maxFixedArity = 3;
    G__8218.cljs$lang$applyTo = function(arglist__8223) {
      var f1 = cljs.core.first(arglist__8223);
      var f2 = cljs.core.first(cljs.core.next(arglist__8223));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8223)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8223)));
      return G__8218__delegate(f1, f2, f3, fs)
    };
    G__8218.cljs$lang$arity$variadic = G__8218__delegate;
    return G__8218
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__8224__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8224 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8224__delegate.call(this, args)
      };
      G__8224.cljs$lang$maxFixedArity = 0;
      G__8224.cljs$lang$applyTo = function(arglist__8225) {
        var args = cljs.core.seq(arglist__8225);
        return G__8224__delegate(args)
      };
      G__8224.cljs$lang$arity$variadic = G__8224__delegate;
      return G__8224
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8226__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8226 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8226__delegate.call(this, args)
      };
      G__8226.cljs$lang$maxFixedArity = 0;
      G__8226.cljs$lang$applyTo = function(arglist__8227) {
        var args = cljs.core.seq(arglist__8227);
        return G__8226__delegate(args)
      };
      G__8226.cljs$lang$arity$variadic = G__8226__delegate;
      return G__8226
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8228__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8228 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8228__delegate.call(this, args)
      };
      G__8228.cljs$lang$maxFixedArity = 0;
      G__8228.cljs$lang$applyTo = function(arglist__8229) {
        var args = cljs.core.seq(arglist__8229);
        return G__8228__delegate(args)
      };
      G__8228.cljs$lang$arity$variadic = G__8228__delegate;
      return G__8228
    }()
  };
  var partial__5 = function() {
    var G__8230__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8231__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8231 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8231__delegate.call(this, args)
        };
        G__8231.cljs$lang$maxFixedArity = 0;
        G__8231.cljs$lang$applyTo = function(arglist__8232) {
          var args = cljs.core.seq(arglist__8232);
          return G__8231__delegate(args)
        };
        G__8231.cljs$lang$arity$variadic = G__8231__delegate;
        return G__8231
      }()
    };
    var G__8230 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8230__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8230.cljs$lang$maxFixedArity = 4;
    G__8230.cljs$lang$applyTo = function(arglist__8233) {
      var f = cljs.core.first(arglist__8233);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8233));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8233)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8233))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8233))));
      return G__8230__delegate(f, arg1, arg2, arg3, more)
    };
    G__8230.cljs$lang$arity$variadic = G__8230__delegate;
    return G__8230
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__8234 = null;
      var G__8234__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8234__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8234__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8234__4 = function() {
        var G__8235__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8235 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8235__delegate.call(this, a, b, c, ds)
        };
        G__8235.cljs$lang$maxFixedArity = 3;
        G__8235.cljs$lang$applyTo = function(arglist__8236) {
          var a = cljs.core.first(arglist__8236);
          var b = cljs.core.first(cljs.core.next(arglist__8236));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8236)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8236)));
          return G__8235__delegate(a, b, c, ds)
        };
        G__8235.cljs$lang$arity$variadic = G__8235__delegate;
        return G__8235
      }();
      G__8234 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8234__1.call(this, a);
          case 2:
            return G__8234__2.call(this, a, b);
          case 3:
            return G__8234__3.call(this, a, b, c);
          default:
            return G__8234__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8234.cljs$lang$maxFixedArity = 3;
      G__8234.cljs$lang$applyTo = G__8234__4.cljs$lang$applyTo;
      return G__8234
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8237 = null;
      var G__8237__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8237__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8237__4 = function() {
        var G__8238__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8238 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8238__delegate.call(this, a, b, c, ds)
        };
        G__8238.cljs$lang$maxFixedArity = 3;
        G__8238.cljs$lang$applyTo = function(arglist__8239) {
          var a = cljs.core.first(arglist__8239);
          var b = cljs.core.first(cljs.core.next(arglist__8239));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8239)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8239)));
          return G__8238__delegate(a, b, c, ds)
        };
        G__8238.cljs$lang$arity$variadic = G__8238__delegate;
        return G__8238
      }();
      G__8237 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8237__2.call(this, a, b);
          case 3:
            return G__8237__3.call(this, a, b, c);
          default:
            return G__8237__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8237.cljs$lang$maxFixedArity = 3;
      G__8237.cljs$lang$applyTo = G__8237__4.cljs$lang$applyTo;
      return G__8237
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8240 = null;
      var G__8240__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8240__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8240__4 = function() {
        var G__8241__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8241 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8241__delegate.call(this, a, b, c, ds)
        };
        G__8241.cljs$lang$maxFixedArity = 3;
        G__8241.cljs$lang$applyTo = function(arglist__8242) {
          var a = cljs.core.first(arglist__8242);
          var b = cljs.core.first(cljs.core.next(arglist__8242));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8242)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8242)));
          return G__8241__delegate(a, b, c, ds)
        };
        G__8241.cljs$lang$arity$variadic = G__8241__delegate;
        return G__8241
      }();
      G__8240 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8240__2.call(this, a, b);
          case 3:
            return G__8240__3.call(this, a, b, c);
          default:
            return G__8240__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8240.cljs$lang$maxFixedArity = 3;
      G__8240.cljs$lang$applyTo = G__8240__4.cljs$lang$applyTo;
      return G__8240
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__8258 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8266 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8266) {
        var s__8267 = temp__3974__auto____8266;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8267)) {
          var c__8268 = cljs.core.chunk_first.call(null, s__8267);
          var size__8269 = cljs.core.count.call(null, c__8268);
          var b__8270 = cljs.core.chunk_buffer.call(null, size__8269);
          var n__2582__auto____8271 = size__8269;
          var i__8272 = 0;
          while(true) {
            if(i__8272 < n__2582__auto____8271) {
              cljs.core.chunk_append.call(null, b__8270, f.call(null, idx + i__8272, cljs.core._nth.call(null, c__8268, i__8272)));
              var G__8273 = i__8272 + 1;
              i__8272 = G__8273;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8270), mapi.call(null, idx + size__8269, cljs.core.chunk_rest.call(null, s__8267)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8267)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8267)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8258.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8283 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8283) {
      var s__8284 = temp__3974__auto____8283;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8284)) {
        var c__8285 = cljs.core.chunk_first.call(null, s__8284);
        var size__8286 = cljs.core.count.call(null, c__8285);
        var b__8287 = cljs.core.chunk_buffer.call(null, size__8286);
        var n__2582__auto____8288 = size__8286;
        var i__8289 = 0;
        while(true) {
          if(i__8289 < n__2582__auto____8288) {
            var x__8290 = f.call(null, cljs.core._nth.call(null, c__8285, i__8289));
            if(x__8290 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8287, x__8290)
            }
            var G__8292 = i__8289 + 1;
            i__8289 = G__8292;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8287), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8284)))
      }else {
        var x__8291 = f.call(null, cljs.core.first.call(null, s__8284));
        if(x__8291 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8284))
        }else {
          return cljs.core.cons.call(null, x__8291, keep.call(null, f, cljs.core.rest.call(null, s__8284)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8318 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8328 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8328) {
        var s__8329 = temp__3974__auto____8328;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8329)) {
          var c__8330 = cljs.core.chunk_first.call(null, s__8329);
          var size__8331 = cljs.core.count.call(null, c__8330);
          var b__8332 = cljs.core.chunk_buffer.call(null, size__8331);
          var n__2582__auto____8333 = size__8331;
          var i__8334 = 0;
          while(true) {
            if(i__8334 < n__2582__auto____8333) {
              var x__8335 = f.call(null, idx + i__8334, cljs.core._nth.call(null, c__8330, i__8334));
              if(x__8335 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8332, x__8335)
              }
              var G__8337 = i__8334 + 1;
              i__8334 = G__8337;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8332), keepi.call(null, idx + size__8331, cljs.core.chunk_rest.call(null, s__8329)))
        }else {
          var x__8336 = f.call(null, idx, cljs.core.first.call(null, s__8329));
          if(x__8336 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8329))
          }else {
            return cljs.core.cons.call(null, x__8336, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8329)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8318.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8423 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8423)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8423
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8424 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8424)) {
            var and__3822__auto____8425 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8425)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8425
            }
          }else {
            return and__3822__auto____8424
          }
        }())
      };
      var ep1__4 = function() {
        var G__8494__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8426 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8426)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8426
            }
          }())
        };
        var G__8494 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8494__delegate.call(this, x, y, z, args)
        };
        G__8494.cljs$lang$maxFixedArity = 3;
        G__8494.cljs$lang$applyTo = function(arglist__8495) {
          var x = cljs.core.first(arglist__8495);
          var y = cljs.core.first(cljs.core.next(arglist__8495));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8495)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8495)));
          return G__8494__delegate(x, y, z, args)
        };
        G__8494.cljs$lang$arity$variadic = G__8494__delegate;
        return G__8494
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8438 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8438)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8438
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8439 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8439)) {
            var and__3822__auto____8440 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8440)) {
              var and__3822__auto____8441 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8441)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8441
              }
            }else {
              return and__3822__auto____8440
            }
          }else {
            return and__3822__auto____8439
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8442 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8442)) {
            var and__3822__auto____8443 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8443)) {
              var and__3822__auto____8444 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8444)) {
                var and__3822__auto____8445 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8445)) {
                  var and__3822__auto____8446 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8446)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8446
                  }
                }else {
                  return and__3822__auto____8445
                }
              }else {
                return and__3822__auto____8444
              }
            }else {
              return and__3822__auto____8443
            }
          }else {
            return and__3822__auto____8442
          }
        }())
      };
      var ep2__4 = function() {
        var G__8496__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8447 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8447)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8293_SHARP_) {
                var and__3822__auto____8448 = p1.call(null, p1__8293_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8448)) {
                  return p2.call(null, p1__8293_SHARP_)
                }else {
                  return and__3822__auto____8448
                }
              }, args)
            }else {
              return and__3822__auto____8447
            }
          }())
        };
        var G__8496 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8496__delegate.call(this, x, y, z, args)
        };
        G__8496.cljs$lang$maxFixedArity = 3;
        G__8496.cljs$lang$applyTo = function(arglist__8497) {
          var x = cljs.core.first(arglist__8497);
          var y = cljs.core.first(cljs.core.next(arglist__8497));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8497)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8497)));
          return G__8496__delegate(x, y, z, args)
        };
        G__8496.cljs$lang$arity$variadic = G__8496__delegate;
        return G__8496
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8467 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8467)) {
            var and__3822__auto____8468 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8468)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8468
            }
          }else {
            return and__3822__auto____8467
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8469 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8469)) {
            var and__3822__auto____8470 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8470)) {
              var and__3822__auto____8471 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8471)) {
                var and__3822__auto____8472 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8472)) {
                  var and__3822__auto____8473 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8473)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8473
                  }
                }else {
                  return and__3822__auto____8472
                }
              }else {
                return and__3822__auto____8471
              }
            }else {
              return and__3822__auto____8470
            }
          }else {
            return and__3822__auto____8469
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8474 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8474)) {
            var and__3822__auto____8475 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8475)) {
              var and__3822__auto____8476 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8476)) {
                var and__3822__auto____8477 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8477)) {
                  var and__3822__auto____8478 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8478)) {
                    var and__3822__auto____8479 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8479)) {
                      var and__3822__auto____8480 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8480)) {
                        var and__3822__auto____8481 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8481)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8481
                        }
                      }else {
                        return and__3822__auto____8480
                      }
                    }else {
                      return and__3822__auto____8479
                    }
                  }else {
                    return and__3822__auto____8478
                  }
                }else {
                  return and__3822__auto____8477
                }
              }else {
                return and__3822__auto____8476
              }
            }else {
              return and__3822__auto____8475
            }
          }else {
            return and__3822__auto____8474
          }
        }())
      };
      var ep3__4 = function() {
        var G__8498__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8482 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8482)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8294_SHARP_) {
                var and__3822__auto____8483 = p1.call(null, p1__8294_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8483)) {
                  var and__3822__auto____8484 = p2.call(null, p1__8294_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8484)) {
                    return p3.call(null, p1__8294_SHARP_)
                  }else {
                    return and__3822__auto____8484
                  }
                }else {
                  return and__3822__auto____8483
                }
              }, args)
            }else {
              return and__3822__auto____8482
            }
          }())
        };
        var G__8498 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8498__delegate.call(this, x, y, z, args)
        };
        G__8498.cljs$lang$maxFixedArity = 3;
        G__8498.cljs$lang$applyTo = function(arglist__8499) {
          var x = cljs.core.first(arglist__8499);
          var y = cljs.core.first(cljs.core.next(arglist__8499));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8499)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8499)));
          return G__8498__delegate(x, y, z, args)
        };
        G__8498.cljs$lang$arity$variadic = G__8498__delegate;
        return G__8498
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__8500__delegate = function(p1, p2, p3, ps) {
      var ps__8485 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8295_SHARP_) {
            return p1__8295_SHARP_.call(null, x)
          }, ps__8485)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8296_SHARP_) {
            var and__3822__auto____8490 = p1__8296_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8490)) {
              return p1__8296_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8490
            }
          }, ps__8485)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8297_SHARP_) {
            var and__3822__auto____8491 = p1__8297_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8491)) {
              var and__3822__auto____8492 = p1__8297_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8492)) {
                return p1__8297_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8492
              }
            }else {
              return and__3822__auto____8491
            }
          }, ps__8485)
        };
        var epn__4 = function() {
          var G__8501__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8493 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8493)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8298_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8298_SHARP_, args)
                }, ps__8485)
              }else {
                return and__3822__auto____8493
              }
            }())
          };
          var G__8501 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8501__delegate.call(this, x, y, z, args)
          };
          G__8501.cljs$lang$maxFixedArity = 3;
          G__8501.cljs$lang$applyTo = function(arglist__8502) {
            var x = cljs.core.first(arglist__8502);
            var y = cljs.core.first(cljs.core.next(arglist__8502));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8502)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8502)));
            return G__8501__delegate(x, y, z, args)
          };
          G__8501.cljs$lang$arity$variadic = G__8501__delegate;
          return G__8501
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__8500 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8500__delegate.call(this, p1, p2, p3, ps)
    };
    G__8500.cljs$lang$maxFixedArity = 3;
    G__8500.cljs$lang$applyTo = function(arglist__8503) {
      var p1 = cljs.core.first(arglist__8503);
      var p2 = cljs.core.first(cljs.core.next(arglist__8503));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8503)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8503)));
      return G__8500__delegate(p1, p2, p3, ps)
    };
    G__8500.cljs$lang$arity$variadic = G__8500__delegate;
    return G__8500
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8584 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8584)) {
          return or__3824__auto____8584
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8585 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8585)) {
          return or__3824__auto____8585
        }else {
          var or__3824__auto____8586 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8586)) {
            return or__3824__auto____8586
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8655__delegate = function(x, y, z, args) {
          var or__3824__auto____8587 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8587)) {
            return or__3824__auto____8587
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8655 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8655__delegate.call(this, x, y, z, args)
        };
        G__8655.cljs$lang$maxFixedArity = 3;
        G__8655.cljs$lang$applyTo = function(arglist__8656) {
          var x = cljs.core.first(arglist__8656);
          var y = cljs.core.first(cljs.core.next(arglist__8656));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8656)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8656)));
          return G__8655__delegate(x, y, z, args)
        };
        G__8655.cljs$lang$arity$variadic = G__8655__delegate;
        return G__8655
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8599 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8599)) {
          return or__3824__auto____8599
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8600 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8600)) {
          return or__3824__auto____8600
        }else {
          var or__3824__auto____8601 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8601)) {
            return or__3824__auto____8601
          }else {
            var or__3824__auto____8602 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8602)) {
              return or__3824__auto____8602
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8603 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8603)) {
          return or__3824__auto____8603
        }else {
          var or__3824__auto____8604 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8604)) {
            return or__3824__auto____8604
          }else {
            var or__3824__auto____8605 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8605)) {
              return or__3824__auto____8605
            }else {
              var or__3824__auto____8606 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8606)) {
                return or__3824__auto____8606
              }else {
                var or__3824__auto____8607 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8607)) {
                  return or__3824__auto____8607
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8657__delegate = function(x, y, z, args) {
          var or__3824__auto____8608 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8608)) {
            return or__3824__auto____8608
          }else {
            return cljs.core.some.call(null, function(p1__8338_SHARP_) {
              var or__3824__auto____8609 = p1.call(null, p1__8338_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8609)) {
                return or__3824__auto____8609
              }else {
                return p2.call(null, p1__8338_SHARP_)
              }
            }, args)
          }
        };
        var G__8657 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8657__delegate.call(this, x, y, z, args)
        };
        G__8657.cljs$lang$maxFixedArity = 3;
        G__8657.cljs$lang$applyTo = function(arglist__8658) {
          var x = cljs.core.first(arglist__8658);
          var y = cljs.core.first(cljs.core.next(arglist__8658));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8658)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8658)));
          return G__8657__delegate(x, y, z, args)
        };
        G__8657.cljs$lang$arity$variadic = G__8657__delegate;
        return G__8657
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8628 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8628)) {
          return or__3824__auto____8628
        }else {
          var or__3824__auto____8629 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8629)) {
            return or__3824__auto____8629
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8630 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8630)) {
          return or__3824__auto____8630
        }else {
          var or__3824__auto____8631 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8631)) {
            return or__3824__auto____8631
          }else {
            var or__3824__auto____8632 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8632)) {
              return or__3824__auto____8632
            }else {
              var or__3824__auto____8633 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8633)) {
                return or__3824__auto____8633
              }else {
                var or__3824__auto____8634 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8634)) {
                  return or__3824__auto____8634
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8635 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8635)) {
          return or__3824__auto____8635
        }else {
          var or__3824__auto____8636 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8636)) {
            return or__3824__auto____8636
          }else {
            var or__3824__auto____8637 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8637)) {
              return or__3824__auto____8637
            }else {
              var or__3824__auto____8638 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8638)) {
                return or__3824__auto____8638
              }else {
                var or__3824__auto____8639 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8639)) {
                  return or__3824__auto____8639
                }else {
                  var or__3824__auto____8640 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8640)) {
                    return or__3824__auto____8640
                  }else {
                    var or__3824__auto____8641 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8641)) {
                      return or__3824__auto____8641
                    }else {
                      var or__3824__auto____8642 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8642)) {
                        return or__3824__auto____8642
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8659__delegate = function(x, y, z, args) {
          var or__3824__auto____8643 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8643)) {
            return or__3824__auto____8643
          }else {
            return cljs.core.some.call(null, function(p1__8339_SHARP_) {
              var or__3824__auto____8644 = p1.call(null, p1__8339_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8644)) {
                return or__3824__auto____8644
              }else {
                var or__3824__auto____8645 = p2.call(null, p1__8339_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8645)) {
                  return or__3824__auto____8645
                }else {
                  return p3.call(null, p1__8339_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8659 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8659__delegate.call(this, x, y, z, args)
        };
        G__8659.cljs$lang$maxFixedArity = 3;
        G__8659.cljs$lang$applyTo = function(arglist__8660) {
          var x = cljs.core.first(arglist__8660);
          var y = cljs.core.first(cljs.core.next(arglist__8660));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8660)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8660)));
          return G__8659__delegate(x, y, z, args)
        };
        G__8659.cljs$lang$arity$variadic = G__8659__delegate;
        return G__8659
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8661__delegate = function(p1, p2, p3, ps) {
      var ps__8646 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8340_SHARP_) {
            return p1__8340_SHARP_.call(null, x)
          }, ps__8646)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8341_SHARP_) {
            var or__3824__auto____8651 = p1__8341_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8651)) {
              return or__3824__auto____8651
            }else {
              return p1__8341_SHARP_.call(null, y)
            }
          }, ps__8646)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8342_SHARP_) {
            var or__3824__auto____8652 = p1__8342_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8652)) {
              return or__3824__auto____8652
            }else {
              var or__3824__auto____8653 = p1__8342_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8653)) {
                return or__3824__auto____8653
              }else {
                return p1__8342_SHARP_.call(null, z)
              }
            }
          }, ps__8646)
        };
        var spn__4 = function() {
          var G__8662__delegate = function(x, y, z, args) {
            var or__3824__auto____8654 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8654)) {
              return or__3824__auto____8654
            }else {
              return cljs.core.some.call(null, function(p1__8343_SHARP_) {
                return cljs.core.some.call(null, p1__8343_SHARP_, args)
              }, ps__8646)
            }
          };
          var G__8662 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8662__delegate.call(this, x, y, z, args)
          };
          G__8662.cljs$lang$maxFixedArity = 3;
          G__8662.cljs$lang$applyTo = function(arglist__8663) {
            var x = cljs.core.first(arglist__8663);
            var y = cljs.core.first(cljs.core.next(arglist__8663));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8663)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8663)));
            return G__8662__delegate(x, y, z, args)
          };
          G__8662.cljs$lang$arity$variadic = G__8662__delegate;
          return G__8662
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8661 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8661__delegate.call(this, p1, p2, p3, ps)
    };
    G__8661.cljs$lang$maxFixedArity = 3;
    G__8661.cljs$lang$applyTo = function(arglist__8664) {
      var p1 = cljs.core.first(arglist__8664);
      var p2 = cljs.core.first(cljs.core.next(arglist__8664));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8664)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8664)));
      return G__8661__delegate(p1, p2, p3, ps)
    };
    G__8661.cljs$lang$arity$variadic = G__8661__delegate;
    return G__8661
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8683 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8683) {
        var s__8684 = temp__3974__auto____8683;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8684)) {
          var c__8685 = cljs.core.chunk_first.call(null, s__8684);
          var size__8686 = cljs.core.count.call(null, c__8685);
          var b__8687 = cljs.core.chunk_buffer.call(null, size__8686);
          var n__2582__auto____8688 = size__8686;
          var i__8689 = 0;
          while(true) {
            if(i__8689 < n__2582__auto____8688) {
              cljs.core.chunk_append.call(null, b__8687, f.call(null, cljs.core._nth.call(null, c__8685, i__8689)));
              var G__8701 = i__8689 + 1;
              i__8689 = G__8701;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8687), map.call(null, f, cljs.core.chunk_rest.call(null, s__8684)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8684)), map.call(null, f, cljs.core.rest.call(null, s__8684)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8690 = cljs.core.seq.call(null, c1);
      var s2__8691 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8692 = s1__8690;
        if(and__3822__auto____8692) {
          return s2__8691
        }else {
          return and__3822__auto____8692
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8690), cljs.core.first.call(null, s2__8691)), map.call(null, f, cljs.core.rest.call(null, s1__8690), cljs.core.rest.call(null, s2__8691)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8693 = cljs.core.seq.call(null, c1);
      var s2__8694 = cljs.core.seq.call(null, c2);
      var s3__8695 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8696 = s1__8693;
        if(and__3822__auto____8696) {
          var and__3822__auto____8697 = s2__8694;
          if(and__3822__auto____8697) {
            return s3__8695
          }else {
            return and__3822__auto____8697
          }
        }else {
          return and__3822__auto____8696
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8693), cljs.core.first.call(null, s2__8694), cljs.core.first.call(null, s3__8695)), map.call(null, f, cljs.core.rest.call(null, s1__8693), cljs.core.rest.call(null, s2__8694), cljs.core.rest.call(null, s3__8695)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8702__delegate = function(f, c1, c2, c3, colls) {
      var step__8700 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8699 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8699)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8699), step.call(null, map.call(null, cljs.core.rest, ss__8699)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8504_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8504_SHARP_)
      }, step__8700.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8702 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8702__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8702.cljs$lang$maxFixedArity = 4;
    G__8702.cljs$lang$applyTo = function(arglist__8703) {
      var f = cljs.core.first(arglist__8703);
      var c1 = cljs.core.first(cljs.core.next(arglist__8703));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8703)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8703))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8703))));
      return G__8702__delegate(f, c1, c2, c3, colls)
    };
    G__8702.cljs$lang$arity$variadic = G__8702__delegate;
    return G__8702
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8706 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8706) {
        var s__8707 = temp__3974__auto____8706;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8707), take.call(null, n - 1, cljs.core.rest.call(null, s__8707)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8713 = function(n, coll) {
    while(true) {
      var s__8711 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8712 = n > 0;
        if(and__3822__auto____8712) {
          return s__8711
        }else {
          return and__3822__auto____8712
        }
      }())) {
        var G__8714 = n - 1;
        var G__8715 = cljs.core.rest.call(null, s__8711);
        n = G__8714;
        coll = G__8715;
        continue
      }else {
        return s__8711
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8713.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8718 = cljs.core.seq.call(null, coll);
  var lead__8719 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8719) {
      var G__8720 = cljs.core.next.call(null, s__8718);
      var G__8721 = cljs.core.next.call(null, lead__8719);
      s__8718 = G__8720;
      lead__8719 = G__8721;
      continue
    }else {
      return s__8718
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8727 = function(pred, coll) {
    while(true) {
      var s__8725 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8726 = s__8725;
        if(and__3822__auto____8726) {
          return pred.call(null, cljs.core.first.call(null, s__8725))
        }else {
          return and__3822__auto____8726
        }
      }())) {
        var G__8728 = pred;
        var G__8729 = cljs.core.rest.call(null, s__8725);
        pred = G__8728;
        coll = G__8729;
        continue
      }else {
        return s__8725
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8727.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8732 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8732) {
      var s__8733 = temp__3974__auto____8732;
      return cljs.core.concat.call(null, s__8733, cycle.call(null, s__8733))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8738 = cljs.core.seq.call(null, c1);
      var s2__8739 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8740 = s1__8738;
        if(and__3822__auto____8740) {
          return s2__8739
        }else {
          return and__3822__auto____8740
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8738), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8739), interleave.call(null, cljs.core.rest.call(null, s1__8738), cljs.core.rest.call(null, s2__8739))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8742__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8741 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8741)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8741), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8741)))
        }else {
          return null
        }
      }, null)
    };
    var G__8742 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8742__delegate.call(this, c1, c2, colls)
    };
    G__8742.cljs$lang$maxFixedArity = 2;
    G__8742.cljs$lang$applyTo = function(arglist__8743) {
      var c1 = cljs.core.first(arglist__8743);
      var c2 = cljs.core.first(cljs.core.next(arglist__8743));
      var colls = cljs.core.rest(cljs.core.next(arglist__8743));
      return G__8742__delegate(c1, c2, colls)
    };
    G__8742.cljs$lang$arity$variadic = G__8742__delegate;
    return G__8742
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8753 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8751 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8751) {
        var coll__8752 = temp__3971__auto____8751;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8752), cat.call(null, cljs.core.rest.call(null, coll__8752), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8753.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8754__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8754 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8754__delegate.call(this, f, coll, colls)
    };
    G__8754.cljs$lang$maxFixedArity = 2;
    G__8754.cljs$lang$applyTo = function(arglist__8755) {
      var f = cljs.core.first(arglist__8755);
      var coll = cljs.core.first(cljs.core.next(arglist__8755));
      var colls = cljs.core.rest(cljs.core.next(arglist__8755));
      return G__8754__delegate(f, coll, colls)
    };
    G__8754.cljs$lang$arity$variadic = G__8754__delegate;
    return G__8754
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8765 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8765) {
      var s__8766 = temp__3974__auto____8765;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8766)) {
        var c__8767 = cljs.core.chunk_first.call(null, s__8766);
        var size__8768 = cljs.core.count.call(null, c__8767);
        var b__8769 = cljs.core.chunk_buffer.call(null, size__8768);
        var n__2582__auto____8770 = size__8768;
        var i__8771 = 0;
        while(true) {
          if(i__8771 < n__2582__auto____8770) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8767, i__8771)))) {
              cljs.core.chunk_append.call(null, b__8769, cljs.core._nth.call(null, c__8767, i__8771))
            }else {
            }
            var G__8774 = i__8771 + 1;
            i__8771 = G__8774;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8769), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8766)))
      }else {
        var f__8772 = cljs.core.first.call(null, s__8766);
        var r__8773 = cljs.core.rest.call(null, s__8766);
        if(cljs.core.truth_(pred.call(null, f__8772))) {
          return cljs.core.cons.call(null, f__8772, filter.call(null, pred, r__8773))
        }else {
          return filter.call(null, pred, r__8773)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8777 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8777.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8775_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8775_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8781__8782 = to;
    if(G__8781__8782) {
      if(function() {
        var or__3824__auto____8783 = G__8781__8782.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8783) {
          return or__3824__auto____8783
        }else {
          return G__8781__8782.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8781__8782.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8781__8782)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8781__8782)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8784__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8784 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8784__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8784.cljs$lang$maxFixedArity = 4;
    G__8784.cljs$lang$applyTo = function(arglist__8785) {
      var f = cljs.core.first(arglist__8785);
      var c1 = cljs.core.first(cljs.core.next(arglist__8785));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8785)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8785))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8785))));
      return G__8784__delegate(f, c1, c2, c3, colls)
    };
    G__8784.cljs$lang$arity$variadic = G__8784__delegate;
    return G__8784
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8792 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8792) {
        var s__8793 = temp__3974__auto____8792;
        var p__8794 = cljs.core.take.call(null, n, s__8793);
        if(n === cljs.core.count.call(null, p__8794)) {
          return cljs.core.cons.call(null, p__8794, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8793)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8795 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8795) {
        var s__8796 = temp__3974__auto____8795;
        var p__8797 = cljs.core.take.call(null, n, s__8796);
        if(n === cljs.core.count.call(null, p__8797)) {
          return cljs.core.cons.call(null, p__8797, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8796)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8797, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8802 = cljs.core.lookup_sentinel;
    var m__8803 = m;
    var ks__8804 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8804) {
        var m__8805 = cljs.core._lookup.call(null, m__8803, cljs.core.first.call(null, ks__8804), sentinel__8802);
        if(sentinel__8802 === m__8805) {
          return not_found
        }else {
          var G__8806 = sentinel__8802;
          var G__8807 = m__8805;
          var G__8808 = cljs.core.next.call(null, ks__8804);
          sentinel__8802 = G__8806;
          m__8803 = G__8807;
          ks__8804 = G__8808;
          continue
        }
      }else {
        return m__8803
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8809, v) {
  var vec__8814__8815 = p__8809;
  var k__8816 = cljs.core.nth.call(null, vec__8814__8815, 0, null);
  var ks__8817 = cljs.core.nthnext.call(null, vec__8814__8815, 1);
  if(cljs.core.truth_(ks__8817)) {
    return cljs.core.assoc.call(null, m, k__8816, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8816, null), ks__8817, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8816, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8818, f, args) {
    var vec__8823__8824 = p__8818;
    var k__8825 = cljs.core.nth.call(null, vec__8823__8824, 0, null);
    var ks__8826 = cljs.core.nthnext.call(null, vec__8823__8824, 1);
    if(cljs.core.truth_(ks__8826)) {
      return cljs.core.assoc.call(null, m, k__8825, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8825, null), ks__8826, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8825, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8825, null), args))
    }
  };
  var update_in = function(m, p__8818, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8818, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8827) {
    var m = cljs.core.first(arglist__8827);
    var p__8818 = cljs.core.first(cljs.core.next(arglist__8827));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8827)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8827)));
    return update_in__delegate(m, p__8818, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8830 = this;
  var h__2247__auto____8831 = this__8830.__hash;
  if(!(h__2247__auto____8831 == null)) {
    return h__2247__auto____8831
  }else {
    var h__2247__auto____8832 = cljs.core.hash_coll.call(null, coll);
    this__8830.__hash = h__2247__auto____8832;
    return h__2247__auto____8832
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8833 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8834 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8835 = this;
  var new_array__8836 = this__8835.array.slice();
  new_array__8836[k] = v;
  return new cljs.core.Vector(this__8835.meta, new_array__8836, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8867 = null;
  var G__8867__2 = function(this_sym8837, k) {
    var this__8839 = this;
    var this_sym8837__8840 = this;
    var coll__8841 = this_sym8837__8840;
    return coll__8841.cljs$core$ILookup$_lookup$arity$2(coll__8841, k)
  };
  var G__8867__3 = function(this_sym8838, k, not_found) {
    var this__8839 = this;
    var this_sym8838__8842 = this;
    var coll__8843 = this_sym8838__8842;
    return coll__8843.cljs$core$ILookup$_lookup$arity$3(coll__8843, k, not_found)
  };
  G__8867 = function(this_sym8838, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8867__2.call(this, this_sym8838, k);
      case 3:
        return G__8867__3.call(this, this_sym8838, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8867
}();
cljs.core.Vector.prototype.apply = function(this_sym8828, args8829) {
  var this__8844 = this;
  return this_sym8828.call.apply(this_sym8828, [this_sym8828].concat(args8829.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8845 = this;
  var new_array__8846 = this__8845.array.slice();
  new_array__8846.push(o);
  return new cljs.core.Vector(this__8845.meta, new_array__8846, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8847 = this;
  var this__8848 = this;
  return cljs.core.pr_str.call(null, this__8848)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8849 = this;
  return cljs.core.ci_reduce.call(null, this__8849.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8850 = this;
  return cljs.core.ci_reduce.call(null, this__8850.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8851 = this;
  if(this__8851.array.length > 0) {
    var vector_seq__8852 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8851.array.length) {
          return cljs.core.cons.call(null, this__8851.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8852.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8853 = this;
  return this__8853.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8854 = this;
  var count__8855 = this__8854.array.length;
  if(count__8855 > 0) {
    return this__8854.array[count__8855 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8856 = this;
  if(this__8856.array.length > 0) {
    var new_array__8857 = this__8856.array.slice();
    new_array__8857.pop();
    return new cljs.core.Vector(this__8856.meta, new_array__8857, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8858 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8859 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8860 = this;
  return new cljs.core.Vector(meta, this__8860.array, this__8860.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8861 = this;
  return this__8861.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8862 = this;
  if(function() {
    var and__3822__auto____8863 = 0 <= n;
    if(and__3822__auto____8863) {
      return n < this__8862.array.length
    }else {
      return and__3822__auto____8863
    }
  }()) {
    return this__8862.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8864 = this;
  if(function() {
    var and__3822__auto____8865 = 0 <= n;
    if(and__3822__auto____8865) {
      return n < this__8864.array.length
    }else {
      return and__3822__auto____8865
    }
  }()) {
    return this__8864.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8866 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8866.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2365__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8869 = pv.cnt;
  if(cnt__8869 < 32) {
    return 0
  }else {
    return cnt__8869 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8875 = level;
  var ret__8876 = node;
  while(true) {
    if(ll__8875 === 0) {
      return ret__8876
    }else {
      var embed__8877 = ret__8876;
      var r__8878 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8879 = cljs.core.pv_aset.call(null, r__8878, 0, embed__8877);
      var G__8880 = ll__8875 - 5;
      var G__8881 = r__8878;
      ll__8875 = G__8880;
      ret__8876 = G__8881;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8887 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8888 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8887, subidx__8888, tailnode);
    return ret__8887
  }else {
    var child__8889 = cljs.core.pv_aget.call(null, parent, subidx__8888);
    if(!(child__8889 == null)) {
      var node_to_insert__8890 = push_tail.call(null, pv, level - 5, child__8889, tailnode);
      cljs.core.pv_aset.call(null, ret__8887, subidx__8888, node_to_insert__8890);
      return ret__8887
    }else {
      var node_to_insert__8891 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8887, subidx__8888, node_to_insert__8891);
      return ret__8887
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8895 = 0 <= i;
    if(and__3822__auto____8895) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8895
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8896 = pv.root;
      var level__8897 = pv.shift;
      while(true) {
        if(level__8897 > 0) {
          var G__8898 = cljs.core.pv_aget.call(null, node__8896, i >>> level__8897 & 31);
          var G__8899 = level__8897 - 5;
          node__8896 = G__8898;
          level__8897 = G__8899;
          continue
        }else {
          return node__8896.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8902 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8902, i & 31, val);
    return ret__8902
  }else {
    var subidx__8903 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8902, subidx__8903, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8903), i, val));
    return ret__8902
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8909 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8910 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8909));
    if(function() {
      var and__3822__auto____8911 = new_child__8910 == null;
      if(and__3822__auto____8911) {
        return subidx__8909 === 0
      }else {
        return and__3822__auto____8911
      }
    }()) {
      return null
    }else {
      var ret__8912 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8912, subidx__8909, new_child__8910);
      return ret__8912
    }
  }else {
    if(subidx__8909 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8913 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8913, subidx__8909, null);
        return ret__8913
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8916 = this;
  return new cljs.core.TransientVector(this__8916.cnt, this__8916.shift, cljs.core.tv_editable_root.call(null, this__8916.root), cljs.core.tv_editable_tail.call(null, this__8916.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8917 = this;
  var h__2247__auto____8918 = this__8917.__hash;
  if(!(h__2247__auto____8918 == null)) {
    return h__2247__auto____8918
  }else {
    var h__2247__auto____8919 = cljs.core.hash_coll.call(null, coll);
    this__8917.__hash = h__2247__auto____8919;
    return h__2247__auto____8919
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8920 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8921 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8922 = this;
  if(function() {
    var and__3822__auto____8923 = 0 <= k;
    if(and__3822__auto____8923) {
      return k < this__8922.cnt
    }else {
      return and__3822__auto____8923
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8924 = this__8922.tail.slice();
      new_tail__8924[k & 31] = v;
      return new cljs.core.PersistentVector(this__8922.meta, this__8922.cnt, this__8922.shift, this__8922.root, new_tail__8924, null)
    }else {
      return new cljs.core.PersistentVector(this__8922.meta, this__8922.cnt, this__8922.shift, cljs.core.do_assoc.call(null, coll, this__8922.shift, this__8922.root, k, v), this__8922.tail, null)
    }
  }else {
    if(k === this__8922.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8922.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8972 = null;
  var G__8972__2 = function(this_sym8925, k) {
    var this__8927 = this;
    var this_sym8925__8928 = this;
    var coll__8929 = this_sym8925__8928;
    return coll__8929.cljs$core$ILookup$_lookup$arity$2(coll__8929, k)
  };
  var G__8972__3 = function(this_sym8926, k, not_found) {
    var this__8927 = this;
    var this_sym8926__8930 = this;
    var coll__8931 = this_sym8926__8930;
    return coll__8931.cljs$core$ILookup$_lookup$arity$3(coll__8931, k, not_found)
  };
  G__8972 = function(this_sym8926, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8972__2.call(this, this_sym8926, k);
      case 3:
        return G__8972__3.call(this, this_sym8926, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8972
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8914, args8915) {
  var this__8932 = this;
  return this_sym8914.call.apply(this_sym8914, [this_sym8914].concat(args8915.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8933 = this;
  var step_init__8934 = [0, init];
  var i__8935 = 0;
  while(true) {
    if(i__8935 < this__8933.cnt) {
      var arr__8936 = cljs.core.array_for.call(null, v, i__8935);
      var len__8937 = arr__8936.length;
      var init__8941 = function() {
        var j__8938 = 0;
        var init__8939 = step_init__8934[1];
        while(true) {
          if(j__8938 < len__8937) {
            var init__8940 = f.call(null, init__8939, j__8938 + i__8935, arr__8936[j__8938]);
            if(cljs.core.reduced_QMARK_.call(null, init__8940)) {
              return init__8940
            }else {
              var G__8973 = j__8938 + 1;
              var G__8974 = init__8940;
              j__8938 = G__8973;
              init__8939 = G__8974;
              continue
            }
          }else {
            step_init__8934[0] = len__8937;
            step_init__8934[1] = init__8939;
            return init__8939
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8941)) {
        return cljs.core.deref.call(null, init__8941)
      }else {
        var G__8975 = i__8935 + step_init__8934[0];
        i__8935 = G__8975;
        continue
      }
    }else {
      return step_init__8934[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8942 = this;
  if(this__8942.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8943 = this__8942.tail.slice();
    new_tail__8943.push(o);
    return new cljs.core.PersistentVector(this__8942.meta, this__8942.cnt + 1, this__8942.shift, this__8942.root, new_tail__8943, null)
  }else {
    var root_overflow_QMARK___8944 = this__8942.cnt >>> 5 > 1 << this__8942.shift;
    var new_shift__8945 = root_overflow_QMARK___8944 ? this__8942.shift + 5 : this__8942.shift;
    var new_root__8947 = root_overflow_QMARK___8944 ? function() {
      var n_r__8946 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8946, 0, this__8942.root);
      cljs.core.pv_aset.call(null, n_r__8946, 1, cljs.core.new_path.call(null, null, this__8942.shift, new cljs.core.VectorNode(null, this__8942.tail)));
      return n_r__8946
    }() : cljs.core.push_tail.call(null, coll, this__8942.shift, this__8942.root, new cljs.core.VectorNode(null, this__8942.tail));
    return new cljs.core.PersistentVector(this__8942.meta, this__8942.cnt + 1, new_shift__8945, new_root__8947, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8948 = this;
  if(this__8948.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8948.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8949 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8950 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8951 = this;
  var this__8952 = this;
  return cljs.core.pr_str.call(null, this__8952)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8953 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8954 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8955 = this;
  if(this__8955.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8956 = this;
  return this__8956.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8957 = this;
  if(this__8957.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8957.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8958 = this;
  if(this__8958.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8958.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8958.meta)
    }else {
      if(1 < this__8958.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8958.meta, this__8958.cnt - 1, this__8958.shift, this__8958.root, this__8958.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8959 = cljs.core.array_for.call(null, coll, this__8958.cnt - 2);
          var nr__8960 = cljs.core.pop_tail.call(null, coll, this__8958.shift, this__8958.root);
          var new_root__8961 = nr__8960 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8960;
          var cnt_1__8962 = this__8958.cnt - 1;
          if(function() {
            var and__3822__auto____8963 = 5 < this__8958.shift;
            if(and__3822__auto____8963) {
              return cljs.core.pv_aget.call(null, new_root__8961, 1) == null
            }else {
              return and__3822__auto____8963
            }
          }()) {
            return new cljs.core.PersistentVector(this__8958.meta, cnt_1__8962, this__8958.shift - 5, cljs.core.pv_aget.call(null, new_root__8961, 0), new_tail__8959, null)
          }else {
            return new cljs.core.PersistentVector(this__8958.meta, cnt_1__8962, this__8958.shift, new_root__8961, new_tail__8959, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8964 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8965 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8966 = this;
  return new cljs.core.PersistentVector(meta, this__8966.cnt, this__8966.shift, this__8966.root, this__8966.tail, this__8966.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8967 = this;
  return this__8967.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8968 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8969 = this;
  if(function() {
    var and__3822__auto____8970 = 0 <= n;
    if(and__3822__auto____8970) {
      return n < this__8969.cnt
    }else {
      return and__3822__auto____8970
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8971 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8971.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8976 = xs.length;
  var xs__8977 = no_clone === true ? xs : xs.slice();
  if(l__8976 < 32) {
    return new cljs.core.PersistentVector(null, l__8976, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8977, null)
  }else {
    var node__8978 = xs__8977.slice(0, 32);
    var v__8979 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8978, null);
    var i__8980 = 32;
    var out__8981 = cljs.core._as_transient.call(null, v__8979);
    while(true) {
      if(i__8980 < l__8976) {
        var G__8982 = i__8980 + 1;
        var G__8983 = cljs.core.conj_BANG_.call(null, out__8981, xs__8977[i__8980]);
        i__8980 = G__8982;
        out__8981 = G__8983;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8981)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8984) {
    var args = cljs.core.seq(arglist__8984);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8985 = this;
  if(this__8985.off + 1 < this__8985.node.length) {
    var s__8986 = cljs.core.chunked_seq.call(null, this__8985.vec, this__8985.node, this__8985.i, this__8985.off + 1);
    if(s__8986 == null) {
      return null
    }else {
      return s__8986
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8987 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8988 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8989 = this;
  return this__8989.node[this__8989.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8990 = this;
  if(this__8990.off + 1 < this__8990.node.length) {
    var s__8991 = cljs.core.chunked_seq.call(null, this__8990.vec, this__8990.node, this__8990.i, this__8990.off + 1);
    if(s__8991 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8991
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8992 = this;
  var l__8993 = this__8992.node.length;
  var s__8994 = this__8992.i + l__8993 < cljs.core._count.call(null, this__8992.vec) ? cljs.core.chunked_seq.call(null, this__8992.vec, this__8992.i + l__8993, 0) : null;
  if(s__8994 == null) {
    return null
  }else {
    return s__8994
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8995 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8996 = this;
  return cljs.core.chunked_seq.call(null, this__8996.vec, this__8996.node, this__8996.i, this__8996.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8997 = this;
  return this__8997.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8998 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8998.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8999 = this;
  return cljs.core.array_chunk.call(null, this__8999.node, this__8999.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9000 = this;
  var l__9001 = this__9000.node.length;
  var s__9002 = this__9000.i + l__9001 < cljs.core._count.call(null, this__9000.vec) ? cljs.core.chunked_seq.call(null, this__9000.vec, this__9000.i + l__9001, 0) : null;
  if(s__9002 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__9002
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9005 = this;
  var h__2247__auto____9006 = this__9005.__hash;
  if(!(h__2247__auto____9006 == null)) {
    return h__2247__auto____9006
  }else {
    var h__2247__auto____9007 = cljs.core.hash_coll.call(null, coll);
    this__9005.__hash = h__2247__auto____9007;
    return h__2247__auto____9007
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9008 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9009 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__9010 = this;
  var v_pos__9011 = this__9010.start + key;
  return new cljs.core.Subvec(this__9010.meta, cljs.core._assoc.call(null, this__9010.v, v_pos__9011, val), this__9010.start, this__9010.end > v_pos__9011 + 1 ? this__9010.end : v_pos__9011 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__9037 = null;
  var G__9037__2 = function(this_sym9012, k) {
    var this__9014 = this;
    var this_sym9012__9015 = this;
    var coll__9016 = this_sym9012__9015;
    return coll__9016.cljs$core$ILookup$_lookup$arity$2(coll__9016, k)
  };
  var G__9037__3 = function(this_sym9013, k, not_found) {
    var this__9014 = this;
    var this_sym9013__9017 = this;
    var coll__9018 = this_sym9013__9017;
    return coll__9018.cljs$core$ILookup$_lookup$arity$3(coll__9018, k, not_found)
  };
  G__9037 = function(this_sym9013, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9037__2.call(this, this_sym9013, k);
      case 3:
        return G__9037__3.call(this, this_sym9013, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9037
}();
cljs.core.Subvec.prototype.apply = function(this_sym9003, args9004) {
  var this__9019 = this;
  return this_sym9003.call.apply(this_sym9003, [this_sym9003].concat(args9004.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9020 = this;
  return new cljs.core.Subvec(this__9020.meta, cljs.core._assoc_n.call(null, this__9020.v, this__9020.end, o), this__9020.start, this__9020.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__9021 = this;
  var this__9022 = this;
  return cljs.core.pr_str.call(null, this__9022)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9023 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9024 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9025 = this;
  var subvec_seq__9026 = function subvec_seq(i) {
    if(i === this__9025.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9025.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__9026.call(null, this__9025.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9027 = this;
  return this__9027.end - this__9027.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9028 = this;
  return cljs.core._nth.call(null, this__9028.v, this__9028.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9029 = this;
  if(this__9029.start === this__9029.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9029.meta, this__9029.v, this__9029.start, this__9029.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9030 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9031 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9032 = this;
  return new cljs.core.Subvec(meta, this__9032.v, this__9032.start, this__9032.end, this__9032.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9033 = this;
  return this__9033.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9034 = this;
  return cljs.core._nth.call(null, this__9034.v, this__9034.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9035 = this;
  return cljs.core._nth.call(null, this__9035.v, this__9035.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9036 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9036.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__9039 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__9039, 0, tl.length);
  return ret__9039
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__9043 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__9044 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__9043, subidx__9044, level === 5 ? tail_node : function() {
    var child__9045 = cljs.core.pv_aget.call(null, ret__9043, subidx__9044);
    if(!(child__9045 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__9045, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__9043
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__9050 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__9051 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9052 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__9050, subidx__9051));
    if(function() {
      var and__3822__auto____9053 = new_child__9052 == null;
      if(and__3822__auto____9053) {
        return subidx__9051 === 0
      }else {
        return and__3822__auto____9053
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__9050, subidx__9051, new_child__9052);
      return node__9050
    }
  }else {
    if(subidx__9051 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__9050, subidx__9051, null);
        return node__9050
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____9058 = 0 <= i;
    if(and__3822__auto____9058) {
      return i < tv.cnt
    }else {
      return and__3822__auto____9058
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__9059 = tv.root;
      var node__9060 = root__9059;
      var level__9061 = tv.shift;
      while(true) {
        if(level__9061 > 0) {
          var G__9062 = cljs.core.tv_ensure_editable.call(null, root__9059.edit, cljs.core.pv_aget.call(null, node__9060, i >>> level__9061 & 31));
          var G__9063 = level__9061 - 5;
          node__9060 = G__9062;
          level__9061 = G__9063;
          continue
        }else {
          return node__9060.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__9103 = null;
  var G__9103__2 = function(this_sym9066, k) {
    var this__9068 = this;
    var this_sym9066__9069 = this;
    var coll__9070 = this_sym9066__9069;
    return coll__9070.cljs$core$ILookup$_lookup$arity$2(coll__9070, k)
  };
  var G__9103__3 = function(this_sym9067, k, not_found) {
    var this__9068 = this;
    var this_sym9067__9071 = this;
    var coll__9072 = this_sym9067__9071;
    return coll__9072.cljs$core$ILookup$_lookup$arity$3(coll__9072, k, not_found)
  };
  G__9103 = function(this_sym9067, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9103__2.call(this, this_sym9067, k);
      case 3:
        return G__9103__3.call(this, this_sym9067, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9103
}();
cljs.core.TransientVector.prototype.apply = function(this_sym9064, args9065) {
  var this__9073 = this;
  return this_sym9064.call.apply(this_sym9064, [this_sym9064].concat(args9065.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9074 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9075 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9076 = this;
  if(this__9076.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9077 = this;
  if(function() {
    var and__3822__auto____9078 = 0 <= n;
    if(and__3822__auto____9078) {
      return n < this__9077.cnt
    }else {
      return and__3822__auto____9078
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9079 = this;
  if(this__9079.root.edit) {
    return this__9079.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__9080 = this;
  if(this__9080.root.edit) {
    if(function() {
      var and__3822__auto____9081 = 0 <= n;
      if(and__3822__auto____9081) {
        return n < this__9080.cnt
      }else {
        return and__3822__auto____9081
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__9080.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__9086 = function go(level, node) {
          var node__9084 = cljs.core.tv_ensure_editable.call(null, this__9080.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__9084, n & 31, val);
            return node__9084
          }else {
            var subidx__9085 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__9084, subidx__9085, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__9084, subidx__9085)));
            return node__9084
          }
        }.call(null, this__9080.shift, this__9080.root);
        this__9080.root = new_root__9086;
        return tcoll
      }
    }else {
      if(n === this__9080.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__9080.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__9087 = this;
  if(this__9087.root.edit) {
    if(this__9087.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__9087.cnt) {
        this__9087.cnt = 0;
        return tcoll
      }else {
        if((this__9087.cnt - 1 & 31) > 0) {
          this__9087.cnt = this__9087.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__9088 = cljs.core.editable_array_for.call(null, tcoll, this__9087.cnt - 2);
            var new_root__9090 = function() {
              var nr__9089 = cljs.core.tv_pop_tail.call(null, tcoll, this__9087.shift, this__9087.root);
              if(!(nr__9089 == null)) {
                return nr__9089
              }else {
                return new cljs.core.VectorNode(this__9087.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____9091 = 5 < this__9087.shift;
              if(and__3822__auto____9091) {
                return cljs.core.pv_aget.call(null, new_root__9090, 1) == null
              }else {
                return and__3822__auto____9091
              }
            }()) {
              var new_root__9092 = cljs.core.tv_ensure_editable.call(null, this__9087.root.edit, cljs.core.pv_aget.call(null, new_root__9090, 0));
              this__9087.root = new_root__9092;
              this__9087.shift = this__9087.shift - 5;
              this__9087.cnt = this__9087.cnt - 1;
              this__9087.tail = new_tail__9088;
              return tcoll
            }else {
              this__9087.root = new_root__9090;
              this__9087.cnt = this__9087.cnt - 1;
              this__9087.tail = new_tail__9088;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9093 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9094 = this;
  if(this__9094.root.edit) {
    if(this__9094.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__9094.tail[this__9094.cnt & 31] = o;
      this__9094.cnt = this__9094.cnt + 1;
      return tcoll
    }else {
      var tail_node__9095 = new cljs.core.VectorNode(this__9094.root.edit, this__9094.tail);
      var new_tail__9096 = cljs.core.make_array.call(null, 32);
      new_tail__9096[0] = o;
      this__9094.tail = new_tail__9096;
      if(this__9094.cnt >>> 5 > 1 << this__9094.shift) {
        var new_root_array__9097 = cljs.core.make_array.call(null, 32);
        var new_shift__9098 = this__9094.shift + 5;
        new_root_array__9097[0] = this__9094.root;
        new_root_array__9097[1] = cljs.core.new_path.call(null, this__9094.root.edit, this__9094.shift, tail_node__9095);
        this__9094.root = new cljs.core.VectorNode(this__9094.root.edit, new_root_array__9097);
        this__9094.shift = new_shift__9098;
        this__9094.cnt = this__9094.cnt + 1;
        return tcoll
      }else {
        var new_root__9099 = cljs.core.tv_push_tail.call(null, tcoll, this__9094.shift, this__9094.root, tail_node__9095);
        this__9094.root = new_root__9099;
        this__9094.cnt = this__9094.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9100 = this;
  if(this__9100.root.edit) {
    this__9100.root.edit = null;
    var len__9101 = this__9100.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__9102 = cljs.core.make_array.call(null, len__9101);
    cljs.core.array_copy.call(null, this__9100.tail, 0, trimmed_tail__9102, 0, len__9101);
    return new cljs.core.PersistentVector(null, this__9100.cnt, this__9100.shift, this__9100.root, trimmed_tail__9102, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9104 = this;
  var h__2247__auto____9105 = this__9104.__hash;
  if(!(h__2247__auto____9105 == null)) {
    return h__2247__auto____9105
  }else {
    var h__2247__auto____9106 = cljs.core.hash_coll.call(null, coll);
    this__9104.__hash = h__2247__auto____9106;
    return h__2247__auto____9106
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9107 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__9108 = this;
  var this__9109 = this;
  return cljs.core.pr_str.call(null, this__9109)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9110 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9111 = this;
  return cljs.core._first.call(null, this__9111.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9112 = this;
  var temp__3971__auto____9113 = cljs.core.next.call(null, this__9112.front);
  if(temp__3971__auto____9113) {
    var f1__9114 = temp__3971__auto____9113;
    return new cljs.core.PersistentQueueSeq(this__9112.meta, f1__9114, this__9112.rear, null)
  }else {
    if(this__9112.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9112.meta, this__9112.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9115 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9116 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9116.front, this__9116.rear, this__9116.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9117 = this;
  return this__9117.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9118 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9118.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9119 = this;
  var h__2247__auto____9120 = this__9119.__hash;
  if(!(h__2247__auto____9120 == null)) {
    return h__2247__auto____9120
  }else {
    var h__2247__auto____9121 = cljs.core.hash_coll.call(null, coll);
    this__9119.__hash = h__2247__auto____9121;
    return h__2247__auto____9121
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9122 = this;
  if(cljs.core.truth_(this__9122.front)) {
    return new cljs.core.PersistentQueue(this__9122.meta, this__9122.count + 1, this__9122.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____9123 = this__9122.rear;
      if(cljs.core.truth_(or__3824__auto____9123)) {
        return or__3824__auto____9123
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__9122.meta, this__9122.count + 1, cljs.core.conj.call(null, this__9122.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__9124 = this;
  var this__9125 = this;
  return cljs.core.pr_str.call(null, this__9125)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9126 = this;
  var rear__9127 = cljs.core.seq.call(null, this__9126.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____9128 = this__9126.front;
    if(cljs.core.truth_(or__3824__auto____9128)) {
      return or__3824__auto____9128
    }else {
      return rear__9127
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9126.front, cljs.core.seq.call(null, rear__9127), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9129 = this;
  return this__9129.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9130 = this;
  return cljs.core._first.call(null, this__9130.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9131 = this;
  if(cljs.core.truth_(this__9131.front)) {
    var temp__3971__auto____9132 = cljs.core.next.call(null, this__9131.front);
    if(temp__3971__auto____9132) {
      var f1__9133 = temp__3971__auto____9132;
      return new cljs.core.PersistentQueue(this__9131.meta, this__9131.count - 1, f1__9133, this__9131.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__9131.meta, this__9131.count - 1, cljs.core.seq.call(null, this__9131.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9134 = this;
  return cljs.core.first.call(null, this__9134.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9135 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9136 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9137 = this;
  return new cljs.core.PersistentQueue(meta, this__9137.count, this__9137.front, this__9137.rear, this__9137.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9138 = this;
  return this__9138.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9139 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9140 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__9143 = array.length;
  var i__9144 = 0;
  while(true) {
    if(i__9144 < len__9143) {
      if(k === array[i__9144]) {
        return i__9144
      }else {
        var G__9145 = i__9144 + incr;
        i__9144 = G__9145;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9148 = cljs.core.hash.call(null, a);
  var b__9149 = cljs.core.hash.call(null, b);
  if(a__9148 < b__9149) {
    return-1
  }else {
    if(a__9148 > b__9149) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__9157 = m.keys;
  var len__9158 = ks__9157.length;
  var so__9159 = m.strobj;
  var out__9160 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9161 = 0;
  var out__9162 = cljs.core.transient$.call(null, out__9160);
  while(true) {
    if(i__9161 < len__9158) {
      var k__9163 = ks__9157[i__9161];
      var G__9164 = i__9161 + 1;
      var G__9165 = cljs.core.assoc_BANG_.call(null, out__9162, k__9163, so__9159[k__9163]);
      i__9161 = G__9164;
      out__9162 = G__9165;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9162, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9171 = {};
  var l__9172 = ks.length;
  var i__9173 = 0;
  while(true) {
    if(i__9173 < l__9172) {
      var k__9174 = ks[i__9173];
      new_obj__9171[k__9174] = obj[k__9174];
      var G__9175 = i__9173 + 1;
      i__9173 = G__9175;
      continue
    }else {
    }
    break
  }
  return new_obj__9171
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9178 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9179 = this;
  var h__2247__auto____9180 = this__9179.__hash;
  if(!(h__2247__auto____9180 == null)) {
    return h__2247__auto____9180
  }else {
    var h__2247__auto____9181 = cljs.core.hash_imap.call(null, coll);
    this__9179.__hash = h__2247__auto____9181;
    return h__2247__auto____9181
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9182 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9183 = this;
  if(function() {
    var and__3822__auto____9184 = goog.isString(k);
    if(and__3822__auto____9184) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9183.keys) == null)
    }else {
      return and__3822__auto____9184
    }
  }()) {
    return this__9183.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9185 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9186 = this__9185.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9186) {
        return or__3824__auto____9186
      }else {
        return this__9185.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9185.keys) == null)) {
        var new_strobj__9187 = cljs.core.obj_clone.call(null, this__9185.strobj, this__9185.keys);
        new_strobj__9187[k] = v;
        return new cljs.core.ObjMap(this__9185.meta, this__9185.keys, new_strobj__9187, this__9185.update_count + 1, null)
      }else {
        var new_strobj__9188 = cljs.core.obj_clone.call(null, this__9185.strobj, this__9185.keys);
        var new_keys__9189 = this__9185.keys.slice();
        new_strobj__9188[k] = v;
        new_keys__9189.push(k);
        return new cljs.core.ObjMap(this__9185.meta, new_keys__9189, new_strobj__9188, this__9185.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9190 = this;
  if(function() {
    var and__3822__auto____9191 = goog.isString(k);
    if(and__3822__auto____9191) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9190.keys) == null)
    }else {
      return and__3822__auto____9191
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9213 = null;
  var G__9213__2 = function(this_sym9192, k) {
    var this__9194 = this;
    var this_sym9192__9195 = this;
    var coll__9196 = this_sym9192__9195;
    return coll__9196.cljs$core$ILookup$_lookup$arity$2(coll__9196, k)
  };
  var G__9213__3 = function(this_sym9193, k, not_found) {
    var this__9194 = this;
    var this_sym9193__9197 = this;
    var coll__9198 = this_sym9193__9197;
    return coll__9198.cljs$core$ILookup$_lookup$arity$3(coll__9198, k, not_found)
  };
  G__9213 = function(this_sym9193, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9213__2.call(this, this_sym9193, k);
      case 3:
        return G__9213__3.call(this, this_sym9193, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9213
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9176, args9177) {
  var this__9199 = this;
  return this_sym9176.call.apply(this_sym9176, [this_sym9176].concat(args9177.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9200 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9201 = this;
  var this__9202 = this;
  return cljs.core.pr_str.call(null, this__9202)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9203 = this;
  if(this__9203.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9166_SHARP_) {
      return cljs.core.vector.call(null, p1__9166_SHARP_, this__9203.strobj[p1__9166_SHARP_])
    }, this__9203.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9204 = this;
  return this__9204.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9205 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9206 = this;
  return new cljs.core.ObjMap(meta, this__9206.keys, this__9206.strobj, this__9206.update_count, this__9206.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9207 = this;
  return this__9207.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9208 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9208.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9209 = this;
  if(function() {
    var and__3822__auto____9210 = goog.isString(k);
    if(and__3822__auto____9210) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9209.keys) == null)
    }else {
      return and__3822__auto____9210
    }
  }()) {
    var new_keys__9211 = this__9209.keys.slice();
    var new_strobj__9212 = cljs.core.obj_clone.call(null, this__9209.strobj, this__9209.keys);
    new_keys__9211.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9211), 1);
    cljs.core.js_delete.call(null, new_strobj__9212, k);
    return new cljs.core.ObjMap(this__9209.meta, new_keys__9211, new_strobj__9212, this__9209.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9217 = this;
  var h__2247__auto____9218 = this__9217.__hash;
  if(!(h__2247__auto____9218 == null)) {
    return h__2247__auto____9218
  }else {
    var h__2247__auto____9219 = cljs.core.hash_imap.call(null, coll);
    this__9217.__hash = h__2247__auto____9219;
    return h__2247__auto____9219
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9220 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9221 = this;
  var bucket__9222 = this__9221.hashobj[cljs.core.hash.call(null, k)];
  var i__9223 = cljs.core.truth_(bucket__9222) ? cljs.core.scan_array.call(null, 2, k, bucket__9222) : null;
  if(cljs.core.truth_(i__9223)) {
    return bucket__9222[i__9223 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9224 = this;
  var h__9225 = cljs.core.hash.call(null, k);
  var bucket__9226 = this__9224.hashobj[h__9225];
  if(cljs.core.truth_(bucket__9226)) {
    var new_bucket__9227 = bucket__9226.slice();
    var new_hashobj__9228 = goog.object.clone(this__9224.hashobj);
    new_hashobj__9228[h__9225] = new_bucket__9227;
    var temp__3971__auto____9229 = cljs.core.scan_array.call(null, 2, k, new_bucket__9227);
    if(cljs.core.truth_(temp__3971__auto____9229)) {
      var i__9230 = temp__3971__auto____9229;
      new_bucket__9227[i__9230 + 1] = v;
      return new cljs.core.HashMap(this__9224.meta, this__9224.count, new_hashobj__9228, null)
    }else {
      new_bucket__9227.push(k, v);
      return new cljs.core.HashMap(this__9224.meta, this__9224.count + 1, new_hashobj__9228, null)
    }
  }else {
    var new_hashobj__9231 = goog.object.clone(this__9224.hashobj);
    new_hashobj__9231[h__9225] = [k, v];
    return new cljs.core.HashMap(this__9224.meta, this__9224.count + 1, new_hashobj__9231, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9232 = this;
  var bucket__9233 = this__9232.hashobj[cljs.core.hash.call(null, k)];
  var i__9234 = cljs.core.truth_(bucket__9233) ? cljs.core.scan_array.call(null, 2, k, bucket__9233) : null;
  if(cljs.core.truth_(i__9234)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9259 = null;
  var G__9259__2 = function(this_sym9235, k) {
    var this__9237 = this;
    var this_sym9235__9238 = this;
    var coll__9239 = this_sym9235__9238;
    return coll__9239.cljs$core$ILookup$_lookup$arity$2(coll__9239, k)
  };
  var G__9259__3 = function(this_sym9236, k, not_found) {
    var this__9237 = this;
    var this_sym9236__9240 = this;
    var coll__9241 = this_sym9236__9240;
    return coll__9241.cljs$core$ILookup$_lookup$arity$3(coll__9241, k, not_found)
  };
  G__9259 = function(this_sym9236, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9259__2.call(this, this_sym9236, k);
      case 3:
        return G__9259__3.call(this, this_sym9236, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9259
}();
cljs.core.HashMap.prototype.apply = function(this_sym9215, args9216) {
  var this__9242 = this;
  return this_sym9215.call.apply(this_sym9215, [this_sym9215].concat(args9216.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9243 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9244 = this;
  var this__9245 = this;
  return cljs.core.pr_str.call(null, this__9245)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9246 = this;
  if(this__9246.count > 0) {
    var hashes__9247 = cljs.core.js_keys.call(null, this__9246.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9214_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9246.hashobj[p1__9214_SHARP_]))
    }, hashes__9247)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9248 = this;
  return this__9248.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9249 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9250 = this;
  return new cljs.core.HashMap(meta, this__9250.count, this__9250.hashobj, this__9250.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9251 = this;
  return this__9251.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9252 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9252.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9253 = this;
  var h__9254 = cljs.core.hash.call(null, k);
  var bucket__9255 = this__9253.hashobj[h__9254];
  var i__9256 = cljs.core.truth_(bucket__9255) ? cljs.core.scan_array.call(null, 2, k, bucket__9255) : null;
  if(cljs.core.not.call(null, i__9256)) {
    return coll
  }else {
    var new_hashobj__9257 = goog.object.clone(this__9253.hashobj);
    if(3 > bucket__9255.length) {
      cljs.core.js_delete.call(null, new_hashobj__9257, h__9254)
    }else {
      var new_bucket__9258 = bucket__9255.slice();
      new_bucket__9258.splice(i__9256, 2);
      new_hashobj__9257[h__9254] = new_bucket__9258
    }
    return new cljs.core.HashMap(this__9253.meta, this__9253.count - 1, new_hashobj__9257, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9260 = ks.length;
  var i__9261 = 0;
  var out__9262 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9261 < len__9260) {
      var G__9263 = i__9261 + 1;
      var G__9264 = cljs.core.assoc.call(null, out__9262, ks[i__9261], vs[i__9261]);
      i__9261 = G__9263;
      out__9262 = G__9264;
      continue
    }else {
      return out__9262
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9268 = m.arr;
  var len__9269 = arr__9268.length;
  var i__9270 = 0;
  while(true) {
    if(len__9269 <= i__9270) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9268[i__9270], k)) {
        return i__9270
      }else {
        if("\ufdd0'else") {
          var G__9271 = i__9270 + 2;
          i__9270 = G__9271;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9274 = this;
  return new cljs.core.TransientArrayMap({}, this__9274.arr.length, this__9274.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9275 = this;
  var h__2247__auto____9276 = this__9275.__hash;
  if(!(h__2247__auto____9276 == null)) {
    return h__2247__auto____9276
  }else {
    var h__2247__auto____9277 = cljs.core.hash_imap.call(null, coll);
    this__9275.__hash = h__2247__auto____9277;
    return h__2247__auto____9277
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9278 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9279 = this;
  var idx__9280 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9280 === -1) {
    return not_found
  }else {
    return this__9279.arr[idx__9280 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9281 = this;
  var idx__9282 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9282 === -1) {
    if(this__9281.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9281.meta, this__9281.cnt + 1, function() {
        var G__9283__9284 = this__9281.arr.slice();
        G__9283__9284.push(k);
        G__9283__9284.push(v);
        return G__9283__9284
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9281.arr[idx__9282 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9281.meta, this__9281.cnt, function() {
          var G__9285__9286 = this__9281.arr.slice();
          G__9285__9286[idx__9282 + 1] = v;
          return G__9285__9286
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9287 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9319 = null;
  var G__9319__2 = function(this_sym9288, k) {
    var this__9290 = this;
    var this_sym9288__9291 = this;
    var coll__9292 = this_sym9288__9291;
    return coll__9292.cljs$core$ILookup$_lookup$arity$2(coll__9292, k)
  };
  var G__9319__3 = function(this_sym9289, k, not_found) {
    var this__9290 = this;
    var this_sym9289__9293 = this;
    var coll__9294 = this_sym9289__9293;
    return coll__9294.cljs$core$ILookup$_lookup$arity$3(coll__9294, k, not_found)
  };
  G__9319 = function(this_sym9289, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9319__2.call(this, this_sym9289, k);
      case 3:
        return G__9319__3.call(this, this_sym9289, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9319
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9272, args9273) {
  var this__9295 = this;
  return this_sym9272.call.apply(this_sym9272, [this_sym9272].concat(args9273.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9296 = this;
  var len__9297 = this__9296.arr.length;
  var i__9298 = 0;
  var init__9299 = init;
  while(true) {
    if(i__9298 < len__9297) {
      var init__9300 = f.call(null, init__9299, this__9296.arr[i__9298], this__9296.arr[i__9298 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9300)) {
        return cljs.core.deref.call(null, init__9300)
      }else {
        var G__9320 = i__9298 + 2;
        var G__9321 = init__9300;
        i__9298 = G__9320;
        init__9299 = G__9321;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9301 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9302 = this;
  var this__9303 = this;
  return cljs.core.pr_str.call(null, this__9303)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9304 = this;
  if(this__9304.cnt > 0) {
    var len__9305 = this__9304.arr.length;
    var array_map_seq__9306 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9305) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9304.arr[i], this__9304.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9306.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9307 = this;
  return this__9307.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9308 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9309 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9309.cnt, this__9309.arr, this__9309.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9310 = this;
  return this__9310.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9311 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9311.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9312 = this;
  var idx__9313 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9313 >= 0) {
    var len__9314 = this__9312.arr.length;
    var new_len__9315 = len__9314 - 2;
    if(new_len__9315 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9316 = cljs.core.make_array.call(null, new_len__9315);
      var s__9317 = 0;
      var d__9318 = 0;
      while(true) {
        if(s__9317 >= len__9314) {
          return new cljs.core.PersistentArrayMap(this__9312.meta, this__9312.cnt - 1, new_arr__9316, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9312.arr[s__9317])) {
            var G__9322 = s__9317 + 2;
            var G__9323 = d__9318;
            s__9317 = G__9322;
            d__9318 = G__9323;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9316[d__9318] = this__9312.arr[s__9317];
              new_arr__9316[d__9318 + 1] = this__9312.arr[s__9317 + 1];
              var G__9324 = s__9317 + 2;
              var G__9325 = d__9318 + 2;
              s__9317 = G__9324;
              d__9318 = G__9325;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__9326 = cljs.core.count.call(null, ks);
  var i__9327 = 0;
  var out__9328 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9327 < len__9326) {
      var G__9329 = i__9327 + 1;
      var G__9330 = cljs.core.assoc_BANG_.call(null, out__9328, ks[i__9327], vs[i__9327]);
      i__9327 = G__9329;
      out__9328 = G__9330;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9328)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9331 = this;
  if(cljs.core.truth_(this__9331.editable_QMARK_)) {
    var idx__9332 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9332 >= 0) {
      this__9331.arr[idx__9332] = this__9331.arr[this__9331.len - 2];
      this__9331.arr[idx__9332 + 1] = this__9331.arr[this__9331.len - 1];
      var G__9333__9334 = this__9331.arr;
      G__9333__9334.pop();
      G__9333__9334.pop();
      G__9333__9334;
      this__9331.len = this__9331.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9335 = this;
  if(cljs.core.truth_(this__9335.editable_QMARK_)) {
    var idx__9336 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9336 === -1) {
      if(this__9335.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9335.len = this__9335.len + 2;
        this__9335.arr.push(key);
        this__9335.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9335.len, this__9335.arr), key, val)
      }
    }else {
      if(val === this__9335.arr[idx__9336 + 1]) {
        return tcoll
      }else {
        this__9335.arr[idx__9336 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9337 = this;
  if(cljs.core.truth_(this__9337.editable_QMARK_)) {
    if(function() {
      var G__9338__9339 = o;
      if(G__9338__9339) {
        if(function() {
          var or__3824__auto____9340 = G__9338__9339.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9340) {
            return or__3824__auto____9340
          }else {
            return G__9338__9339.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9338__9339.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9338__9339)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9338__9339)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9341 = cljs.core.seq.call(null, o);
      var tcoll__9342 = tcoll;
      while(true) {
        var temp__3971__auto____9343 = cljs.core.first.call(null, es__9341);
        if(cljs.core.truth_(temp__3971__auto____9343)) {
          var e__9344 = temp__3971__auto____9343;
          var G__9350 = cljs.core.next.call(null, es__9341);
          var G__9351 = tcoll__9342.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9342, cljs.core.key.call(null, e__9344), cljs.core.val.call(null, e__9344));
          es__9341 = G__9350;
          tcoll__9342 = G__9351;
          continue
        }else {
          return tcoll__9342
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9345 = this;
  if(cljs.core.truth_(this__9345.editable_QMARK_)) {
    this__9345.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9345.len, 2), this__9345.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9346 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9347 = this;
  if(cljs.core.truth_(this__9347.editable_QMARK_)) {
    var idx__9348 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9348 === -1) {
      return not_found
    }else {
      return this__9347.arr[idx__9348 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9349 = this;
  if(cljs.core.truth_(this__9349.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9349.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9354 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9355 = 0;
  while(true) {
    if(i__9355 < len) {
      var G__9356 = cljs.core.assoc_BANG_.call(null, out__9354, arr[i__9355], arr[i__9355 + 1]);
      var G__9357 = i__9355 + 2;
      out__9354 = G__9356;
      i__9355 = G__9357;
      continue
    }else {
      return out__9354
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2365__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__9362__9363 = arr.slice();
    G__9362__9363[i] = a;
    return G__9362__9363
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9364__9365 = arr.slice();
    G__9364__9365[i] = a;
    G__9364__9365[j] = b;
    return G__9364__9365
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__9367 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9367, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9367, 2 * i, new_arr__9367.length - 2 * i);
  return new_arr__9367
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__9370 = inode.ensure_editable(edit);
    editable__9370.arr[i] = a;
    return editable__9370
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9371 = inode.ensure_editable(edit);
    editable__9371.arr[i] = a;
    editable__9371.arr[j] = b;
    return editable__9371
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__9378 = arr.length;
  var i__9379 = 0;
  var init__9380 = init;
  while(true) {
    if(i__9379 < len__9378) {
      var init__9383 = function() {
        var k__9381 = arr[i__9379];
        if(!(k__9381 == null)) {
          return f.call(null, init__9380, k__9381, arr[i__9379 + 1])
        }else {
          var node__9382 = arr[i__9379 + 1];
          if(!(node__9382 == null)) {
            return node__9382.kv_reduce(f, init__9380)
          }else {
            return init__9380
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9383)) {
        return cljs.core.deref.call(null, init__9383)
      }else {
        var G__9384 = i__9379 + 2;
        var G__9385 = init__9383;
        i__9379 = G__9384;
        init__9380 = G__9385;
        continue
      }
    }else {
      return init__9380
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__9386 = this;
  var inode__9387 = this;
  if(this__9386.bitmap === bit) {
    return null
  }else {
    var editable__9388 = inode__9387.ensure_editable(e);
    var earr__9389 = editable__9388.arr;
    var len__9390 = earr__9389.length;
    editable__9388.bitmap = bit ^ editable__9388.bitmap;
    cljs.core.array_copy.call(null, earr__9389, 2 * (i + 1), earr__9389, 2 * i, len__9390 - 2 * (i + 1));
    earr__9389[len__9390 - 2] = null;
    earr__9389[len__9390 - 1] = null;
    return editable__9388
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9391 = this;
  var inode__9392 = this;
  var bit__9393 = 1 << (hash >>> shift & 31);
  var idx__9394 = cljs.core.bitmap_indexed_node_index.call(null, this__9391.bitmap, bit__9393);
  if((this__9391.bitmap & bit__9393) === 0) {
    var n__9395 = cljs.core.bit_count.call(null, this__9391.bitmap);
    if(2 * n__9395 < this__9391.arr.length) {
      var editable__9396 = inode__9392.ensure_editable(edit);
      var earr__9397 = editable__9396.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9397, 2 * idx__9394, earr__9397, 2 * (idx__9394 + 1), 2 * (n__9395 - idx__9394));
      earr__9397[2 * idx__9394] = key;
      earr__9397[2 * idx__9394 + 1] = val;
      editable__9396.bitmap = editable__9396.bitmap | bit__9393;
      return editable__9396
    }else {
      if(n__9395 >= 16) {
        var nodes__9398 = cljs.core.make_array.call(null, 32);
        var jdx__9399 = hash >>> shift & 31;
        nodes__9398[jdx__9399] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9400 = 0;
        var j__9401 = 0;
        while(true) {
          if(i__9400 < 32) {
            if((this__9391.bitmap >>> i__9400 & 1) === 0) {
              var G__9454 = i__9400 + 1;
              var G__9455 = j__9401;
              i__9400 = G__9454;
              j__9401 = G__9455;
              continue
            }else {
              nodes__9398[i__9400] = !(this__9391.arr[j__9401] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9391.arr[j__9401]), this__9391.arr[j__9401], this__9391.arr[j__9401 + 1], added_leaf_QMARK_) : this__9391.arr[j__9401 + 1];
              var G__9456 = i__9400 + 1;
              var G__9457 = j__9401 + 2;
              i__9400 = G__9456;
              j__9401 = G__9457;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9395 + 1, nodes__9398)
      }else {
        if("\ufdd0'else") {
          var new_arr__9402 = cljs.core.make_array.call(null, 2 * (n__9395 + 4));
          cljs.core.array_copy.call(null, this__9391.arr, 0, new_arr__9402, 0, 2 * idx__9394);
          new_arr__9402[2 * idx__9394] = key;
          new_arr__9402[2 * idx__9394 + 1] = val;
          cljs.core.array_copy.call(null, this__9391.arr, 2 * idx__9394, new_arr__9402, 2 * (idx__9394 + 1), 2 * (n__9395 - idx__9394));
          added_leaf_QMARK_.val = true;
          var editable__9403 = inode__9392.ensure_editable(edit);
          editable__9403.arr = new_arr__9402;
          editable__9403.bitmap = editable__9403.bitmap | bit__9393;
          return editable__9403
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9404 = this__9391.arr[2 * idx__9394];
    var val_or_node__9405 = this__9391.arr[2 * idx__9394 + 1];
    if(key_or_nil__9404 == null) {
      var n__9406 = val_or_node__9405.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9406 === val_or_node__9405) {
        return inode__9392
      }else {
        return cljs.core.edit_and_set.call(null, inode__9392, edit, 2 * idx__9394 + 1, n__9406)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9404)) {
        if(val === val_or_node__9405) {
          return inode__9392
        }else {
          return cljs.core.edit_and_set.call(null, inode__9392, edit, 2 * idx__9394 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9392, edit, 2 * idx__9394, null, 2 * idx__9394 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9404, val_or_node__9405, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9407 = this;
  var inode__9408 = this;
  return cljs.core.create_inode_seq.call(null, this__9407.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9409 = this;
  var inode__9410 = this;
  var bit__9411 = 1 << (hash >>> shift & 31);
  if((this__9409.bitmap & bit__9411) === 0) {
    return inode__9410
  }else {
    var idx__9412 = cljs.core.bitmap_indexed_node_index.call(null, this__9409.bitmap, bit__9411);
    var key_or_nil__9413 = this__9409.arr[2 * idx__9412];
    var val_or_node__9414 = this__9409.arr[2 * idx__9412 + 1];
    if(key_or_nil__9413 == null) {
      var n__9415 = val_or_node__9414.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9415 === val_or_node__9414) {
        return inode__9410
      }else {
        if(!(n__9415 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9410, edit, 2 * idx__9412 + 1, n__9415)
        }else {
          if(this__9409.bitmap === bit__9411) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9410.edit_and_remove_pair(edit, bit__9411, idx__9412)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9413)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9410.edit_and_remove_pair(edit, bit__9411, idx__9412)
      }else {
        if("\ufdd0'else") {
          return inode__9410
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9416 = this;
  var inode__9417 = this;
  if(e === this__9416.edit) {
    return inode__9417
  }else {
    var n__9418 = cljs.core.bit_count.call(null, this__9416.bitmap);
    var new_arr__9419 = cljs.core.make_array.call(null, n__9418 < 0 ? 4 : 2 * (n__9418 + 1));
    cljs.core.array_copy.call(null, this__9416.arr, 0, new_arr__9419, 0, 2 * n__9418);
    return new cljs.core.BitmapIndexedNode(e, this__9416.bitmap, new_arr__9419)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9420 = this;
  var inode__9421 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9420.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9422 = this;
  var inode__9423 = this;
  var bit__9424 = 1 << (hash >>> shift & 31);
  if((this__9422.bitmap & bit__9424) === 0) {
    return not_found
  }else {
    var idx__9425 = cljs.core.bitmap_indexed_node_index.call(null, this__9422.bitmap, bit__9424);
    var key_or_nil__9426 = this__9422.arr[2 * idx__9425];
    var val_or_node__9427 = this__9422.arr[2 * idx__9425 + 1];
    if(key_or_nil__9426 == null) {
      return val_or_node__9427.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9426)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9426, val_or_node__9427], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__9428 = this;
  var inode__9429 = this;
  var bit__9430 = 1 << (hash >>> shift & 31);
  if((this__9428.bitmap & bit__9430) === 0) {
    return inode__9429
  }else {
    var idx__9431 = cljs.core.bitmap_indexed_node_index.call(null, this__9428.bitmap, bit__9430);
    var key_or_nil__9432 = this__9428.arr[2 * idx__9431];
    var val_or_node__9433 = this__9428.arr[2 * idx__9431 + 1];
    if(key_or_nil__9432 == null) {
      var n__9434 = val_or_node__9433.inode_without(shift + 5, hash, key);
      if(n__9434 === val_or_node__9433) {
        return inode__9429
      }else {
        if(!(n__9434 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9428.bitmap, cljs.core.clone_and_set.call(null, this__9428.arr, 2 * idx__9431 + 1, n__9434))
        }else {
          if(this__9428.bitmap === bit__9430) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9428.bitmap ^ bit__9430, cljs.core.remove_pair.call(null, this__9428.arr, idx__9431))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9432)) {
        return new cljs.core.BitmapIndexedNode(null, this__9428.bitmap ^ bit__9430, cljs.core.remove_pair.call(null, this__9428.arr, idx__9431))
      }else {
        if("\ufdd0'else") {
          return inode__9429
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9435 = this;
  var inode__9436 = this;
  var bit__9437 = 1 << (hash >>> shift & 31);
  var idx__9438 = cljs.core.bitmap_indexed_node_index.call(null, this__9435.bitmap, bit__9437);
  if((this__9435.bitmap & bit__9437) === 0) {
    var n__9439 = cljs.core.bit_count.call(null, this__9435.bitmap);
    if(n__9439 >= 16) {
      var nodes__9440 = cljs.core.make_array.call(null, 32);
      var jdx__9441 = hash >>> shift & 31;
      nodes__9440[jdx__9441] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9442 = 0;
      var j__9443 = 0;
      while(true) {
        if(i__9442 < 32) {
          if((this__9435.bitmap >>> i__9442 & 1) === 0) {
            var G__9458 = i__9442 + 1;
            var G__9459 = j__9443;
            i__9442 = G__9458;
            j__9443 = G__9459;
            continue
          }else {
            nodes__9440[i__9442] = !(this__9435.arr[j__9443] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9435.arr[j__9443]), this__9435.arr[j__9443], this__9435.arr[j__9443 + 1], added_leaf_QMARK_) : this__9435.arr[j__9443 + 1];
            var G__9460 = i__9442 + 1;
            var G__9461 = j__9443 + 2;
            i__9442 = G__9460;
            j__9443 = G__9461;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9439 + 1, nodes__9440)
    }else {
      var new_arr__9444 = cljs.core.make_array.call(null, 2 * (n__9439 + 1));
      cljs.core.array_copy.call(null, this__9435.arr, 0, new_arr__9444, 0, 2 * idx__9438);
      new_arr__9444[2 * idx__9438] = key;
      new_arr__9444[2 * idx__9438 + 1] = val;
      cljs.core.array_copy.call(null, this__9435.arr, 2 * idx__9438, new_arr__9444, 2 * (idx__9438 + 1), 2 * (n__9439 - idx__9438));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9435.bitmap | bit__9437, new_arr__9444)
    }
  }else {
    var key_or_nil__9445 = this__9435.arr[2 * idx__9438];
    var val_or_node__9446 = this__9435.arr[2 * idx__9438 + 1];
    if(key_or_nil__9445 == null) {
      var n__9447 = val_or_node__9446.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9447 === val_or_node__9446) {
        return inode__9436
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9435.bitmap, cljs.core.clone_and_set.call(null, this__9435.arr, 2 * idx__9438 + 1, n__9447))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9445)) {
        if(val === val_or_node__9446) {
          return inode__9436
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9435.bitmap, cljs.core.clone_and_set.call(null, this__9435.arr, 2 * idx__9438 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9435.bitmap, cljs.core.clone_and_set.call(null, this__9435.arr, 2 * idx__9438, null, 2 * idx__9438 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9445, val_or_node__9446, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9448 = this;
  var inode__9449 = this;
  var bit__9450 = 1 << (hash >>> shift & 31);
  if((this__9448.bitmap & bit__9450) === 0) {
    return not_found
  }else {
    var idx__9451 = cljs.core.bitmap_indexed_node_index.call(null, this__9448.bitmap, bit__9450);
    var key_or_nil__9452 = this__9448.arr[2 * idx__9451];
    var val_or_node__9453 = this__9448.arr[2 * idx__9451 + 1];
    if(key_or_nil__9452 == null) {
      return val_or_node__9453.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9452)) {
        return val_or_node__9453
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__9469 = array_node.arr;
  var len__9470 = 2 * (array_node.cnt - 1);
  var new_arr__9471 = cljs.core.make_array.call(null, len__9470);
  var i__9472 = 0;
  var j__9473 = 1;
  var bitmap__9474 = 0;
  while(true) {
    if(i__9472 < len__9470) {
      if(function() {
        var and__3822__auto____9475 = !(i__9472 === idx);
        if(and__3822__auto____9475) {
          return!(arr__9469[i__9472] == null)
        }else {
          return and__3822__auto____9475
        }
      }()) {
        new_arr__9471[j__9473] = arr__9469[i__9472];
        var G__9476 = i__9472 + 1;
        var G__9477 = j__9473 + 2;
        var G__9478 = bitmap__9474 | 1 << i__9472;
        i__9472 = G__9476;
        j__9473 = G__9477;
        bitmap__9474 = G__9478;
        continue
      }else {
        var G__9479 = i__9472 + 1;
        var G__9480 = j__9473;
        var G__9481 = bitmap__9474;
        i__9472 = G__9479;
        j__9473 = G__9480;
        bitmap__9474 = G__9481;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9474, new_arr__9471)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9482 = this;
  var inode__9483 = this;
  var idx__9484 = hash >>> shift & 31;
  var node__9485 = this__9482.arr[idx__9484];
  if(node__9485 == null) {
    var editable__9486 = cljs.core.edit_and_set.call(null, inode__9483, edit, idx__9484, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9486.cnt = editable__9486.cnt + 1;
    return editable__9486
  }else {
    var n__9487 = node__9485.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9487 === node__9485) {
      return inode__9483
    }else {
      return cljs.core.edit_and_set.call(null, inode__9483, edit, idx__9484, n__9487)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9488 = this;
  var inode__9489 = this;
  return cljs.core.create_array_node_seq.call(null, this__9488.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9490 = this;
  var inode__9491 = this;
  var idx__9492 = hash >>> shift & 31;
  var node__9493 = this__9490.arr[idx__9492];
  if(node__9493 == null) {
    return inode__9491
  }else {
    var n__9494 = node__9493.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9494 === node__9493) {
      return inode__9491
    }else {
      if(n__9494 == null) {
        if(this__9490.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9491, edit, idx__9492)
        }else {
          var editable__9495 = cljs.core.edit_and_set.call(null, inode__9491, edit, idx__9492, n__9494);
          editable__9495.cnt = editable__9495.cnt - 1;
          return editable__9495
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9491, edit, idx__9492, n__9494)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9496 = this;
  var inode__9497 = this;
  if(e === this__9496.edit) {
    return inode__9497
  }else {
    return new cljs.core.ArrayNode(e, this__9496.cnt, this__9496.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9498 = this;
  var inode__9499 = this;
  var len__9500 = this__9498.arr.length;
  var i__9501 = 0;
  var init__9502 = init;
  while(true) {
    if(i__9501 < len__9500) {
      var node__9503 = this__9498.arr[i__9501];
      if(!(node__9503 == null)) {
        var init__9504 = node__9503.kv_reduce(f, init__9502);
        if(cljs.core.reduced_QMARK_.call(null, init__9504)) {
          return cljs.core.deref.call(null, init__9504)
        }else {
          var G__9523 = i__9501 + 1;
          var G__9524 = init__9504;
          i__9501 = G__9523;
          init__9502 = G__9524;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9502
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9505 = this;
  var inode__9506 = this;
  var idx__9507 = hash >>> shift & 31;
  var node__9508 = this__9505.arr[idx__9507];
  if(!(node__9508 == null)) {
    return node__9508.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9509 = this;
  var inode__9510 = this;
  var idx__9511 = hash >>> shift & 31;
  var node__9512 = this__9509.arr[idx__9511];
  if(!(node__9512 == null)) {
    var n__9513 = node__9512.inode_without(shift + 5, hash, key);
    if(n__9513 === node__9512) {
      return inode__9510
    }else {
      if(n__9513 == null) {
        if(this__9509.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9510, null, idx__9511)
        }else {
          return new cljs.core.ArrayNode(null, this__9509.cnt - 1, cljs.core.clone_and_set.call(null, this__9509.arr, idx__9511, n__9513))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9509.cnt, cljs.core.clone_and_set.call(null, this__9509.arr, idx__9511, n__9513))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9510
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9514 = this;
  var inode__9515 = this;
  var idx__9516 = hash >>> shift & 31;
  var node__9517 = this__9514.arr[idx__9516];
  if(node__9517 == null) {
    return new cljs.core.ArrayNode(null, this__9514.cnt + 1, cljs.core.clone_and_set.call(null, this__9514.arr, idx__9516, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9518 = node__9517.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9518 === node__9517) {
      return inode__9515
    }else {
      return new cljs.core.ArrayNode(null, this__9514.cnt, cljs.core.clone_and_set.call(null, this__9514.arr, idx__9516, n__9518))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9519 = this;
  var inode__9520 = this;
  var idx__9521 = hash >>> shift & 31;
  var node__9522 = this__9519.arr[idx__9521];
  if(!(node__9522 == null)) {
    return node__9522.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9527 = 2 * cnt;
  var i__9528 = 0;
  while(true) {
    if(i__9528 < lim__9527) {
      if(cljs.core.key_test.call(null, key, arr[i__9528])) {
        return i__9528
      }else {
        var G__9529 = i__9528 + 2;
        i__9528 = G__9529;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9530 = this;
  var inode__9531 = this;
  if(hash === this__9530.collision_hash) {
    var idx__9532 = cljs.core.hash_collision_node_find_index.call(null, this__9530.arr, this__9530.cnt, key);
    if(idx__9532 === -1) {
      if(this__9530.arr.length > 2 * this__9530.cnt) {
        var editable__9533 = cljs.core.edit_and_set.call(null, inode__9531, edit, 2 * this__9530.cnt, key, 2 * this__9530.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9533.cnt = editable__9533.cnt + 1;
        return editable__9533
      }else {
        var len__9534 = this__9530.arr.length;
        var new_arr__9535 = cljs.core.make_array.call(null, len__9534 + 2);
        cljs.core.array_copy.call(null, this__9530.arr, 0, new_arr__9535, 0, len__9534);
        new_arr__9535[len__9534] = key;
        new_arr__9535[len__9534 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9531.ensure_editable_array(edit, this__9530.cnt + 1, new_arr__9535)
      }
    }else {
      if(this__9530.arr[idx__9532 + 1] === val) {
        return inode__9531
      }else {
        return cljs.core.edit_and_set.call(null, inode__9531, edit, idx__9532 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9530.collision_hash >>> shift & 31), [null, inode__9531, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9536 = this;
  var inode__9537 = this;
  return cljs.core.create_inode_seq.call(null, this__9536.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9538 = this;
  var inode__9539 = this;
  var idx__9540 = cljs.core.hash_collision_node_find_index.call(null, this__9538.arr, this__9538.cnt, key);
  if(idx__9540 === -1) {
    return inode__9539
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9538.cnt === 1) {
      return null
    }else {
      var editable__9541 = inode__9539.ensure_editable(edit);
      var earr__9542 = editable__9541.arr;
      earr__9542[idx__9540] = earr__9542[2 * this__9538.cnt - 2];
      earr__9542[idx__9540 + 1] = earr__9542[2 * this__9538.cnt - 1];
      earr__9542[2 * this__9538.cnt - 1] = null;
      earr__9542[2 * this__9538.cnt - 2] = null;
      editable__9541.cnt = editable__9541.cnt - 1;
      return editable__9541
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9543 = this;
  var inode__9544 = this;
  if(e === this__9543.edit) {
    return inode__9544
  }else {
    var new_arr__9545 = cljs.core.make_array.call(null, 2 * (this__9543.cnt + 1));
    cljs.core.array_copy.call(null, this__9543.arr, 0, new_arr__9545, 0, 2 * this__9543.cnt);
    return new cljs.core.HashCollisionNode(e, this__9543.collision_hash, this__9543.cnt, new_arr__9545)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9546 = this;
  var inode__9547 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9546.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9548 = this;
  var inode__9549 = this;
  var idx__9550 = cljs.core.hash_collision_node_find_index.call(null, this__9548.arr, this__9548.cnt, key);
  if(idx__9550 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9548.arr[idx__9550])) {
      return cljs.core.PersistentVector.fromArray([this__9548.arr[idx__9550], this__9548.arr[idx__9550 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9551 = this;
  var inode__9552 = this;
  var idx__9553 = cljs.core.hash_collision_node_find_index.call(null, this__9551.arr, this__9551.cnt, key);
  if(idx__9553 === -1) {
    return inode__9552
  }else {
    if(this__9551.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9551.collision_hash, this__9551.cnt - 1, cljs.core.remove_pair.call(null, this__9551.arr, cljs.core.quot.call(null, idx__9553, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9554 = this;
  var inode__9555 = this;
  if(hash === this__9554.collision_hash) {
    var idx__9556 = cljs.core.hash_collision_node_find_index.call(null, this__9554.arr, this__9554.cnt, key);
    if(idx__9556 === -1) {
      var len__9557 = this__9554.arr.length;
      var new_arr__9558 = cljs.core.make_array.call(null, len__9557 + 2);
      cljs.core.array_copy.call(null, this__9554.arr, 0, new_arr__9558, 0, len__9557);
      new_arr__9558[len__9557] = key;
      new_arr__9558[len__9557 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9554.collision_hash, this__9554.cnt + 1, new_arr__9558)
    }else {
      if(cljs.core._EQ_.call(null, this__9554.arr[idx__9556], val)) {
        return inode__9555
      }else {
        return new cljs.core.HashCollisionNode(null, this__9554.collision_hash, this__9554.cnt, cljs.core.clone_and_set.call(null, this__9554.arr, idx__9556 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9554.collision_hash >>> shift & 31), [null, inode__9555])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9559 = this;
  var inode__9560 = this;
  var idx__9561 = cljs.core.hash_collision_node_find_index.call(null, this__9559.arr, this__9559.cnt, key);
  if(idx__9561 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9559.arr[idx__9561])) {
      return this__9559.arr[idx__9561 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9562 = this;
  var inode__9563 = this;
  if(e === this__9562.edit) {
    this__9562.arr = array;
    this__9562.cnt = count;
    return inode__9563
  }else {
    return new cljs.core.HashCollisionNode(this__9562.edit, this__9562.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9568 = cljs.core.hash.call(null, key1);
    if(key1hash__9568 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9568, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9569 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9568, key1, val1, added_leaf_QMARK___9569).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9569)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9570 = cljs.core.hash.call(null, key1);
    if(key1hash__9570 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9570, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9571 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9570, key1, val1, added_leaf_QMARK___9571).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9571)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9572 = this;
  var h__2247__auto____9573 = this__9572.__hash;
  if(!(h__2247__auto____9573 == null)) {
    return h__2247__auto____9573
  }else {
    var h__2247__auto____9574 = cljs.core.hash_coll.call(null, coll);
    this__9572.__hash = h__2247__auto____9574;
    return h__2247__auto____9574
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9575 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9576 = this;
  var this__9577 = this;
  return cljs.core.pr_str.call(null, this__9577)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9578 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9579 = this;
  if(this__9579.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9579.nodes[this__9579.i], this__9579.nodes[this__9579.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9579.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9580 = this;
  if(this__9580.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9580.nodes, this__9580.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9580.nodes, this__9580.i, cljs.core.next.call(null, this__9580.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9581 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9582 = this;
  return new cljs.core.NodeSeq(meta, this__9582.nodes, this__9582.i, this__9582.s, this__9582.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9583 = this;
  return this__9583.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9584 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9584.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9591 = nodes.length;
      var j__9592 = i;
      while(true) {
        if(j__9592 < len__9591) {
          if(!(nodes[j__9592] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9592, null, null)
          }else {
            var temp__3971__auto____9593 = nodes[j__9592 + 1];
            if(cljs.core.truth_(temp__3971__auto____9593)) {
              var node__9594 = temp__3971__auto____9593;
              var temp__3971__auto____9595 = node__9594.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9595)) {
                var node_seq__9596 = temp__3971__auto____9595;
                return new cljs.core.NodeSeq(null, nodes, j__9592 + 2, node_seq__9596, null)
              }else {
                var G__9597 = j__9592 + 2;
                j__9592 = G__9597;
                continue
              }
            }else {
              var G__9598 = j__9592 + 2;
              j__9592 = G__9598;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9599 = this;
  var h__2247__auto____9600 = this__9599.__hash;
  if(!(h__2247__auto____9600 == null)) {
    return h__2247__auto____9600
  }else {
    var h__2247__auto____9601 = cljs.core.hash_coll.call(null, coll);
    this__9599.__hash = h__2247__auto____9601;
    return h__2247__auto____9601
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9602 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9603 = this;
  var this__9604 = this;
  return cljs.core.pr_str.call(null, this__9604)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9605 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9606 = this;
  return cljs.core.first.call(null, this__9606.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9607 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9607.nodes, this__9607.i, cljs.core.next.call(null, this__9607.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9608 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9609 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9609.nodes, this__9609.i, this__9609.s, this__9609.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9610 = this;
  return this__9610.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9611 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9611.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9618 = nodes.length;
      var j__9619 = i;
      while(true) {
        if(j__9619 < len__9618) {
          var temp__3971__auto____9620 = nodes[j__9619];
          if(cljs.core.truth_(temp__3971__auto____9620)) {
            var nj__9621 = temp__3971__auto____9620;
            var temp__3971__auto____9622 = nj__9621.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9622)) {
              var ns__9623 = temp__3971__auto____9622;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9619 + 1, ns__9623, null)
            }else {
              var G__9624 = j__9619 + 1;
              j__9619 = G__9624;
              continue
            }
          }else {
            var G__9625 = j__9619 + 1;
            j__9619 = G__9625;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9628 = this;
  return new cljs.core.TransientHashMap({}, this__9628.root, this__9628.cnt, this__9628.has_nil_QMARK_, this__9628.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9629 = this;
  var h__2247__auto____9630 = this__9629.__hash;
  if(!(h__2247__auto____9630 == null)) {
    return h__2247__auto____9630
  }else {
    var h__2247__auto____9631 = cljs.core.hash_imap.call(null, coll);
    this__9629.__hash = h__2247__auto____9631;
    return h__2247__auto____9631
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9632 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9633 = this;
  if(k == null) {
    if(this__9633.has_nil_QMARK_) {
      return this__9633.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9633.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9633.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9634 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9635 = this__9634.has_nil_QMARK_;
      if(and__3822__auto____9635) {
        return v === this__9634.nil_val
      }else {
        return and__3822__auto____9635
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9634.meta, this__9634.has_nil_QMARK_ ? this__9634.cnt : this__9634.cnt + 1, this__9634.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9636 = new cljs.core.Box(false);
    var new_root__9637 = (this__9634.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9634.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9636);
    if(new_root__9637 === this__9634.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9634.meta, added_leaf_QMARK___9636.val ? this__9634.cnt + 1 : this__9634.cnt, new_root__9637, this__9634.has_nil_QMARK_, this__9634.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9638 = this;
  if(k == null) {
    return this__9638.has_nil_QMARK_
  }else {
    if(this__9638.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9638.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9661 = null;
  var G__9661__2 = function(this_sym9639, k) {
    var this__9641 = this;
    var this_sym9639__9642 = this;
    var coll__9643 = this_sym9639__9642;
    return coll__9643.cljs$core$ILookup$_lookup$arity$2(coll__9643, k)
  };
  var G__9661__3 = function(this_sym9640, k, not_found) {
    var this__9641 = this;
    var this_sym9640__9644 = this;
    var coll__9645 = this_sym9640__9644;
    return coll__9645.cljs$core$ILookup$_lookup$arity$3(coll__9645, k, not_found)
  };
  G__9661 = function(this_sym9640, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9661__2.call(this, this_sym9640, k);
      case 3:
        return G__9661__3.call(this, this_sym9640, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9661
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9626, args9627) {
  var this__9646 = this;
  return this_sym9626.call.apply(this_sym9626, [this_sym9626].concat(args9627.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9647 = this;
  var init__9648 = this__9647.has_nil_QMARK_ ? f.call(null, init, null, this__9647.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9648)) {
    return cljs.core.deref.call(null, init__9648)
  }else {
    if(!(this__9647.root == null)) {
      return this__9647.root.kv_reduce(f, init__9648)
    }else {
      if("\ufdd0'else") {
        return init__9648
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9649 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9650 = this;
  var this__9651 = this;
  return cljs.core.pr_str.call(null, this__9651)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9652 = this;
  if(this__9652.cnt > 0) {
    var s__9653 = !(this__9652.root == null) ? this__9652.root.inode_seq() : null;
    if(this__9652.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9652.nil_val], true), s__9653)
    }else {
      return s__9653
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9654 = this;
  return this__9654.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9655 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9656 = this;
  return new cljs.core.PersistentHashMap(meta, this__9656.cnt, this__9656.root, this__9656.has_nil_QMARK_, this__9656.nil_val, this__9656.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9657 = this;
  return this__9657.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9658 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9658.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9659 = this;
  if(k == null) {
    if(this__9659.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9659.meta, this__9659.cnt - 1, this__9659.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9659.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9660 = this__9659.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9660 === this__9659.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9659.meta, this__9659.cnt - 1, new_root__9660, this__9659.has_nil_QMARK_, this__9659.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9662 = ks.length;
  var i__9663 = 0;
  var out__9664 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9663 < len__9662) {
      var G__9665 = i__9663 + 1;
      var G__9666 = cljs.core.assoc_BANG_.call(null, out__9664, ks[i__9663], vs[i__9663]);
      i__9663 = G__9665;
      out__9664 = G__9666;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9664)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9667 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9668 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9669 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9670 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9671 = this;
  if(k == null) {
    if(this__9671.has_nil_QMARK_) {
      return this__9671.nil_val
    }else {
      return null
    }
  }else {
    if(this__9671.root == null) {
      return null
    }else {
      return this__9671.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9672 = this;
  if(k == null) {
    if(this__9672.has_nil_QMARK_) {
      return this__9672.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9672.root == null) {
      return not_found
    }else {
      return this__9672.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9673 = this;
  if(this__9673.edit) {
    return this__9673.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9674 = this;
  var tcoll__9675 = this;
  if(this__9674.edit) {
    if(function() {
      var G__9676__9677 = o;
      if(G__9676__9677) {
        if(function() {
          var or__3824__auto____9678 = G__9676__9677.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9678) {
            return or__3824__auto____9678
          }else {
            return G__9676__9677.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9676__9677.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9676__9677)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9676__9677)
      }
    }()) {
      return tcoll__9675.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9679 = cljs.core.seq.call(null, o);
      var tcoll__9680 = tcoll__9675;
      while(true) {
        var temp__3971__auto____9681 = cljs.core.first.call(null, es__9679);
        if(cljs.core.truth_(temp__3971__auto____9681)) {
          var e__9682 = temp__3971__auto____9681;
          var G__9693 = cljs.core.next.call(null, es__9679);
          var G__9694 = tcoll__9680.assoc_BANG_(cljs.core.key.call(null, e__9682), cljs.core.val.call(null, e__9682));
          es__9679 = G__9693;
          tcoll__9680 = G__9694;
          continue
        }else {
          return tcoll__9680
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9683 = this;
  var tcoll__9684 = this;
  if(this__9683.edit) {
    if(k == null) {
      if(this__9683.nil_val === v) {
      }else {
        this__9683.nil_val = v
      }
      if(this__9683.has_nil_QMARK_) {
      }else {
        this__9683.count = this__9683.count + 1;
        this__9683.has_nil_QMARK_ = true
      }
      return tcoll__9684
    }else {
      var added_leaf_QMARK___9685 = new cljs.core.Box(false);
      var node__9686 = (this__9683.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9683.root).inode_assoc_BANG_(this__9683.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9685);
      if(node__9686 === this__9683.root) {
      }else {
        this__9683.root = node__9686
      }
      if(added_leaf_QMARK___9685.val) {
        this__9683.count = this__9683.count + 1
      }else {
      }
      return tcoll__9684
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9687 = this;
  var tcoll__9688 = this;
  if(this__9687.edit) {
    if(k == null) {
      if(this__9687.has_nil_QMARK_) {
        this__9687.has_nil_QMARK_ = false;
        this__9687.nil_val = null;
        this__9687.count = this__9687.count - 1;
        return tcoll__9688
      }else {
        return tcoll__9688
      }
    }else {
      if(this__9687.root == null) {
        return tcoll__9688
      }else {
        var removed_leaf_QMARK___9689 = new cljs.core.Box(false);
        var node__9690 = this__9687.root.inode_without_BANG_(this__9687.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9689);
        if(node__9690 === this__9687.root) {
        }else {
          this__9687.root = node__9690
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9689[0])) {
          this__9687.count = this__9687.count - 1
        }else {
        }
        return tcoll__9688
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9691 = this;
  var tcoll__9692 = this;
  if(this__9691.edit) {
    this__9691.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9691.count, this__9691.root, this__9691.has_nil_QMARK_, this__9691.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9697 = node;
  var stack__9698 = stack;
  while(true) {
    if(!(t__9697 == null)) {
      var G__9699 = ascending_QMARK_ ? t__9697.left : t__9697.right;
      var G__9700 = cljs.core.conj.call(null, stack__9698, t__9697);
      t__9697 = G__9699;
      stack__9698 = G__9700;
      continue
    }else {
      return stack__9698
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9701 = this;
  var h__2247__auto____9702 = this__9701.__hash;
  if(!(h__2247__auto____9702 == null)) {
    return h__2247__auto____9702
  }else {
    var h__2247__auto____9703 = cljs.core.hash_coll.call(null, coll);
    this__9701.__hash = h__2247__auto____9703;
    return h__2247__auto____9703
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9704 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9705 = this;
  var this__9706 = this;
  return cljs.core.pr_str.call(null, this__9706)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9707 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9708 = this;
  if(this__9708.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9708.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9709 = this;
  return cljs.core.peek.call(null, this__9709.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9710 = this;
  var t__9711 = cljs.core.first.call(null, this__9710.stack);
  var next_stack__9712 = cljs.core.tree_map_seq_push.call(null, this__9710.ascending_QMARK_ ? t__9711.right : t__9711.left, cljs.core.next.call(null, this__9710.stack), this__9710.ascending_QMARK_);
  if(!(next_stack__9712 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9712, this__9710.ascending_QMARK_, this__9710.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9713 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9714 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9714.stack, this__9714.ascending_QMARK_, this__9714.cnt, this__9714.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9715 = this;
  return this__9715.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9717 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9717) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9717
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9719 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9719) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9719
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9723 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9723)) {
    return cljs.core.deref.call(null, init__9723)
  }else {
    var init__9724 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9723) : init__9723;
    if(cljs.core.reduced_QMARK_.call(null, init__9724)) {
      return cljs.core.deref.call(null, init__9724)
    }else {
      var init__9725 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9724) : init__9724;
      if(cljs.core.reduced_QMARK_.call(null, init__9725)) {
        return cljs.core.deref.call(null, init__9725)
      }else {
        return init__9725
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9728 = this;
  var h__2247__auto____9729 = this__9728.__hash;
  if(!(h__2247__auto____9729 == null)) {
    return h__2247__auto____9729
  }else {
    var h__2247__auto____9730 = cljs.core.hash_coll.call(null, coll);
    this__9728.__hash = h__2247__auto____9730;
    return h__2247__auto____9730
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9731 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9732 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9733 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9733.key, this__9733.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9781 = null;
  var G__9781__2 = function(this_sym9734, k) {
    var this__9736 = this;
    var this_sym9734__9737 = this;
    var node__9738 = this_sym9734__9737;
    return node__9738.cljs$core$ILookup$_lookup$arity$2(node__9738, k)
  };
  var G__9781__3 = function(this_sym9735, k, not_found) {
    var this__9736 = this;
    var this_sym9735__9739 = this;
    var node__9740 = this_sym9735__9739;
    return node__9740.cljs$core$ILookup$_lookup$arity$3(node__9740, k, not_found)
  };
  G__9781 = function(this_sym9735, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9781__2.call(this, this_sym9735, k);
      case 3:
        return G__9781__3.call(this, this_sym9735, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9781
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9726, args9727) {
  var this__9741 = this;
  return this_sym9726.call.apply(this_sym9726, [this_sym9726].concat(args9727.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9742 = this;
  return cljs.core.PersistentVector.fromArray([this__9742.key, this__9742.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9743 = this;
  return this__9743.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9744 = this;
  return this__9744.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9745 = this;
  var node__9746 = this;
  return ins.balance_right(node__9746)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9747 = this;
  var node__9748 = this;
  return new cljs.core.RedNode(this__9747.key, this__9747.val, this__9747.left, this__9747.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9749 = this;
  var node__9750 = this;
  return cljs.core.balance_right_del.call(null, this__9749.key, this__9749.val, this__9749.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9751 = this;
  var node__9752 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9753 = this;
  var node__9754 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9754, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9755 = this;
  var node__9756 = this;
  return cljs.core.balance_left_del.call(null, this__9755.key, this__9755.val, del, this__9755.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9757 = this;
  var node__9758 = this;
  return ins.balance_left(node__9758)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9759 = this;
  var node__9760 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9760, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9782 = null;
  var G__9782__0 = function() {
    var this__9761 = this;
    var this__9763 = this;
    return cljs.core.pr_str.call(null, this__9763)
  };
  G__9782 = function() {
    switch(arguments.length) {
      case 0:
        return G__9782__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9782
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9764 = this;
  var node__9765 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9765, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9766 = this;
  var node__9767 = this;
  return node__9767
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9768 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9769 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9770 = this;
  return cljs.core.list.call(null, this__9770.key, this__9770.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9771 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9772 = this;
  return this__9772.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9773 = this;
  return cljs.core.PersistentVector.fromArray([this__9773.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9774 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9774.key, this__9774.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9775 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9776 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9776.key, this__9776.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9777 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9778 = this;
  if(n === 0) {
    return this__9778.key
  }else {
    if(n === 1) {
      return this__9778.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9779 = this;
  if(n === 0) {
    return this__9779.key
  }else {
    if(n === 1) {
      return this__9779.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9780 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9785 = this;
  var h__2247__auto____9786 = this__9785.__hash;
  if(!(h__2247__auto____9786 == null)) {
    return h__2247__auto____9786
  }else {
    var h__2247__auto____9787 = cljs.core.hash_coll.call(null, coll);
    this__9785.__hash = h__2247__auto____9787;
    return h__2247__auto____9787
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9788 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9789 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9790 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9790.key, this__9790.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9838 = null;
  var G__9838__2 = function(this_sym9791, k) {
    var this__9793 = this;
    var this_sym9791__9794 = this;
    var node__9795 = this_sym9791__9794;
    return node__9795.cljs$core$ILookup$_lookup$arity$2(node__9795, k)
  };
  var G__9838__3 = function(this_sym9792, k, not_found) {
    var this__9793 = this;
    var this_sym9792__9796 = this;
    var node__9797 = this_sym9792__9796;
    return node__9797.cljs$core$ILookup$_lookup$arity$3(node__9797, k, not_found)
  };
  G__9838 = function(this_sym9792, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9838__2.call(this, this_sym9792, k);
      case 3:
        return G__9838__3.call(this, this_sym9792, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9838
}();
cljs.core.RedNode.prototype.apply = function(this_sym9783, args9784) {
  var this__9798 = this;
  return this_sym9783.call.apply(this_sym9783, [this_sym9783].concat(args9784.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9799 = this;
  return cljs.core.PersistentVector.fromArray([this__9799.key, this__9799.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9800 = this;
  return this__9800.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9801 = this;
  return this__9801.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9802 = this;
  var node__9803 = this;
  return new cljs.core.RedNode(this__9802.key, this__9802.val, this__9802.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9804 = this;
  var node__9805 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9806 = this;
  var node__9807 = this;
  return new cljs.core.RedNode(this__9806.key, this__9806.val, this__9806.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9808 = this;
  var node__9809 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9810 = this;
  var node__9811 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9811, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9812 = this;
  var node__9813 = this;
  return new cljs.core.RedNode(this__9812.key, this__9812.val, del, this__9812.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9814 = this;
  var node__9815 = this;
  return new cljs.core.RedNode(this__9814.key, this__9814.val, ins, this__9814.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9816 = this;
  var node__9817 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9816.left)) {
    return new cljs.core.RedNode(this__9816.key, this__9816.val, this__9816.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9816.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9816.right)) {
      return new cljs.core.RedNode(this__9816.right.key, this__9816.right.val, new cljs.core.BlackNode(this__9816.key, this__9816.val, this__9816.left, this__9816.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9816.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9817, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9839 = null;
  var G__9839__0 = function() {
    var this__9818 = this;
    var this__9820 = this;
    return cljs.core.pr_str.call(null, this__9820)
  };
  G__9839 = function() {
    switch(arguments.length) {
      case 0:
        return G__9839__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9839
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9821 = this;
  var node__9822 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9821.right)) {
    return new cljs.core.RedNode(this__9821.key, this__9821.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9821.left, null), this__9821.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9821.left)) {
      return new cljs.core.RedNode(this__9821.left.key, this__9821.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9821.left.left, null), new cljs.core.BlackNode(this__9821.key, this__9821.val, this__9821.left.right, this__9821.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9822, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9823 = this;
  var node__9824 = this;
  return new cljs.core.BlackNode(this__9823.key, this__9823.val, this__9823.left, this__9823.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9825 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9826 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9827 = this;
  return cljs.core.list.call(null, this__9827.key, this__9827.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9828 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9829 = this;
  return this__9829.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9830 = this;
  return cljs.core.PersistentVector.fromArray([this__9830.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9831 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9831.key, this__9831.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9832 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9833 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9833.key, this__9833.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9834 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9835 = this;
  if(n === 0) {
    return this__9835.key
  }else {
    if(n === 1) {
      return this__9835.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9836 = this;
  if(n === 0) {
    return this__9836.key
  }else {
    if(n === 1) {
      return this__9836.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9837 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9843 = comp.call(null, k, tree.key);
    if(c__9843 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9843 < 0) {
        var ins__9844 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9844 == null)) {
          return tree.add_left(ins__9844)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9845 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9845 == null)) {
            return tree.add_right(ins__9845)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9848 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9848)) {
            return new cljs.core.RedNode(app__9848.key, app__9848.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9848.left, null), new cljs.core.RedNode(right.key, right.val, app__9848.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9848, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9849 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9849)) {
              return new cljs.core.RedNode(app__9849.key, app__9849.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9849.left, null), new cljs.core.BlackNode(right.key, right.val, app__9849.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9849, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9855 = comp.call(null, k, tree.key);
    if(c__9855 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9855 < 0) {
        var del__9856 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9857 = !(del__9856 == null);
          if(or__3824__auto____9857) {
            return or__3824__auto____9857
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9856, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9856, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9858 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9859 = !(del__9858 == null);
            if(or__3824__auto____9859) {
              return or__3824__auto____9859
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9858)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9858, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9862 = tree.key;
  var c__9863 = comp.call(null, k, tk__9862);
  if(c__9863 === 0) {
    return tree.replace(tk__9862, v, tree.left, tree.right)
  }else {
    if(c__9863 < 0) {
      return tree.replace(tk__9862, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9862, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9866 = this;
  var h__2247__auto____9867 = this__9866.__hash;
  if(!(h__2247__auto____9867 == null)) {
    return h__2247__auto____9867
  }else {
    var h__2247__auto____9868 = cljs.core.hash_imap.call(null, coll);
    this__9866.__hash = h__2247__auto____9868;
    return h__2247__auto____9868
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9869 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9870 = this;
  var n__9871 = coll.entry_at(k);
  if(!(n__9871 == null)) {
    return n__9871.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9872 = this;
  var found__9873 = [null];
  var t__9874 = cljs.core.tree_map_add.call(null, this__9872.comp, this__9872.tree, k, v, found__9873);
  if(t__9874 == null) {
    var found_node__9875 = cljs.core.nth.call(null, found__9873, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9875.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9872.comp, cljs.core.tree_map_replace.call(null, this__9872.comp, this__9872.tree, k, v), this__9872.cnt, this__9872.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9872.comp, t__9874.blacken(), this__9872.cnt + 1, this__9872.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9876 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9910 = null;
  var G__9910__2 = function(this_sym9877, k) {
    var this__9879 = this;
    var this_sym9877__9880 = this;
    var coll__9881 = this_sym9877__9880;
    return coll__9881.cljs$core$ILookup$_lookup$arity$2(coll__9881, k)
  };
  var G__9910__3 = function(this_sym9878, k, not_found) {
    var this__9879 = this;
    var this_sym9878__9882 = this;
    var coll__9883 = this_sym9878__9882;
    return coll__9883.cljs$core$ILookup$_lookup$arity$3(coll__9883, k, not_found)
  };
  G__9910 = function(this_sym9878, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9910__2.call(this, this_sym9878, k);
      case 3:
        return G__9910__3.call(this, this_sym9878, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9910
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9864, args9865) {
  var this__9884 = this;
  return this_sym9864.call.apply(this_sym9864, [this_sym9864].concat(args9865.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9885 = this;
  if(!(this__9885.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9885.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9886 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9887 = this;
  if(this__9887.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9887.tree, false, this__9887.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9888 = this;
  var this__9889 = this;
  return cljs.core.pr_str.call(null, this__9889)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9890 = this;
  var coll__9891 = this;
  var t__9892 = this__9890.tree;
  while(true) {
    if(!(t__9892 == null)) {
      var c__9893 = this__9890.comp.call(null, k, t__9892.key);
      if(c__9893 === 0) {
        return t__9892
      }else {
        if(c__9893 < 0) {
          var G__9911 = t__9892.left;
          t__9892 = G__9911;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9912 = t__9892.right;
            t__9892 = G__9912;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9894 = this;
  if(this__9894.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9894.tree, ascending_QMARK_, this__9894.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9895 = this;
  if(this__9895.cnt > 0) {
    var stack__9896 = null;
    var t__9897 = this__9895.tree;
    while(true) {
      if(!(t__9897 == null)) {
        var c__9898 = this__9895.comp.call(null, k, t__9897.key);
        if(c__9898 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9896, t__9897), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9898 < 0) {
              var G__9913 = cljs.core.conj.call(null, stack__9896, t__9897);
              var G__9914 = t__9897.left;
              stack__9896 = G__9913;
              t__9897 = G__9914;
              continue
            }else {
              var G__9915 = stack__9896;
              var G__9916 = t__9897.right;
              stack__9896 = G__9915;
              t__9897 = G__9916;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9898 > 0) {
                var G__9917 = cljs.core.conj.call(null, stack__9896, t__9897);
                var G__9918 = t__9897.right;
                stack__9896 = G__9917;
                t__9897 = G__9918;
                continue
              }else {
                var G__9919 = stack__9896;
                var G__9920 = t__9897.left;
                stack__9896 = G__9919;
                t__9897 = G__9920;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9896 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9896, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9899 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9900 = this;
  return this__9900.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9901 = this;
  if(this__9901.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9901.tree, true, this__9901.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9902 = this;
  return this__9902.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9903 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9904 = this;
  return new cljs.core.PersistentTreeMap(this__9904.comp, this__9904.tree, this__9904.cnt, meta, this__9904.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9905 = this;
  return this__9905.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9906 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9906.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9907 = this;
  var found__9908 = [null];
  var t__9909 = cljs.core.tree_map_remove.call(null, this__9907.comp, this__9907.tree, k, found__9908);
  if(t__9909 == null) {
    if(cljs.core.nth.call(null, found__9908, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9907.comp, null, 0, this__9907.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9907.comp, t__9909.blacken(), this__9907.cnt - 1, this__9907.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9923 = cljs.core.seq.call(null, keyvals);
    var out__9924 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9923) {
        var G__9925 = cljs.core.nnext.call(null, in__9923);
        var G__9926 = cljs.core.assoc_BANG_.call(null, out__9924, cljs.core.first.call(null, in__9923), cljs.core.second.call(null, in__9923));
        in__9923 = G__9925;
        out__9924 = G__9926;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9924)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9927) {
    var keyvals = cljs.core.seq(arglist__9927);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9928) {
    var keyvals = cljs.core.seq(arglist__9928);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9932 = [];
    var obj__9933 = {};
    var kvs__9934 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9934) {
        ks__9932.push(cljs.core.first.call(null, kvs__9934));
        obj__9933[cljs.core.first.call(null, kvs__9934)] = cljs.core.second.call(null, kvs__9934);
        var G__9935 = cljs.core.nnext.call(null, kvs__9934);
        kvs__9934 = G__9935;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9932, obj__9933)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9936) {
    var keyvals = cljs.core.seq(arglist__9936);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9939 = cljs.core.seq.call(null, keyvals);
    var out__9940 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9939) {
        var G__9941 = cljs.core.nnext.call(null, in__9939);
        var G__9942 = cljs.core.assoc.call(null, out__9940, cljs.core.first.call(null, in__9939), cljs.core.second.call(null, in__9939));
        in__9939 = G__9941;
        out__9940 = G__9942;
        continue
      }else {
        return out__9940
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9943) {
    var keyvals = cljs.core.seq(arglist__9943);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9946 = cljs.core.seq.call(null, keyvals);
    var out__9947 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9946) {
        var G__9948 = cljs.core.nnext.call(null, in__9946);
        var G__9949 = cljs.core.assoc.call(null, out__9947, cljs.core.first.call(null, in__9946), cljs.core.second.call(null, in__9946));
        in__9946 = G__9948;
        out__9947 = G__9949;
        continue
      }else {
        return out__9947
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9950) {
    var comparator = cljs.core.first(arglist__9950);
    var keyvals = cljs.core.rest(arglist__9950);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9951_SHARP_, p2__9952_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9954 = p1__9951_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9954)) {
            return or__3824__auto____9954
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9952_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9955) {
    var maps = cljs.core.seq(arglist__9955);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9963 = function(m, e) {
        var k__9961 = cljs.core.first.call(null, e);
        var v__9962 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9961)) {
          return cljs.core.assoc.call(null, m, k__9961, f.call(null, cljs.core._lookup.call(null, m, k__9961, null), v__9962))
        }else {
          return cljs.core.assoc.call(null, m, k__9961, v__9962)
        }
      };
      var merge2__9965 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9963, function() {
          var or__3824__auto____9964 = m1;
          if(cljs.core.truth_(or__3824__auto____9964)) {
            return or__3824__auto____9964
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9965, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9966) {
    var f = cljs.core.first(arglist__9966);
    var maps = cljs.core.rest(arglist__9966);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9971 = cljs.core.ObjMap.EMPTY;
  var keys__9972 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9972) {
      var key__9973 = cljs.core.first.call(null, keys__9972);
      var entry__9974 = cljs.core._lookup.call(null, map, key__9973, "\ufdd0'cljs.core/not-found");
      var G__9975 = cljs.core.not_EQ_.call(null, entry__9974, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9971, key__9973, entry__9974) : ret__9971;
      var G__9976 = cljs.core.next.call(null, keys__9972);
      ret__9971 = G__9975;
      keys__9972 = G__9976;
      continue
    }else {
      return ret__9971
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9980 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9980.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9981 = this;
  var h__2247__auto____9982 = this__9981.__hash;
  if(!(h__2247__auto____9982 == null)) {
    return h__2247__auto____9982
  }else {
    var h__2247__auto____9983 = cljs.core.hash_iset.call(null, coll);
    this__9981.__hash = h__2247__auto____9983;
    return h__2247__auto____9983
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9984 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9985 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9985.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__10006 = null;
  var G__10006__2 = function(this_sym9986, k) {
    var this__9988 = this;
    var this_sym9986__9989 = this;
    var coll__9990 = this_sym9986__9989;
    return coll__9990.cljs$core$ILookup$_lookup$arity$2(coll__9990, k)
  };
  var G__10006__3 = function(this_sym9987, k, not_found) {
    var this__9988 = this;
    var this_sym9987__9991 = this;
    var coll__9992 = this_sym9987__9991;
    return coll__9992.cljs$core$ILookup$_lookup$arity$3(coll__9992, k, not_found)
  };
  G__10006 = function(this_sym9987, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10006__2.call(this, this_sym9987, k);
      case 3:
        return G__10006__3.call(this, this_sym9987, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10006
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9978, args9979) {
  var this__9993 = this;
  return this_sym9978.call.apply(this_sym9978, [this_sym9978].concat(args9979.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9994 = this;
  return new cljs.core.PersistentHashSet(this__9994.meta, cljs.core.assoc.call(null, this__9994.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9995 = this;
  var this__9996 = this;
  return cljs.core.pr_str.call(null, this__9996)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9997 = this;
  return cljs.core.keys.call(null, this__9997.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9998 = this;
  return new cljs.core.PersistentHashSet(this__9998.meta, cljs.core.dissoc.call(null, this__9998.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9999 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10000 = this;
  var and__3822__auto____10001 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10001) {
    var and__3822__auto____10002 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10002) {
      return cljs.core.every_QMARK_.call(null, function(p1__9977_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9977_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10002
    }
  }else {
    return and__3822__auto____10001
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10003 = this;
  return new cljs.core.PersistentHashSet(meta, this__10003.hash_map, this__10003.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10004 = this;
  return this__10004.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10005 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__10005.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__10007 = cljs.core.count.call(null, items);
  var i__10008 = 0;
  var out__10009 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__10008 < len__10007) {
      var G__10010 = i__10008 + 1;
      var G__10011 = cljs.core.conj_BANG_.call(null, out__10009, items[i__10008]);
      i__10008 = G__10010;
      out__10009 = G__10011;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10009)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__10029 = null;
  var G__10029__2 = function(this_sym10015, k) {
    var this__10017 = this;
    var this_sym10015__10018 = this;
    var tcoll__10019 = this_sym10015__10018;
    if(cljs.core._lookup.call(null, this__10017.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__10029__3 = function(this_sym10016, k, not_found) {
    var this__10017 = this;
    var this_sym10016__10020 = this;
    var tcoll__10021 = this_sym10016__10020;
    if(cljs.core._lookup.call(null, this__10017.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__10029 = function(this_sym10016, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10029__2.call(this, this_sym10016, k);
      case 3:
        return G__10029__3.call(this, this_sym10016, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10029
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym10013, args10014) {
  var this__10022 = this;
  return this_sym10013.call.apply(this_sym10013, [this_sym10013].concat(args10014.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__10023 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__10024 = this;
  if(cljs.core._lookup.call(null, this__10024.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10025 = this;
  return cljs.core.count.call(null, this__10025.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__10026 = this;
  this__10026.transient_map = cljs.core.dissoc_BANG_.call(null, this__10026.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10027 = this;
  this__10027.transient_map = cljs.core.assoc_BANG_.call(null, this__10027.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10028 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__10028.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10032 = this;
  var h__2247__auto____10033 = this__10032.__hash;
  if(!(h__2247__auto____10033 == null)) {
    return h__2247__auto____10033
  }else {
    var h__2247__auto____10034 = cljs.core.hash_iset.call(null, coll);
    this__10032.__hash = h__2247__auto____10034;
    return h__2247__auto____10034
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10035 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10036 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10036.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__10062 = null;
  var G__10062__2 = function(this_sym10037, k) {
    var this__10039 = this;
    var this_sym10037__10040 = this;
    var coll__10041 = this_sym10037__10040;
    return coll__10041.cljs$core$ILookup$_lookup$arity$2(coll__10041, k)
  };
  var G__10062__3 = function(this_sym10038, k, not_found) {
    var this__10039 = this;
    var this_sym10038__10042 = this;
    var coll__10043 = this_sym10038__10042;
    return coll__10043.cljs$core$ILookup$_lookup$arity$3(coll__10043, k, not_found)
  };
  G__10062 = function(this_sym10038, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10062__2.call(this, this_sym10038, k);
      case 3:
        return G__10062__3.call(this, this_sym10038, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10062
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym10030, args10031) {
  var this__10044 = this;
  return this_sym10030.call.apply(this_sym10030, [this_sym10030].concat(args10031.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10045 = this;
  return new cljs.core.PersistentTreeSet(this__10045.meta, cljs.core.assoc.call(null, this__10045.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10046 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__10046.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__10047 = this;
  var this__10048 = this;
  return cljs.core.pr_str.call(null, this__10048)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10049 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__10049.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10050 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__10050.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10051 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10052 = this;
  return cljs.core._comparator.call(null, this__10052.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10053 = this;
  return cljs.core.keys.call(null, this__10053.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10054 = this;
  return new cljs.core.PersistentTreeSet(this__10054.meta, cljs.core.dissoc.call(null, this__10054.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10055 = this;
  return cljs.core.count.call(null, this__10055.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10056 = this;
  var and__3822__auto____10057 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10057) {
    var and__3822__auto____10058 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10058) {
      return cljs.core.every_QMARK_.call(null, function(p1__10012_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10012_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10058
    }
  }else {
    return and__3822__auto____10057
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10059 = this;
  return new cljs.core.PersistentTreeSet(meta, this__10059.tree_map, this__10059.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10060 = this;
  return this__10060.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10061 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__10061.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__10067__delegate = function(keys) {
      var in__10065 = cljs.core.seq.call(null, keys);
      var out__10066 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__10065)) {
          var G__10068 = cljs.core.next.call(null, in__10065);
          var G__10069 = cljs.core.conj_BANG_.call(null, out__10066, cljs.core.first.call(null, in__10065));
          in__10065 = G__10068;
          out__10066 = G__10069;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__10066)
        }
        break
      }
    };
    var G__10067 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10067__delegate.call(this, keys)
    };
    G__10067.cljs$lang$maxFixedArity = 0;
    G__10067.cljs$lang$applyTo = function(arglist__10070) {
      var keys = cljs.core.seq(arglist__10070);
      return G__10067__delegate(keys)
    };
    G__10067.cljs$lang$arity$variadic = G__10067__delegate;
    return G__10067
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__10071) {
    var keys = cljs.core.seq(arglist__10071);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__10073) {
    var comparator = cljs.core.first(arglist__10073);
    var keys = cljs.core.rest(arglist__10073);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__10079 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____10080 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____10080)) {
        var e__10081 = temp__3971__auto____10080;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__10081))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__10079, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__10072_SHARP_) {
      var temp__3971__auto____10082 = cljs.core.find.call(null, smap, p1__10072_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____10082)) {
        var e__10083 = temp__3971__auto____10082;
        return cljs.core.second.call(null, e__10083)
      }else {
        return p1__10072_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__10113 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__10106, seen) {
        while(true) {
          var vec__10107__10108 = p__10106;
          var f__10109 = cljs.core.nth.call(null, vec__10107__10108, 0, null);
          var xs__10110 = vec__10107__10108;
          var temp__3974__auto____10111 = cljs.core.seq.call(null, xs__10110);
          if(temp__3974__auto____10111) {
            var s__10112 = temp__3974__auto____10111;
            if(cljs.core.contains_QMARK_.call(null, seen, f__10109)) {
              var G__10114 = cljs.core.rest.call(null, s__10112);
              var G__10115 = seen;
              p__10106 = G__10114;
              seen = G__10115;
              continue
            }else {
              return cljs.core.cons.call(null, f__10109, step.call(null, cljs.core.rest.call(null, s__10112), cljs.core.conj.call(null, seen, f__10109)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__10113.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__10118 = cljs.core.PersistentVector.EMPTY;
  var s__10119 = s;
  while(true) {
    if(cljs.core.next.call(null, s__10119)) {
      var G__10120 = cljs.core.conj.call(null, ret__10118, cljs.core.first.call(null, s__10119));
      var G__10121 = cljs.core.next.call(null, s__10119);
      ret__10118 = G__10120;
      s__10119 = G__10121;
      continue
    }else {
      return cljs.core.seq.call(null, ret__10118)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____10124 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____10124) {
        return or__3824__auto____10124
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__10125 = x.lastIndexOf("/");
      if(i__10125 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__10125 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____10128 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____10128) {
      return or__3824__auto____10128
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__10129 = x.lastIndexOf("/");
    if(i__10129 > -1) {
      return cljs.core.subs.call(null, x, 2, i__10129)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__10136 = cljs.core.ObjMap.EMPTY;
  var ks__10137 = cljs.core.seq.call(null, keys);
  var vs__10138 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____10139 = ks__10137;
      if(and__3822__auto____10139) {
        return vs__10138
      }else {
        return and__3822__auto____10139
      }
    }()) {
      var G__10140 = cljs.core.assoc.call(null, map__10136, cljs.core.first.call(null, ks__10137), cljs.core.first.call(null, vs__10138));
      var G__10141 = cljs.core.next.call(null, ks__10137);
      var G__10142 = cljs.core.next.call(null, vs__10138);
      map__10136 = G__10140;
      ks__10137 = G__10141;
      vs__10138 = G__10142;
      continue
    }else {
      return map__10136
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__10145__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10130_SHARP_, p2__10131_SHARP_) {
        return max_key.call(null, k, p1__10130_SHARP_, p2__10131_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__10145 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10145__delegate.call(this, k, x, y, more)
    };
    G__10145.cljs$lang$maxFixedArity = 3;
    G__10145.cljs$lang$applyTo = function(arglist__10146) {
      var k = cljs.core.first(arglist__10146);
      var x = cljs.core.first(cljs.core.next(arglist__10146));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10146)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10146)));
      return G__10145__delegate(k, x, y, more)
    };
    G__10145.cljs$lang$arity$variadic = G__10145__delegate;
    return G__10145
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__10147__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10143_SHARP_, p2__10144_SHARP_) {
        return min_key.call(null, k, p1__10143_SHARP_, p2__10144_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__10147 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10147__delegate.call(this, k, x, y, more)
    };
    G__10147.cljs$lang$maxFixedArity = 3;
    G__10147.cljs$lang$applyTo = function(arglist__10148) {
      var k = cljs.core.first(arglist__10148);
      var x = cljs.core.first(cljs.core.next(arglist__10148));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10148)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10148)));
      return G__10147__delegate(k, x, y, more)
    };
    G__10147.cljs$lang$arity$variadic = G__10147__delegate;
    return G__10147
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10151 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10151) {
        var s__10152 = temp__3974__auto____10151;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__10152), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__10152)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10155 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10155) {
      var s__10156 = temp__3974__auto____10155;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10156)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10156), take_while.call(null, pred, cljs.core.rest.call(null, s__10156)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__10158 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10158.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10170 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10171 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10171)) {
        var vec__10172__10173 = temp__3974__auto____10171;
        var e__10174 = cljs.core.nth.call(null, vec__10172__10173, 0, null);
        var s__10175 = vec__10172__10173;
        if(cljs.core.truth_(include__10170.call(null, e__10174))) {
          return s__10175
        }else {
          return cljs.core.next.call(null, s__10175)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10170, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10176 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10176)) {
      var vec__10177__10178 = temp__3974__auto____10176;
      var e__10179 = cljs.core.nth.call(null, vec__10177__10178, 0, null);
      var s__10180 = vec__10177__10178;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10179)) ? s__10180 : cljs.core.next.call(null, s__10180))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__10192 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10193 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10193)) {
        var vec__10194__10195 = temp__3974__auto____10193;
        var e__10196 = cljs.core.nth.call(null, vec__10194__10195, 0, null);
        var s__10197 = vec__10194__10195;
        if(cljs.core.truth_(include__10192.call(null, e__10196))) {
          return s__10197
        }else {
          return cljs.core.next.call(null, s__10197)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10192, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10198 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10198)) {
      var vec__10199__10200 = temp__3974__auto____10198;
      var e__10201 = cljs.core.nth.call(null, vec__10199__10200, 0, null);
      var s__10202 = vec__10199__10200;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10201)) ? s__10202 : cljs.core.next.call(null, s__10202))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__10203 = this;
  var h__2247__auto____10204 = this__10203.__hash;
  if(!(h__2247__auto____10204 == null)) {
    return h__2247__auto____10204
  }else {
    var h__2247__auto____10205 = cljs.core.hash_coll.call(null, rng);
    this__10203.__hash = h__2247__auto____10205;
    return h__2247__auto____10205
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10206 = this;
  if(this__10206.step > 0) {
    if(this__10206.start + this__10206.step < this__10206.end) {
      return new cljs.core.Range(this__10206.meta, this__10206.start + this__10206.step, this__10206.end, this__10206.step, null)
    }else {
      return null
    }
  }else {
    if(this__10206.start + this__10206.step > this__10206.end) {
      return new cljs.core.Range(this__10206.meta, this__10206.start + this__10206.step, this__10206.end, this__10206.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10207 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10208 = this;
  var this__10209 = this;
  return cljs.core.pr_str.call(null, this__10209)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10210 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10211 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10212 = this;
  if(this__10212.step > 0) {
    if(this__10212.start < this__10212.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10212.start > this__10212.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10213 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10213.end - this__10213.start) / this__10213.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10214 = this;
  return this__10214.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10215 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10215.meta, this__10215.start + this__10215.step, this__10215.end, this__10215.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10216 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10217 = this;
  return new cljs.core.Range(meta, this__10217.start, this__10217.end, this__10217.step, this__10217.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10218 = this;
  return this__10218.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10219 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10219.start + n * this__10219.step
  }else {
    if(function() {
      var and__3822__auto____10220 = this__10219.start > this__10219.end;
      if(and__3822__auto____10220) {
        return this__10219.step === 0
      }else {
        return and__3822__auto____10220
      }
    }()) {
      return this__10219.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10221 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10221.start + n * this__10221.step
  }else {
    if(function() {
      var and__3822__auto____10222 = this__10221.start > this__10221.end;
      if(and__3822__auto____10222) {
        return this__10221.step === 0
      }else {
        return and__3822__auto____10222
      }
    }()) {
      return this__10221.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10223 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10223.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10226 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10226) {
      var s__10227 = temp__3974__auto____10226;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10227), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10227)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10234 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10234) {
      var s__10235 = temp__3974__auto____10234;
      var fst__10236 = cljs.core.first.call(null, s__10235);
      var fv__10237 = f.call(null, fst__10236);
      var run__10238 = cljs.core.cons.call(null, fst__10236, cljs.core.take_while.call(null, function(p1__10228_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10237, f.call(null, p1__10228_SHARP_))
      }, cljs.core.next.call(null, s__10235)));
      return cljs.core.cons.call(null, run__10238, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10238), s__10235))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____10253 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10253) {
        var s__10254 = temp__3971__auto____10253;
        return reductions.call(null, f, cljs.core.first.call(null, s__10254), cljs.core.rest.call(null, s__10254))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10255 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10255) {
        var s__10256 = temp__3974__auto____10255;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10256)), cljs.core.rest.call(null, s__10256))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10259 = null;
      var G__10259__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10259__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10259__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10259__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10259__4 = function() {
        var G__10260__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10260 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10260__delegate.call(this, x, y, z, args)
        };
        G__10260.cljs$lang$maxFixedArity = 3;
        G__10260.cljs$lang$applyTo = function(arglist__10261) {
          var x = cljs.core.first(arglist__10261);
          var y = cljs.core.first(cljs.core.next(arglist__10261));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10261)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10261)));
          return G__10260__delegate(x, y, z, args)
        };
        G__10260.cljs$lang$arity$variadic = G__10260__delegate;
        return G__10260
      }();
      G__10259 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10259__0.call(this);
          case 1:
            return G__10259__1.call(this, x);
          case 2:
            return G__10259__2.call(this, x, y);
          case 3:
            return G__10259__3.call(this, x, y, z);
          default:
            return G__10259__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10259.cljs$lang$maxFixedArity = 3;
      G__10259.cljs$lang$applyTo = G__10259__4.cljs$lang$applyTo;
      return G__10259
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10262 = null;
      var G__10262__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10262__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10262__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10262__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10262__4 = function() {
        var G__10263__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10263 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10263__delegate.call(this, x, y, z, args)
        };
        G__10263.cljs$lang$maxFixedArity = 3;
        G__10263.cljs$lang$applyTo = function(arglist__10264) {
          var x = cljs.core.first(arglist__10264);
          var y = cljs.core.first(cljs.core.next(arglist__10264));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10264)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10264)));
          return G__10263__delegate(x, y, z, args)
        };
        G__10263.cljs$lang$arity$variadic = G__10263__delegate;
        return G__10263
      }();
      G__10262 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10262__0.call(this);
          case 1:
            return G__10262__1.call(this, x);
          case 2:
            return G__10262__2.call(this, x, y);
          case 3:
            return G__10262__3.call(this, x, y, z);
          default:
            return G__10262__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10262.cljs$lang$maxFixedArity = 3;
      G__10262.cljs$lang$applyTo = G__10262__4.cljs$lang$applyTo;
      return G__10262
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10265 = null;
      var G__10265__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10265__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10265__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10265__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10265__4 = function() {
        var G__10266__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10266 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10266__delegate.call(this, x, y, z, args)
        };
        G__10266.cljs$lang$maxFixedArity = 3;
        G__10266.cljs$lang$applyTo = function(arglist__10267) {
          var x = cljs.core.first(arglist__10267);
          var y = cljs.core.first(cljs.core.next(arglist__10267));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10267)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10267)));
          return G__10266__delegate(x, y, z, args)
        };
        G__10266.cljs$lang$arity$variadic = G__10266__delegate;
        return G__10266
      }();
      G__10265 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10265__0.call(this);
          case 1:
            return G__10265__1.call(this, x);
          case 2:
            return G__10265__2.call(this, x, y);
          case 3:
            return G__10265__3.call(this, x, y, z);
          default:
            return G__10265__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10265.cljs$lang$maxFixedArity = 3;
      G__10265.cljs$lang$applyTo = G__10265__4.cljs$lang$applyTo;
      return G__10265
    }()
  };
  var juxt__4 = function() {
    var G__10268__delegate = function(f, g, h, fs) {
      var fs__10258 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10269 = null;
        var G__10269__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10239_SHARP_, p2__10240_SHARP_) {
            return cljs.core.conj.call(null, p1__10239_SHARP_, p2__10240_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10258)
        };
        var G__10269__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10241_SHARP_, p2__10242_SHARP_) {
            return cljs.core.conj.call(null, p1__10241_SHARP_, p2__10242_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10258)
        };
        var G__10269__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10243_SHARP_, p2__10244_SHARP_) {
            return cljs.core.conj.call(null, p1__10243_SHARP_, p2__10244_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10258)
        };
        var G__10269__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10245_SHARP_, p2__10246_SHARP_) {
            return cljs.core.conj.call(null, p1__10245_SHARP_, p2__10246_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10258)
        };
        var G__10269__4 = function() {
          var G__10270__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10247_SHARP_, p2__10248_SHARP_) {
              return cljs.core.conj.call(null, p1__10247_SHARP_, cljs.core.apply.call(null, p2__10248_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10258)
          };
          var G__10270 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10270__delegate.call(this, x, y, z, args)
          };
          G__10270.cljs$lang$maxFixedArity = 3;
          G__10270.cljs$lang$applyTo = function(arglist__10271) {
            var x = cljs.core.first(arglist__10271);
            var y = cljs.core.first(cljs.core.next(arglist__10271));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10271)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10271)));
            return G__10270__delegate(x, y, z, args)
          };
          G__10270.cljs$lang$arity$variadic = G__10270__delegate;
          return G__10270
        }();
        G__10269 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10269__0.call(this);
            case 1:
              return G__10269__1.call(this, x);
            case 2:
              return G__10269__2.call(this, x, y);
            case 3:
              return G__10269__3.call(this, x, y, z);
            default:
              return G__10269__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10269.cljs$lang$maxFixedArity = 3;
        G__10269.cljs$lang$applyTo = G__10269__4.cljs$lang$applyTo;
        return G__10269
      }()
    };
    var G__10268 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10268__delegate.call(this, f, g, h, fs)
    };
    G__10268.cljs$lang$maxFixedArity = 3;
    G__10268.cljs$lang$applyTo = function(arglist__10272) {
      var f = cljs.core.first(arglist__10272);
      var g = cljs.core.first(cljs.core.next(arglist__10272));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10272)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10272)));
      return G__10268__delegate(f, g, h, fs)
    };
    G__10268.cljs$lang$arity$variadic = G__10268__delegate;
    return G__10268
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__10275 = cljs.core.next.call(null, coll);
        coll = G__10275;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10274 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10274) {
          return n > 0
        }else {
          return and__3822__auto____10274
        }
      }())) {
        var G__10276 = n - 1;
        var G__10277 = cljs.core.next.call(null, coll);
        n = G__10276;
        coll = G__10277;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10279 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10279), s)) {
    if(cljs.core.count.call(null, matches__10279) === 1) {
      return cljs.core.first.call(null, matches__10279)
    }else {
      return cljs.core.vec.call(null, matches__10279)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10281 = re.exec(s);
  if(matches__10281 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10281) === 1) {
      return cljs.core.first.call(null, matches__10281)
    }else {
      return cljs.core.vec.call(null, matches__10281)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10286 = cljs.core.re_find.call(null, re, s);
  var match_idx__10287 = s.search(re);
  var match_str__10288 = cljs.core.coll_QMARK_.call(null, match_data__10286) ? cljs.core.first.call(null, match_data__10286) : match_data__10286;
  var post_match__10289 = cljs.core.subs.call(null, s, match_idx__10287 + cljs.core.count.call(null, match_str__10288));
  if(cljs.core.truth_(match_data__10286)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10286, re_seq.call(null, re, post_match__10289))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10296__10297 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10298 = cljs.core.nth.call(null, vec__10296__10297, 0, null);
  var flags__10299 = cljs.core.nth.call(null, vec__10296__10297, 1, null);
  var pattern__10300 = cljs.core.nth.call(null, vec__10296__10297, 2, null);
  return new RegExp(pattern__10300, flags__10299)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10290_SHARP_) {
    return print_one.call(null, p1__10290_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____10310 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10310)) {
            var and__3822__auto____10314 = function() {
              var G__10311__10312 = obj;
              if(G__10311__10312) {
                if(function() {
                  var or__3824__auto____10313 = G__10311__10312.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10313) {
                    return or__3824__auto____10313
                  }else {
                    return G__10311__10312.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10311__10312.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10311__10312)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10311__10312)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10314)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10314
            }
          }else {
            return and__3822__auto____10310
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10315 = !(obj == null);
          if(and__3822__auto____10315) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10315
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10316__10317 = obj;
          if(G__10316__10317) {
            if(function() {
              var or__3824__auto____10318 = G__10316__10317.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10318) {
                return or__3824__auto____10318
              }else {
                return G__10316__10317.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10316__10317.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10316__10317)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10316__10317)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10338 = new goog.string.StringBuffer;
  var G__10339__10340 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10339__10340) {
    var string__10341 = cljs.core.first.call(null, G__10339__10340);
    var G__10339__10342 = G__10339__10340;
    while(true) {
      sb__10338.append(string__10341);
      var temp__3974__auto____10343 = cljs.core.next.call(null, G__10339__10342);
      if(temp__3974__auto____10343) {
        var G__10339__10344 = temp__3974__auto____10343;
        var G__10357 = cljs.core.first.call(null, G__10339__10344);
        var G__10358 = G__10339__10344;
        string__10341 = G__10357;
        G__10339__10342 = G__10358;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10345__10346 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10345__10346) {
    var obj__10347 = cljs.core.first.call(null, G__10345__10346);
    var G__10345__10348 = G__10345__10346;
    while(true) {
      sb__10338.append(" ");
      var G__10349__10350 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10347, opts));
      if(G__10349__10350) {
        var string__10351 = cljs.core.first.call(null, G__10349__10350);
        var G__10349__10352 = G__10349__10350;
        while(true) {
          sb__10338.append(string__10351);
          var temp__3974__auto____10353 = cljs.core.next.call(null, G__10349__10352);
          if(temp__3974__auto____10353) {
            var G__10349__10354 = temp__3974__auto____10353;
            var G__10359 = cljs.core.first.call(null, G__10349__10354);
            var G__10360 = G__10349__10354;
            string__10351 = G__10359;
            G__10349__10352 = G__10360;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10355 = cljs.core.next.call(null, G__10345__10348);
      if(temp__3974__auto____10355) {
        var G__10345__10356 = temp__3974__auto____10355;
        var G__10361 = cljs.core.first.call(null, G__10345__10356);
        var G__10362 = G__10345__10356;
        obj__10347 = G__10361;
        G__10345__10348 = G__10362;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10338
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10364 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10364.append("\n");
  return[cljs.core.str(sb__10364)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10383__10384 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10383__10384) {
    var string__10385 = cljs.core.first.call(null, G__10383__10384);
    var G__10383__10386 = G__10383__10384;
    while(true) {
      cljs.core.string_print.call(null, string__10385);
      var temp__3974__auto____10387 = cljs.core.next.call(null, G__10383__10386);
      if(temp__3974__auto____10387) {
        var G__10383__10388 = temp__3974__auto____10387;
        var G__10401 = cljs.core.first.call(null, G__10383__10388);
        var G__10402 = G__10383__10388;
        string__10385 = G__10401;
        G__10383__10386 = G__10402;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10389__10390 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10389__10390) {
    var obj__10391 = cljs.core.first.call(null, G__10389__10390);
    var G__10389__10392 = G__10389__10390;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10393__10394 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10391, opts));
      if(G__10393__10394) {
        var string__10395 = cljs.core.first.call(null, G__10393__10394);
        var G__10393__10396 = G__10393__10394;
        while(true) {
          cljs.core.string_print.call(null, string__10395);
          var temp__3974__auto____10397 = cljs.core.next.call(null, G__10393__10396);
          if(temp__3974__auto____10397) {
            var G__10393__10398 = temp__3974__auto____10397;
            var G__10403 = cljs.core.first.call(null, G__10393__10398);
            var G__10404 = G__10393__10398;
            string__10395 = G__10403;
            G__10393__10396 = G__10404;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10399 = cljs.core.next.call(null, G__10389__10392);
      if(temp__3974__auto____10399) {
        var G__10389__10400 = temp__3974__auto____10399;
        var G__10405 = cljs.core.first.call(null, G__10389__10400);
        var G__10406 = G__10389__10400;
        obj__10391 = G__10405;
        G__10389__10392 = G__10406;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10407) {
    var objs = cljs.core.seq(arglist__10407);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10408) {
    var objs = cljs.core.seq(arglist__10408);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10409) {
    var objs = cljs.core.seq(arglist__10409);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10410) {
    var objs = cljs.core.seq(arglist__10410);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10411) {
    var objs = cljs.core.seq(arglist__10411);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10412) {
    var objs = cljs.core.seq(arglist__10412);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10413) {
    var objs = cljs.core.seq(arglist__10413);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10414) {
    var objs = cljs.core.seq(arglist__10414);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__10415) {
    var fmt = cljs.core.first(arglist__10415);
    var args = cljs.core.rest(arglist__10415);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10416 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10416, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10417 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10417, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10418 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10418, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____10419 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10419)) {
        var nspc__10420 = temp__3974__auto____10419;
        return[cljs.core.str(nspc__10420), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10421 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10421)) {
          var nspc__10422 = temp__3974__auto____10421;
          return[cljs.core.str(nspc__10422), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10423 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10423, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__10425 = function(n, len) {
    var ns__10424 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10424) < len) {
        var G__10427 = [cljs.core.str("0"), cljs.core.str(ns__10424)].join("");
        ns__10424 = G__10427;
        continue
      }else {
        return ns__10424
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10425.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10425.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10425.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10425.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10425.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10425.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10426 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10426, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10428 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10429 = this;
  var G__10430__10431 = cljs.core.seq.call(null, this__10429.watches);
  if(G__10430__10431) {
    var G__10433__10435 = cljs.core.first.call(null, G__10430__10431);
    var vec__10434__10436 = G__10433__10435;
    var key__10437 = cljs.core.nth.call(null, vec__10434__10436, 0, null);
    var f__10438 = cljs.core.nth.call(null, vec__10434__10436, 1, null);
    var G__10430__10439 = G__10430__10431;
    var G__10433__10440 = G__10433__10435;
    var G__10430__10441 = G__10430__10439;
    while(true) {
      var vec__10442__10443 = G__10433__10440;
      var key__10444 = cljs.core.nth.call(null, vec__10442__10443, 0, null);
      var f__10445 = cljs.core.nth.call(null, vec__10442__10443, 1, null);
      var G__10430__10446 = G__10430__10441;
      f__10445.call(null, key__10444, this$, oldval, newval);
      var temp__3974__auto____10447 = cljs.core.next.call(null, G__10430__10446);
      if(temp__3974__auto____10447) {
        var G__10430__10448 = temp__3974__auto____10447;
        var G__10455 = cljs.core.first.call(null, G__10430__10448);
        var G__10456 = G__10430__10448;
        G__10433__10440 = G__10455;
        G__10430__10441 = G__10456;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10449 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10449.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10450 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10450.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10451 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10451.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10452 = this;
  return this__10452.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10453 = this;
  return this__10453.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10454 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10468__delegate = function(x, p__10457) {
      var map__10463__10464 = p__10457;
      var map__10463__10465 = cljs.core.seq_QMARK_.call(null, map__10463__10464) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10463__10464) : map__10463__10464;
      var validator__10466 = cljs.core._lookup.call(null, map__10463__10465, "\ufdd0'validator", null);
      var meta__10467 = cljs.core._lookup.call(null, map__10463__10465, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10467, validator__10466, null)
    };
    var G__10468 = function(x, var_args) {
      var p__10457 = null;
      if(goog.isDef(var_args)) {
        p__10457 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10468__delegate.call(this, x, p__10457)
    };
    G__10468.cljs$lang$maxFixedArity = 1;
    G__10468.cljs$lang$applyTo = function(arglist__10469) {
      var x = cljs.core.first(arglist__10469);
      var p__10457 = cljs.core.rest(arglist__10469);
      return G__10468__delegate(x, p__10457)
    };
    G__10468.cljs$lang$arity$variadic = G__10468__delegate;
    return G__10468
  }();
  atom = function(x, var_args) {
    var p__10457 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____10473 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10473)) {
    var validate__10474 = temp__3974__auto____10473;
    if(cljs.core.truth_(validate__10474.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10475 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10475, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10476__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10476 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10476__delegate.call(this, a, f, x, y, z, more)
    };
    G__10476.cljs$lang$maxFixedArity = 5;
    G__10476.cljs$lang$applyTo = function(arglist__10477) {
      var a = cljs.core.first(arglist__10477);
      var f = cljs.core.first(cljs.core.next(arglist__10477));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10477)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10477))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10477)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10477)))));
      return G__10476__delegate(a, f, x, y, z, more)
    };
    G__10476.cljs$lang$arity$variadic = G__10476__delegate;
    return G__10476
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10478) {
    var iref = cljs.core.first(arglist__10478);
    var f = cljs.core.first(cljs.core.next(arglist__10478));
    var args = cljs.core.rest(cljs.core.next(arglist__10478));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10479 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10479.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10480 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10480.state, function(p__10481) {
    var map__10482__10483 = p__10481;
    var map__10482__10484 = cljs.core.seq_QMARK_.call(null, map__10482__10483) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10482__10483) : map__10482__10483;
    var curr_state__10485 = map__10482__10484;
    var done__10486 = cljs.core._lookup.call(null, map__10482__10484, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10486)) {
      return curr_state__10485
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10480.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10507__10508 = options;
    var map__10507__10509 = cljs.core.seq_QMARK_.call(null, map__10507__10508) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10507__10508) : map__10507__10508;
    var keywordize_keys__10510 = cljs.core._lookup.call(null, map__10507__10509, "\ufdd0'keywordize-keys", null);
    var keyfn__10511 = cljs.core.truth_(keywordize_keys__10510) ? cljs.core.keyword : cljs.core.str;
    var f__10526 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2517__auto____10525 = function iter__10519(s__10520) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10520__10523 = s__10520;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10520__10523)) {
                        var k__10524 = cljs.core.first.call(null, s__10520__10523);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10511.call(null, k__10524), thisfn.call(null, x[k__10524])], true), iter__10519.call(null, cljs.core.rest.call(null, s__10520__10523)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2517__auto____10525.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__10526.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10527) {
    var x = cljs.core.first(arglist__10527);
    var options = cljs.core.rest(arglist__10527);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10532 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10536__delegate = function(args) {
      var temp__3971__auto____10533 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10532), args, null);
      if(cljs.core.truth_(temp__3971__auto____10533)) {
        var v__10534 = temp__3971__auto____10533;
        return v__10534
      }else {
        var ret__10535 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10532, cljs.core.assoc, args, ret__10535);
        return ret__10535
      }
    };
    var G__10536 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10536__delegate.call(this, args)
    };
    G__10536.cljs$lang$maxFixedArity = 0;
    G__10536.cljs$lang$applyTo = function(arglist__10537) {
      var args = cljs.core.seq(arglist__10537);
      return G__10536__delegate(args)
    };
    G__10536.cljs$lang$arity$variadic = G__10536__delegate;
    return G__10536
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10539 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10539)) {
        var G__10540 = ret__10539;
        f = G__10540;
        continue
      }else {
        return ret__10539
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10541__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10541 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10541__delegate.call(this, f, args)
    };
    G__10541.cljs$lang$maxFixedArity = 1;
    G__10541.cljs$lang$applyTo = function(arglist__10542) {
      var f = cljs.core.first(arglist__10542);
      var args = cljs.core.rest(arglist__10542);
      return G__10541__delegate(f, args)
    };
    G__10541.cljs$lang$arity$variadic = G__10541__delegate;
    return G__10541
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__10544 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10544, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10544, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10553 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10553) {
      return or__3824__auto____10553
    }else {
      var or__3824__auto____10554 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10554) {
        return or__3824__auto____10554
      }else {
        var and__3822__auto____10555 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10555) {
          var and__3822__auto____10556 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10556) {
            var and__3822__auto____10557 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10557) {
              var ret__10558 = true;
              var i__10559 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10560 = cljs.core.not.call(null, ret__10558);
                  if(or__3824__auto____10560) {
                    return or__3824__auto____10560
                  }else {
                    return i__10559 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10558
                }else {
                  var G__10561 = isa_QMARK_.call(null, h, child.call(null, i__10559), parent.call(null, i__10559));
                  var G__10562 = i__10559 + 1;
                  ret__10558 = G__10561;
                  i__10559 = G__10562;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10557
            }
          }else {
            return and__3822__auto____10556
          }
        }else {
          return and__3822__auto____10555
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10571 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10572 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10573 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10574 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10575 = cljs.core.contains_QMARK_.call(null, tp__10571.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10573.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10573.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10571, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10574.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10572, parent, ta__10573), "\ufdd0'descendants":tf__10574.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10573, tag, td__10572)})
    }();
    if(cljs.core.truth_(or__3824__auto____10575)) {
      return or__3824__auto____10575
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10580 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10581 = cljs.core.truth_(parentMap__10580.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10580.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10582 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10581)) ? cljs.core.assoc.call(null, parentMap__10580, tag, childsParents__10581) : cljs.core.dissoc.call(null, parentMap__10580, tag);
    var deriv_seq__10583 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10563_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10563_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10563_SHARP_), cljs.core.second.call(null, p1__10563_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10582)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10580.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10564_SHARP_, p2__10565_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10564_SHARP_, p2__10565_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10583))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10591 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10593 = cljs.core.truth_(function() {
    var and__3822__auto____10592 = xprefs__10591;
    if(cljs.core.truth_(and__3822__auto____10592)) {
      return xprefs__10591.call(null, y)
    }else {
      return and__3822__auto____10592
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10593)) {
    return or__3824__auto____10593
  }else {
    var or__3824__auto____10595 = function() {
      var ps__10594 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10594) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10594), prefer_table))) {
          }else {
          }
          var G__10598 = cljs.core.rest.call(null, ps__10594);
          ps__10594 = G__10598;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10595)) {
      return or__3824__auto____10595
    }else {
      var or__3824__auto____10597 = function() {
        var ps__10596 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10596) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10596), y, prefer_table))) {
            }else {
            }
            var G__10599 = cljs.core.rest.call(null, ps__10596);
            ps__10596 = G__10599;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10597)) {
        return or__3824__auto____10597
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10601 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10601)) {
    return or__3824__auto____10601
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10619 = cljs.core.reduce.call(null, function(be, p__10611) {
    var vec__10612__10613 = p__10611;
    var k__10614 = cljs.core.nth.call(null, vec__10612__10613, 0, null);
    var ___10615 = cljs.core.nth.call(null, vec__10612__10613, 1, null);
    var e__10616 = vec__10612__10613;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10614)) {
      var be2__10618 = cljs.core.truth_(function() {
        var or__3824__auto____10617 = be == null;
        if(or__3824__auto____10617) {
          return or__3824__auto____10617
        }else {
          return cljs.core.dominates.call(null, k__10614, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10616 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10618), k__10614, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10614), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10618)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10618
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10619)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10619));
      return cljs.core.second.call(null, best_entry__10619)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10624 = mf;
    if(and__3822__auto____10624) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10624
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2418__auto____10625 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10626 = cljs.core._reset[goog.typeOf(x__2418__auto____10625)];
      if(or__3824__auto____10626) {
        return or__3824__auto____10626
      }else {
        var or__3824__auto____10627 = cljs.core._reset["_"];
        if(or__3824__auto____10627) {
          return or__3824__auto____10627
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10632 = mf;
    if(and__3822__auto____10632) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10632
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2418__auto____10633 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10634 = cljs.core._add_method[goog.typeOf(x__2418__auto____10633)];
      if(or__3824__auto____10634) {
        return or__3824__auto____10634
      }else {
        var or__3824__auto____10635 = cljs.core._add_method["_"];
        if(or__3824__auto____10635) {
          return or__3824__auto____10635
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10640 = mf;
    if(and__3822__auto____10640) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10640
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____10641 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10642 = cljs.core._remove_method[goog.typeOf(x__2418__auto____10641)];
      if(or__3824__auto____10642) {
        return or__3824__auto____10642
      }else {
        var or__3824__auto____10643 = cljs.core._remove_method["_"];
        if(or__3824__auto____10643) {
          return or__3824__auto____10643
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10648 = mf;
    if(and__3822__auto____10648) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10648
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2418__auto____10649 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10650 = cljs.core._prefer_method[goog.typeOf(x__2418__auto____10649)];
      if(or__3824__auto____10650) {
        return or__3824__auto____10650
      }else {
        var or__3824__auto____10651 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10651) {
          return or__3824__auto____10651
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10656 = mf;
    if(and__3822__auto____10656) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10656
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____10657 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10658 = cljs.core._get_method[goog.typeOf(x__2418__auto____10657)];
      if(or__3824__auto____10658) {
        return or__3824__auto____10658
      }else {
        var or__3824__auto____10659 = cljs.core._get_method["_"];
        if(or__3824__auto____10659) {
          return or__3824__auto____10659
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10664 = mf;
    if(and__3822__auto____10664) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10664
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2418__auto____10665 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10666 = cljs.core._methods[goog.typeOf(x__2418__auto____10665)];
      if(or__3824__auto____10666) {
        return or__3824__auto____10666
      }else {
        var or__3824__auto____10667 = cljs.core._methods["_"];
        if(or__3824__auto____10667) {
          return or__3824__auto____10667
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10672 = mf;
    if(and__3822__auto____10672) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10672
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2418__auto____10673 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10674 = cljs.core._prefers[goog.typeOf(x__2418__auto____10673)];
      if(or__3824__auto____10674) {
        return or__3824__auto____10674
      }else {
        var or__3824__auto____10675 = cljs.core._prefers["_"];
        if(or__3824__auto____10675) {
          return or__3824__auto____10675
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10680 = mf;
    if(and__3822__auto____10680) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10680
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2418__auto____10681 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10682 = cljs.core._dispatch[goog.typeOf(x__2418__auto____10681)];
      if(or__3824__auto____10682) {
        return or__3824__auto____10682
      }else {
        var or__3824__auto____10683 = cljs.core._dispatch["_"];
        if(or__3824__auto____10683) {
          return or__3824__auto____10683
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10686 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10687 = cljs.core._get_method.call(null, mf, dispatch_val__10686);
  if(cljs.core.truth_(target_fn__10687)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10686)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10687, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10688 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10689 = this;
  cljs.core.swap_BANG_.call(null, this__10689.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10689.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10689.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10689.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10690 = this;
  cljs.core.swap_BANG_.call(null, this__10690.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10690.method_cache, this__10690.method_table, this__10690.cached_hierarchy, this__10690.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10691 = this;
  cljs.core.swap_BANG_.call(null, this__10691.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10691.method_cache, this__10691.method_table, this__10691.cached_hierarchy, this__10691.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10692 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10692.cached_hierarchy), cljs.core.deref.call(null, this__10692.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10692.method_cache, this__10692.method_table, this__10692.cached_hierarchy, this__10692.hierarchy)
  }
  var temp__3971__auto____10693 = cljs.core.deref.call(null, this__10692.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10693)) {
    var target_fn__10694 = temp__3971__auto____10693;
    return target_fn__10694
  }else {
    var temp__3971__auto____10695 = cljs.core.find_and_cache_best_method.call(null, this__10692.name, dispatch_val, this__10692.hierarchy, this__10692.method_table, this__10692.prefer_table, this__10692.method_cache, this__10692.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10695)) {
      var target_fn__10696 = temp__3971__auto____10695;
      return target_fn__10696
    }else {
      return cljs.core.deref.call(null, this__10692.method_table).call(null, this__10692.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10697 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10697.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10697.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10697.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10697.method_cache, this__10697.method_table, this__10697.cached_hierarchy, this__10697.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10698 = this;
  return cljs.core.deref.call(null, this__10698.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10699 = this;
  return cljs.core.deref.call(null, this__10699.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10700 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10700.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10702__delegate = function(_, args) {
    var self__10701 = this;
    return cljs.core._dispatch.call(null, self__10701, args)
  };
  var G__10702 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10702__delegate.call(this, _, args)
  };
  G__10702.cljs$lang$maxFixedArity = 1;
  G__10702.cljs$lang$applyTo = function(arglist__10703) {
    var _ = cljs.core.first(arglist__10703);
    var args = cljs.core.rest(arglist__10703);
    return G__10702__delegate(_, args)
  };
  G__10702.cljs$lang$arity$variadic = G__10702__delegate;
  return G__10702
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10704 = this;
  return cljs.core._dispatch.call(null, self__10704, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10705 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10707, _) {
  var this__10706 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10706.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10708 = this;
  var and__3822__auto____10709 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10709) {
    return this__10708.uuid === other.uuid
  }else {
    return and__3822__auto____10709
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10710 = this;
  var this__10711 = this;
  return cljs.core.pr_str.call(null, this__10711)
};
cljs.core.UUID;
goog.provide("aima_clojure.game");
goog.require("cljs.core");
aima_clojure.game.Game = {};
aima_clojure.game.moves = function moves(game, state) {
  if(function() {
    var and__3822__auto____36999 = game;
    if(and__3822__auto____36999) {
      return game.aima_clojure$game$Game$moves$arity$2
    }else {
      return and__3822__auto____36999
    }
  }()) {
    return game.aima_clojure$game$Game$moves$arity$2(game, state)
  }else {
    var x__2418__auto____37000 = game == null ? null : game;
    return function() {
      var or__3824__auto____37001 = aima_clojure.game.moves[goog.typeOf(x__2418__auto____37000)];
      if(or__3824__auto____37001) {
        return or__3824__auto____37001
      }else {
        var or__3824__auto____37002 = aima_clojure.game.moves["_"];
        if(or__3824__auto____37002) {
          return or__3824__auto____37002
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.moves", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.make_move = function make_move(game, state, move) {
  if(function() {
    var and__3822__auto____37007 = game;
    if(and__3822__auto____37007) {
      return game.aima_clojure$game$Game$make_move$arity$3
    }else {
      return and__3822__auto____37007
    }
  }()) {
    return game.aima_clojure$game$Game$make_move$arity$3(game, state, move)
  }else {
    var x__2418__auto____37008 = game == null ? null : game;
    return function() {
      var or__3824__auto____37009 = aima_clojure.game.make_move[goog.typeOf(x__2418__auto____37008)];
      if(or__3824__auto____37009) {
        return or__3824__auto____37009
      }else {
        var or__3824__auto____37010 = aima_clojure.game.make_move["_"];
        if(or__3824__auto____37010) {
          return or__3824__auto____37010
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.make-move", game);
        }
      }
    }().call(null, game, state, move)
  }
};
aima_clojure.game.utility = function utility(game, state, player) {
  if(function() {
    var and__3822__auto____37015 = game;
    if(and__3822__auto____37015) {
      return game.aima_clojure$game$Game$utility$arity$3
    }else {
      return and__3822__auto____37015
    }
  }()) {
    return game.aima_clojure$game$Game$utility$arity$3(game, state, player)
  }else {
    var x__2418__auto____37016 = game == null ? null : game;
    return function() {
      var or__3824__auto____37017 = aima_clojure.game.utility[goog.typeOf(x__2418__auto____37016)];
      if(or__3824__auto____37017) {
        return or__3824__auto____37017
      }else {
        var or__3824__auto____37018 = aima_clojure.game.utility["_"];
        if(or__3824__auto____37018) {
          return or__3824__auto____37018
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.utility", game);
        }
      }
    }().call(null, game, state, player)
  }
};
aima_clojure.game.terminal_test = function terminal_test(game, state) {
  if(function() {
    var and__3822__auto____37023 = game;
    if(and__3822__auto____37023) {
      return game.aima_clojure$game$Game$terminal_test$arity$2
    }else {
      return and__3822__auto____37023
    }
  }()) {
    return game.aima_clojure$game$Game$terminal_test$arity$2(game, state)
  }else {
    var x__2418__auto____37024 = game == null ? null : game;
    return function() {
      var or__3824__auto____37025 = aima_clojure.game.terminal_test[goog.typeOf(x__2418__auto____37024)];
      if(or__3824__auto____37025) {
        return or__3824__auto____37025
      }else {
        var or__3824__auto____37026 = aima_clojure.game.terminal_test["_"];
        if(or__3824__auto____37026) {
          return or__3824__auto____37026
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.terminal-test", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.to_move = function to_move(game, state) {
  if(function() {
    var and__3822__auto____37031 = game;
    if(and__3822__auto____37031) {
      return game.aima_clojure$game$Game$to_move$arity$2
    }else {
      return and__3822__auto____37031
    }
  }()) {
    return game.aima_clojure$game$Game$to_move$arity$2(game, state)
  }else {
    var x__2418__auto____37032 = game == null ? null : game;
    return function() {
      var or__3824__auto____37033 = aima_clojure.game.to_move[goog.typeOf(x__2418__auto____37032)];
      if(or__3824__auto____37033) {
        return or__3824__auto____37033
      }else {
        var or__3824__auto____37034 = aima_clojure.game.to_move["_"];
        if(or__3824__auto____37034) {
          return or__3824__auto____37034
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.to-move", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.display = function display(game, state) {
  if(function() {
    var and__3822__auto____37039 = game;
    if(and__3822__auto____37039) {
      return game.aima_clojure$game$Game$display$arity$2
    }else {
      return and__3822__auto____37039
    }
  }()) {
    return game.aima_clojure$game$Game$display$arity$2(game, state)
  }else {
    var x__2418__auto____37040 = game == null ? null : game;
    return function() {
      var or__3824__auto____37041 = aima_clojure.game.display[goog.typeOf(x__2418__auto____37040)];
      if(or__3824__auto____37041) {
        return or__3824__auto____37041
      }else {
        var or__3824__auto____37042 = aima_clojure.game.display["_"];
        if(or__3824__auto____37042) {
          return or__3824__auto____37042
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.display", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.initial = function initial(game) {
  if(function() {
    var and__3822__auto____37047 = game;
    if(and__3822__auto____37047) {
      return game.aima_clojure$game$Game$initial$arity$1
    }else {
      return and__3822__auto____37047
    }
  }()) {
    return game.aima_clojure$game$Game$initial$arity$1(game)
  }else {
    var x__2418__auto____37048 = game == null ? null : game;
    return function() {
      var or__3824__auto____37049 = aima_clojure.game.initial[goog.typeOf(x__2418__auto____37048)];
      if(or__3824__auto____37049) {
        return or__3824__auto____37049
      }else {
        var or__3824__auto____37050 = aima_clojure.game.initial["_"];
        if(or__3824__auto____37050) {
          return or__3824__auto____37050
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.initial", game);
        }
      }
    }().call(null, game)
  }
};
aima_clojure.game.max_value = function max_value(game, state, player) {
  if(cljs.core.truth_(aima_clojure.game.terminal_test.call(null, game, state))) {
    return aima_clojure.game.utility.call(null, game, state, player)
  }else {
    return cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__37051_SHARP_) {
      return aima_clojure.game.min_value.call(null, game, aima_clojure.game.make_move.call(null, game, state, p1__37051_SHARP_), player)
    }, aima_clojure.game.moves.call(null, game, state)))
  }
};
aima_clojure.game.min_value = function min_value(game, state, player) {
  if(cljs.core.truth_(aima_clojure.game.terminal_test.call(null, game, state))) {
    return aima_clojure.game.utility.call(null, game, state, player)
  }else {
    return cljs.core.apply.call(null, cljs.core.min, cljs.core.map.call(null, function(p1__37052_SHARP_) {
      return aima_clojure.game.max_value.call(null, game, aima_clojure.game.make_move.call(null, game, state, p1__37052_SHARP_), player)
    }, aima_clojure.game.moves.call(null, game, state)))
  }
};
aima_clojure.game.minimax_decision = function minimax_decision(game, state) {
  var player__37055 = aima_clojure.game.to_move.call(null, game, state);
  return cljs.core.apply.call(null, cljs.core.max_key, function(p1__37053_SHARP_) {
    return aima_clojure.game.min_value.call(null, game, aima_clojure.game.make_move.call(null, game, state, p1__37053_SHARP_), player__37055)
  }, aima_clojure.game.moves.call(null, game, state))
};
goog.provide("aima_clojure.games.tic_tac_toe");
goog.require("cljs.core");
goog.require("aima_clojure.game");
aima_clojure.games.tic_tac_toe.empty_count = function empty_count(p__36812) {
  var map__36818__36819 = p__36812;
  var map__36818__36820 = cljs.core.seq_QMARK_.call(null, map__36818__36819) ? cljs.core.apply.call(null, cljs.core.hash_map, map__36818__36819) : map__36818__36819;
  var state__36821 = map__36818__36820;
  var board__36822 = cljs.core._lookup.call(null, map__36818__36820, "\ufdd0'board", null);
  return cljs.core.reduce.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(row) {
    return cljs.core.count.call(null, cljs.core.filter.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'e"]), row))
  }, board__36822))
};
aima_clojure.games.tic_tac_toe.line = function line(p__36825, p__36826, p__36827) {
  var map__36844__36847 = p__36825;
  var map__36844__36848 = cljs.core.seq_QMARK_.call(null, map__36844__36847) ? cljs.core.apply.call(null, cljs.core.hash_map, map__36844__36847) : map__36844__36847;
  var state__36849 = map__36844__36848;
  var board__36850 = cljs.core._lookup.call(null, map__36844__36848, "\ufdd0'board", null);
  var to_move__36851 = cljs.core._lookup.call(null, map__36844__36848, "\ufdd0'to-move", null);
  var vec__36845__36852 = p__36826;
  var y__36853 = cljs.core.nth.call(null, vec__36845__36852, 0, null);
  var x__36854 = cljs.core.nth.call(null, vec__36845__36852, 1, null);
  var move__36855 = vec__36845__36852;
  var vec__36846__36856 = p__36827;
  var y_diff__36857 = cljs.core.nth.call(null, vec__36846__36856, 0, null);
  var x_diff__36858 = cljs.core.nth.call(null, vec__36846__36856, 1, null);
  var direction__36859 = vec__36846__36856;
  return cljs.core.map.call(null, function(n) {
    return cljs.core.PersistentVector.fromArray([y__36853 + y_diff__36857 * n, x__36854 + x_diff__36858 * n], true)
  }, cljs.core.iterate.call(null, cljs.core.inc, 1))
};
aima_clojure.games.tic_tac_toe.k_in_row_QMARK_ = function k_in_row_QMARK_(p__36861, move, p__36862, k) {
  var map__36875__36877 = p__36861;
  var map__36875__36878 = cljs.core.seq_QMARK_.call(null, map__36875__36877) ? cljs.core.apply.call(null, cljs.core.hash_map, map__36875__36877) : map__36875__36877;
  var state__36879 = map__36875__36878;
  var board__36880 = cljs.core._lookup.call(null, map__36875__36878, "\ufdd0'board", null);
  var to_move__36881 = cljs.core._lookup.call(null, map__36875__36878, "\ufdd0'to-move", null);
  var vec__36876__36882 = p__36862;
  var y_diff__36883 = cljs.core.nth.call(null, vec__36876__36882, 0, null);
  var x_diff__36884 = cljs.core.nth.call(null, vec__36876__36882, 1, null);
  var direction__36885 = vec__36876__36882;
  var opposite_direction__36886 = cljs.core.PersistentVector.fromArray([-y_diff__36883, -x_diff__36884], true);
  return cljs.core.count.call(null, cljs.core.concat.call(null, cljs.core.take_while.call(null, function(p1__36823_SHARP_) {
    return cljs.core._EQ_.call(null, to_move__36881, cljs.core.get_in.call(null, board__36880, p1__36823_SHARP_))
  }, aima_clojure.games.tic_tac_toe.line.call(null, state__36879, move, direction__36885)), cljs.core.take_while.call(null, function(p1__36824_SHARP_) {
    return cljs.core._EQ_.call(null, to_move__36881, cljs.core.get_in.call(null, board__36880, p1__36824_SHARP_))
  }, aima_clojure.games.tic_tac_toe.line.call(null, state__36879, move, opposite_direction__36886)))) >= k - 1
};
aima_clojure.games.tic_tac_toe.calculate_utility = function calculate_utility(p__36887, move, k) {
  var map__36893__36894 = p__36887;
  var map__36893__36895 = cljs.core.seq_QMARK_.call(null, map__36893__36894) ? cljs.core.apply.call(null, cljs.core.hash_map, map__36893__36894) : map__36893__36894;
  var state__36896 = map__36893__36895;
  var to_move__36897 = cljs.core._lookup.call(null, map__36893__36895, "\ufdd0'to-move", null);
  if(cljs.core.truth_(cljs.core.some.call(null, function(p1__36860_SHARP_) {
    return aima_clojure.games.tic_tac_toe.k_in_row_QMARK_.call(null, state__36896, move, p1__36860_SHARP_, k)
  }, cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([0, 1], true), cljs.core.PersistentVector.fromArray([1, 0], true), cljs.core.PersistentVector.fromArray([1, -1], true), cljs.core.PersistentVector.fromArray([1, 1], true)], true)))) {
    if(cljs.core._EQ_.call(null, to_move__36897, "\ufdd0'x")) {
      return 1
    }else {
      return-1
    }
  }else {
    return 0
  }
};
aima_clojure.games.tic_tac_toe.s = cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":"\ufdd0'x", "\ufdd0'board":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["\ufdd0'o", "\ufdd0'e", "\ufdd0'x"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'x", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'o", "\ufdd0'x", "\ufdd0'e"], true)], true), "\ufdd0'utility":0});
aima_clojure.games.tic_tac_toe.empty_count.call(null, aima_clojure.games.tic_tac_toe.s);
cljs.core.take.call(null, 5, aima_clojure.games.tic_tac_toe.line.call(null, aima_clojure.games.tic_tac_toe.s, cljs.core.PersistentVector.fromArray([0, 1], true), cljs.core.PersistentVector.fromArray([0, 1], true)));
aima_clojure.games.tic_tac_toe.calculate_utility.call(null, aima_clojure.games.tic_tac_toe.s, cljs.core.PersistentVector.fromArray([0, 1], true), 3);
aima_clojure.games.tic_tac_toe.tic_tac_toe = function() {
  var tic_tac_toe = null;
  var tic_tac_toe__0 = function() {
    return tic_tac_toe.call(null, cljs.core.ObjMap.EMPTY)
  };
  var tic_tac_toe__1 = function(p__36898) {
    var map__36946__36947 = p__36898;
    var map__36946__36948 = cljs.core.seq_QMARK_.call(null, map__36946__36947) ? cljs.core.apply.call(null, cljs.core.hash_map, map__36946__36947) : map__36946__36947;
    var k__36949 = cljs.core._lookup.call(null, map__36946__36948, "\ufdd0'k", 3);
    var v__36950 = cljs.core._lookup.call(null, map__36946__36948, "\ufdd0'v", 3);
    var h__36951 = cljs.core._lookup.call(null, map__36946__36948, "\ufdd0'h", 3);
    if(void 0 === aima_clojure.games.tic_tac_toe.t36952) {
      aima_clojure.games.tic_tac_toe.t36952 = function(h, v, k, map__36946, p__36898, tic_tac_toe, meta36953) {
        this.h = h;
        this.v = v;
        this.k = k;
        this.map__36946 = map__36946;
        this.p__36898 = p__36898;
        this.tic_tac_toe = tic_tac_toe;
        this.meta36953 = meta36953;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393216
      };
      aima_clojure.games.tic_tac_toe.t36952.cljs$lang$type = true;
      aima_clojure.games.tic_tac_toe.t36952.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
        return cljs.core.list.call(null, "aima-clojure.games.tic-tac-toe/t36952")
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$ = true;
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$moves$arity$2 = function(game, state) {
        var this__36955 = this;
        var iter__2517__auto____36976 = function iter__36956(s__36957) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__36957__36968 = s__36957;
            while(true) {
              if(cljs.core.seq.call(null, s__36957__36968)) {
                var y__36969 = cljs.core.first.call(null, s__36957__36968);
                var iterys__2515__auto____36974 = function(s__36957__36968, y__36969) {
                  return function iter__36958(s__36959) {
                    return new cljs.core.LazySeq(null, false, function(s__36957__36968, y__36969) {
                      return function() {
                        var s__36959__36972 = s__36959;
                        while(true) {
                          if(cljs.core.seq.call(null, s__36959__36972)) {
                            var x__36973 = cljs.core.first.call(null, s__36959__36972);
                            if(cljs.core._EQ_.call(null, "\ufdd0'e", cljs.core.get_in.call(null, (new cljs.core.Keyword("\ufdd0'board")).call(null, state), cljs.core.PersistentVector.fromArray([y__36969, x__36973], true)))) {
                              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([y__36969, x__36973], true), iter__36958.call(null, cljs.core.rest.call(null, s__36959__36972)))
                            }else {
                              var G__36993 = cljs.core.rest.call(null, s__36959__36972);
                              s__36959__36972 = G__36993;
                              continue
                            }
                          }else {
                            return null
                          }
                          break
                        }
                      }
                    }(s__36957__36968, y__36969), null)
                  }
                }(s__36957__36968, y__36969);
                var fs__2516__auto____36975 = cljs.core.seq.call(null, iterys__2515__auto____36974.call(null, cljs.core.range.call(null, this__36955.h)));
                if(fs__2516__auto____36975) {
                  return cljs.core.concat.call(null, fs__2516__auto____36975, iter__36956.call(null, cljs.core.rest.call(null, s__36957__36968)))
                }else {
                  var G__36994 = cljs.core.rest.call(null, s__36957__36968);
                  s__36957__36968 = G__36994;
                  continue
                }
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2517__auto____36976.call(null, cljs.core.range.call(null, this__36955.v))
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$make_move$arity$3 = function(game, p__36977, move) {
        var this__36978 = this;
        var map__36979__36980 = p__36977;
        var map__36979__36981 = cljs.core.seq_QMARK_.call(null, map__36979__36980) ? cljs.core.apply.call(null, cljs.core.hash_map, map__36979__36980) : map__36979__36980;
        var state__36982 = map__36979__36981;
        var board__36983 = cljs.core._lookup.call(null, map__36979__36981, "\ufdd0'board", null);
        var to_move__36984 = cljs.core._lookup.call(null, map__36979__36981, "\ufdd0'to-move", null);
        return cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":cljs.core._EQ_.call(null, "\ufdd0'o", to_move__36984) ? "\ufdd0'x" : "\ufdd0'o", "\ufdd0'board":cljs.core.assoc_in.call(null, board__36983, move, to_move__36984), "\ufdd0'utility":aima_clojure.games.tic_tac_toe.calculate_utility.call(null, state__36982, move, this__36978.k)})
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$utility$arity$3 = function(game, state, player) {
        var this__36985 = this;
        return aima_clojure.games.tic_tac_toe.empty_count.call(null, state) * (cljs.core._EQ_.call(null, player, "\ufdd0'x") ? (new cljs.core.Keyword("\ufdd0'utility")).call(null, state) : -(new cljs.core.Keyword("\ufdd0'utility")).call(null, state))
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$terminal_test$arity$2 = function(game, state) {
        var this__36986 = this;
        var or__3824__auto____36987 = cljs.core.not_EQ_.call(null, 0, (new cljs.core.Keyword("\ufdd0'utility")).call(null, state));
        if(or__3824__auto____36987) {
          return or__3824__auto____36987
        }else {
          return cljs.core.empty_QMARK_.call(null, game.aima - clojure$game$Game$moves$arity$2(game, state))
        }
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$to_move$arity$2 = function(game, state) {
        var this__36988 = this;
        return(new cljs.core.Keyword("\ufdd0'to-move")).call(null, state)
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$display$arity$2 = function(game, state) {
        var this__36989 = this;
        return clojure.pprint.pprint.call(null, (new cljs.core.Keyword("\ufdd0'board")).call(null, state))
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.aima_clojure$game$Game$initial$arity$1 = function(game) {
        var this__36990 = this;
        return cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":"\ufdd0'x", "\ufdd0'board":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'e", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'e", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'e", "\ufdd0'e"], true)], true), "\ufdd0'utility":0})
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.cljs$core$IMeta$_meta$arity$1 = function(_36954) {
        var this__36991 = this;
        return this__36991.meta36953
      };
      aima_clojure.games.tic_tac_toe.t36952.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_36954, meta36953) {
        var this__36992 = this;
        return new aima_clojure.games.tic_tac_toe.t36952(this__36992.h, this__36992.v, this__36992.k, this__36992.map__36946, this__36992.p__36898, this__36992.tic_tac_toe, meta36953)
      };
      aima_clojure.games.tic_tac_toe.t36952
    }else {
    }
    return new aima_clojure.games.tic_tac_toe.t36952(h__36951, v__36950, k__36949, map__36946__36948, p__36898, tic_tac_toe, null)
  };
  tic_tac_toe = function(p__36898) {
    switch(arguments.length) {
      case 0:
        return tic_tac_toe__0.call(this);
      case 1:
        return tic_tac_toe__1.call(this, p__36898)
    }
    throw"Invalid arity: " + arguments.length;
  };
  tic_tac_toe.cljs$lang$arity$0 = tic_tac_toe__0;
  tic_tac_toe.cljs$lang$arity$1 = tic_tac_toe__1;
  return tic_tac_toe
}();
aima_clojure.games.tic_tac_toe._main = function _main() {
  return cljs.core.println.call(null, cljs.core.take.call(null, 3, aima_clojure.games.tic_tac_toe.line.call(null, aima_clojure.games.tic_tac_toe.s, cljs.core.PersistentVector.fromArray([2, 0], true), cljs.core.PersistentVector.fromArray([-1, 0], true))))
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10718 = s;
      var limit__10719 = limit;
      var parts__10720 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10719, 1)) {
          return cljs.core.conj.call(null, parts__10720, s__10718)
        }else {
          var temp__3971__auto____10721 = cljs.core.re_find.call(null, re, s__10718);
          if(cljs.core.truth_(temp__3971__auto____10721)) {
            var m__10722 = temp__3971__auto____10721;
            var index__10723 = s__10718.indexOf(m__10722);
            var G__10724 = s__10718.substring(index__10723 + cljs.core.count.call(null, m__10722));
            var G__10725 = limit__10719 - 1;
            var G__10726 = cljs.core.conj.call(null, parts__10720, s__10718.substring(0, index__10723));
            s__10718 = G__10724;
            limit__10719 = G__10725;
            parts__10720 = G__10726;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10720, s__10718)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__10730 = s.length;
  while(true) {
    if(index__10730 === 0) {
      return""
    }else {
      var ch__10731 = cljs.core._lookup.call(null, s, index__10730 - 1, null);
      if(function() {
        var or__3824__auto____10732 = cljs.core._EQ_.call(null, ch__10731, "\n");
        if(or__3824__auto____10732) {
          return or__3824__auto____10732
        }else {
          return cljs.core._EQ_.call(null, ch__10731, "\r")
        }
      }()) {
        var G__10733 = index__10730 - 1;
        index__10730 = G__10733;
        continue
      }else {
        return s.substring(0, index__10730)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10737 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____10738 = cljs.core.not.call(null, s__10737);
    if(or__3824__auto____10738) {
      return or__3824__auto____10738
    }else {
      var or__3824__auto____10739 = cljs.core._EQ_.call(null, "", s__10737);
      if(or__3824__auto____10739) {
        return or__3824__auto____10739
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10737)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10746 = new goog.string.StringBuffer;
  var length__10747 = s.length;
  var index__10748 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10747, index__10748)) {
      return buffer__10746.toString()
    }else {
      var ch__10749 = s.charAt(index__10748);
      var temp__3971__auto____10750 = cljs.core._lookup.call(null, cmap, ch__10749, null);
      if(cljs.core.truth_(temp__3971__auto____10750)) {
        var replacement__10751 = temp__3971__auto____10750;
        buffer__10746.append([cljs.core.str(replacement__10751)].join(""))
      }else {
        buffer__10746.append(ch__10749)
      }
      var G__10752 = index__10748 + 1;
      index__10748 = G__10752;
      continue
    }
    break
  }
};
goog.provide("aima_clojure.tictactoe_frontend");
goog.require("cljs.core");
goog.require("aima_clojure.games.tic_tac_toe");
goog.require("goog.dom");
goog.require("clojure.string");
aima_clojure.tictactoe_frontend.log = function log(str) {
  return console.log(str)
};
aima_clojure.tictactoe_frontend.ctx = function ctx() {
  var surface__21580 = goog.dom.getElement("board");
  return cljs.core.PersistentVector.fromArray([surface__21580.getContext("2d"), surface__21580.width, surface__21580.height], true)
};
aima_clojure.tictactoe_frontend.fill_rect = function fill_rect(p__21581, p__21582, p__21583) {
  var vec__21598__21601 = p__21581;
  var surface__21602 = cljs.core.nth.call(null, vec__21598__21601, 0, null);
  var vec__21599__21603 = p__21582;
  var x__21604 = cljs.core.nth.call(null, vec__21599__21603, 0, null);
  var y__21605 = cljs.core.nth.call(null, vec__21599__21603, 1, null);
  var width__21606 = cljs.core.nth.call(null, vec__21599__21603, 2, null);
  var height__21607 = cljs.core.nth.call(null, vec__21599__21603, 3, null);
  var vec__21600__21608 = p__21583;
  var r__21609 = cljs.core.nth.call(null, vec__21600__21608, 0, null);
  var g__21610 = cljs.core.nth.call(null, vec__21600__21608, 1, null);
  var b__21611 = cljs.core.nth.call(null, vec__21600__21608, 2, null);
  surface__21602.fillStyle = [cljs.core.str("rgb("), cljs.core.str(r__21609), cljs.core.str(","), cljs.core.str(g__21610), cljs.core.str(","), cljs.core.str(b__21611), cljs.core.str(")")].join("");
  return surface__21602.fillRect(x__21604, y__21605, width__21606, height__21607)
};
aima_clojure.tictactoe_frontend.stroke_rect = function stroke_rect(p__21612, p__21613, line_width, p__21614) {
  var vec__21629__21632 = p__21612;
  var surface__21633 = cljs.core.nth.call(null, vec__21629__21632, 0, null);
  var vec__21630__21634 = p__21613;
  var x__21635 = cljs.core.nth.call(null, vec__21630__21634, 0, null);
  var y__21636 = cljs.core.nth.call(null, vec__21630__21634, 1, null);
  var width__21637 = cljs.core.nth.call(null, vec__21630__21634, 2, null);
  var height__21638 = cljs.core.nth.call(null, vec__21630__21634, 3, null);
  var vec__21631__21639 = p__21614;
  var r__21640 = cljs.core.nth.call(null, vec__21631__21639, 0, null);
  var g__21641 = cljs.core.nth.call(null, vec__21631__21639, 1, null);
  var b__21642 = cljs.core.nth.call(null, vec__21631__21639, 2, null);
  surface__21633.strokeStyle = [cljs.core.str("rgb("), cljs.core.str(r__21640), cljs.core.str(","), cljs.core.str(g__21641), cljs.core.str(","), cljs.core.str(b__21642), cljs.core.str(")")].join("");
  surface__21633.lineWidth = line_width;
  return surface__21633.strokeRect(x__21635, y__21636, width__21637, height__21638)
};
aima_clojure.tictactoe_frontend.fill_circle = function fill_circle(p__21643, coords, p__21644) {
  var vec__21658__21660 = p__21643;
  var surface__21661 = cljs.core.nth.call(null, vec__21658__21660, 0, null);
  var vec__21659__21662 = p__21644;
  var r__21663 = cljs.core.nth.call(null, vec__21659__21662, 0, null);
  var g__21664 = cljs.core.nth.call(null, vec__21659__21662, 1, null);
  var b__21665 = cljs.core.nth.call(null, vec__21659__21662, 2, null);
  var vec__21666__21667 = coords;
  var x__21668 = cljs.core.nth.call(null, vec__21666__21667, 0, null);
  var y__21669 = cljs.core.nth.call(null, vec__21666__21667, 1, null);
  var d__21670 = cljs.core.nth.call(null, vec__21666__21667, 2, null);
  surface__21661.fillStyle = [cljs.core.str("rgb("), cljs.core.str(r__21663), cljs.core.str(","), cljs.core.str(g__21664), cljs.core.str(","), cljs.core.str(b__21665), cljs.core.str(")")].join("");
  surface__21661.beginPath();
  surface__21661.arc(x__21668, y__21669, d__21670, 0, 2 * Math.PI, true);
  surface__21661.closePath();
  return surface__21661.fill()
};
aima_clojure.tictactoe_frontend.g = aima_clojure.games.tic_tac_toe.tic_tac_toe.call(null);
aima_clojure.tictactoe_frontend.playGame = function playGame() {
  var board__21672 = aima_clojure.tictactoe_frontend.ctx.call(null);
  return aima_clojure.tictactoe_frontend.fill_rect.call(null, board__21672, cljs.core.PersistentVector.fromArray([0, 0, 30, 20], true), cljs.core.PersistentVector.fromArray([255, 255, 255], true))
};
goog.exportSymbol("aima_clojure.tictactoe_frontend.playGame", aima_clojure.tictactoe_frontend.playGame);
aima_clojure.tictactoe_frontend.playGame.call(null);
