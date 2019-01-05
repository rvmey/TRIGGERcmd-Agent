(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};


},{}],2:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var emptyObject = require('fbjs/lib/emptyObject');
var _invariant = require('fbjs/lib/invariant');

if (process.env.NODE_ENV !== 'production') {
  var warning = require('fbjs/lib/warning');
}

var MIXINS_KEY = 'mixins';

// Helper function to allow the creation of anonymous functions which do not
// have .name set to the name of the variable being assigned to.
function identity(fn) {
  return fn;
}

var ReactPropTypeLocationNames;
if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
} else {
  ReactPropTypeLocationNames = {};
}

function factory(ReactComponent, isValidElement, ReactNoopUpdateQueue) {
  /**
   * Policies that describe methods in `ReactClassInterface`.
   */

  var injectedMixins = [];

  /**
   * Composite components are higher-level components that compose other composite
   * or host components.
   *
   * To create a new type of `ReactClass`, pass a specification of
   * your new class to `React.createClass`. The only requirement of your class
   * specification is that you implement a `render` method.
   *
   *   var MyComponent = React.createClass({
   *     render: function() {
   *       return <div>Hello World</div>;
   *     }
   *   });
   *
   * The class specification supports a specific protocol of methods that have
   * special meaning (e.g. `render`). See `ReactClassInterface` for
   * more the comprehensive protocol. Any other properties and methods in the
   * class specification will be available on the prototype.
   *
   * @interface ReactClassInterface
   * @internal
   */
  var ReactClassInterface = {
    /**
     * An array of Mixin objects to include when defining your component.
     *
     * @type {array}
     * @optional
     */
    mixins: 'DEFINE_MANY',

    /**
     * An object containing properties and methods that should be defined on
     * the component's constructor instead of its prototype (static methods).
     *
     * @type {object}
     * @optional
     */
    statics: 'DEFINE_MANY',

    /**
     * Definition of prop types for this component.
     *
     * @type {object}
     * @optional
     */
    propTypes: 'DEFINE_MANY',

    /**
     * Definition of context types for this component.
     *
     * @type {object}
     * @optional
     */
    contextTypes: 'DEFINE_MANY',

    /**
     * Definition of context types this component sets for its children.
     *
     * @type {object}
     * @optional
     */
    childContextTypes: 'DEFINE_MANY',

    // ==== Definition methods ====

    /**
     * Invoked when the component is mounted. Values in the mapping will be set on
     * `this.props` if that prop is not specified (i.e. using an `in` check).
     *
     * This method is invoked before `getInitialState` and therefore cannot rely
     * on `this.state` or use `this.setState`.
     *
     * @return {object}
     * @optional
     */
    getDefaultProps: 'DEFINE_MANY_MERGED',

    /**
     * Invoked once before the component is mounted. The return value will be used
     * as the initial value of `this.state`.
     *
     *   getInitialState: function() {
     *     return {
     *       isOn: false,
     *       fooBaz: new BazFoo()
     *     }
     *   }
     *
     * @return {object}
     * @optional
     */
    getInitialState: 'DEFINE_MANY_MERGED',

    /**
     * @return {object}
     * @optional
     */
    getChildContext: 'DEFINE_MANY_MERGED',

    /**
     * Uses props from `this.props` and state from `this.state` to render the
     * structure of the component.
     *
     * No guarantees are made about when or how often this method is invoked, so
     * it must not have side effects.
     *
     *   render: function() {
     *     var name = this.props.name;
     *     return <div>Hello, {name}!</div>;
     *   }
     *
     * @return {ReactComponent}
     * @required
     */
    render: 'DEFINE_ONCE',

    // ==== Delegate methods ====

    /**
     * Invoked when the component is initially created and about to be mounted.
     * This may have side effects, but any external subscriptions or data created
     * by this method must be cleaned up in `componentWillUnmount`.
     *
     * @optional
     */
    componentWillMount: 'DEFINE_MANY',

    /**
     * Invoked when the component has been mounted and has a DOM representation.
     * However, there is no guarantee that the DOM node is in the document.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been mounted (initialized and rendered) for the first time.
     *
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidMount: 'DEFINE_MANY',

    /**
     * Invoked before the component receives new props.
     *
     * Use this as an opportunity to react to a prop transition by updating the
     * state using `this.setState`. Current props are accessed via `this.props`.
     *
     *   componentWillReceiveProps: function(nextProps, nextContext) {
     *     this.setState({
     *       likesIncreasing: nextProps.likeCount > this.props.likeCount
     *     });
     *   }
     *
     * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
     * transition may cause a state change, but the opposite is not true. If you
     * need it, you are probably looking for `componentWillUpdate`.
     *
     * @param {object} nextProps
     * @optional
     */
    componentWillReceiveProps: 'DEFINE_MANY',

    /**
     * Invoked while deciding if the component should be updated as a result of
     * receiving new props, state and/or context.
     *
     * Use this as an opportunity to `return false` when you're certain that the
     * transition to the new props/state/context will not require a component
     * update.
     *
     *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
     *     return !equal(nextProps, this.props) ||
     *       !equal(nextState, this.state) ||
     *       !equal(nextContext, this.context);
     *   }
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @return {boolean} True if the component should update.
     * @optional
     */
    shouldComponentUpdate: 'DEFINE_ONCE',

    /**
     * Invoked when the component is about to update due to a transition from
     * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
     * and `nextContext`.
     *
     * Use this as an opportunity to perform preparation before an update occurs.
     *
     * NOTE: You **cannot** use `this.setState()` in this method.
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @param {ReactReconcileTransaction} transaction
     * @optional
     */
    componentWillUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component's DOM representation has been updated.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been updated.
     *
     * @param {object} prevProps
     * @param {?object} prevState
     * @param {?object} prevContext
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component is about to be removed from its parent and have
     * its DOM representation destroyed.
     *
     * Use this as an opportunity to deallocate any external resources.
     *
     * NOTE: There is no `componentDidUnmount` since your component will have been
     * destroyed by that point.
     *
     * @optional
     */
    componentWillUnmount: 'DEFINE_MANY',

    /**
     * Replacement for (deprecated) `componentWillMount`.
     *
     * @optional
     */
    UNSAFE_componentWillMount: 'DEFINE_MANY',

    /**
     * Replacement for (deprecated) `componentWillReceiveProps`.
     *
     * @optional
     */
    UNSAFE_componentWillReceiveProps: 'DEFINE_MANY',

    /**
     * Replacement for (deprecated) `componentWillUpdate`.
     *
     * @optional
     */
    UNSAFE_componentWillUpdate: 'DEFINE_MANY',

    // ==== Advanced methods ====

    /**
     * Updates the component's currently mounted DOM representation.
     *
     * By default, this implements React's rendering and reconciliation algorithm.
     * Sophisticated clients may wish to override this.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     * @overridable
     */
    updateComponent: 'OVERRIDE_BASE'
  };

  /**
   * Similar to ReactClassInterface but for static methods.
   */
  var ReactClassStaticInterface = {
    /**
     * This method is invoked after a component is instantiated and when it
     * receives new props. Return an object to update state in response to
     * prop changes. Return null to indicate no change to state.
     *
     * If an object is returned, its keys will be merged into the existing state.
     *
     * @return {object || null}
     * @optional
     */
    getDerivedStateFromProps: 'DEFINE_MANY_MERGED'
  };

  /**
   * Mapping from class specification keys to special processing functions.
   *
   * Although these are declared like instance properties in the specification
   * when defining classes using `React.createClass`, they are actually static
   * and are accessible on the constructor instead of the prototype. Despite
   * being static, they must be defined outside of the "statics" key under
   * which all other static methods are defined.
   */
  var RESERVED_SPEC_KEYS = {
    displayName: function(Constructor, displayName) {
      Constructor.displayName = displayName;
    },
    mixins: function(Constructor, mixins) {
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          mixSpecIntoComponent(Constructor, mixins[i]);
        }
      }
    },
    childContextTypes: function(Constructor, childContextTypes) {
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, childContextTypes, 'childContext');
      }
      Constructor.childContextTypes = _assign(
        {},
        Constructor.childContextTypes,
        childContextTypes
      );
    },
    contextTypes: function(Constructor, contextTypes) {
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, contextTypes, 'context');
      }
      Constructor.contextTypes = _assign(
        {},
        Constructor.contextTypes,
        contextTypes
      );
    },
    /**
     * Special case getDefaultProps which should move into statics but requires
     * automatic merging.
     */
    getDefaultProps: function(Constructor, getDefaultProps) {
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps = createMergedResultFunction(
          Constructor.getDefaultProps,
          getDefaultProps
        );
      } else {
        Constructor.getDefaultProps = getDefaultProps;
      }
    },
    propTypes: function(Constructor, propTypes) {
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, propTypes, 'prop');
      }
      Constructor.propTypes = _assign({}, Constructor.propTypes, propTypes);
    },
    statics: function(Constructor, statics) {
      mixStaticSpecIntoComponent(Constructor, statics);
    },
    autobind: function() {}
  };

  function validateTypeDef(Constructor, typeDef, location) {
    for (var propName in typeDef) {
      if (typeDef.hasOwnProperty(propName)) {
        // use a warning instead of an _invariant so components
        // don't show up in prod but only in __DEV__
        if (process.env.NODE_ENV !== 'production') {
          warning(
            typeof typeDef[propName] === 'function',
            '%s: %s type `%s` is invalid; it must be a function, usually from ' +
              'React.PropTypes.',
            Constructor.displayName || 'ReactClass',
            ReactPropTypeLocationNames[location],
            propName
          );
        }
      }
    }
  }

  function validateMethodOverride(isAlreadyDefined, name) {
    var specPolicy = ReactClassInterface.hasOwnProperty(name)
      ? ReactClassInterface[name]
      : null;

    // Disallow overriding of base class methods unless explicitly allowed.
    if (ReactClassMixin.hasOwnProperty(name)) {
      _invariant(
        specPolicy === 'OVERRIDE_BASE',
        'ReactClassInterface: You are attempting to override ' +
          '`%s` from your class specification. Ensure that your method names ' +
          'do not overlap with React methods.',
        name
      );
    }

    // Disallow defining methods more than once unless explicitly allowed.
    if (isAlreadyDefined) {
      _invariant(
        specPolicy === 'DEFINE_MANY' || specPolicy === 'DEFINE_MANY_MERGED',
        'ReactClassInterface: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be due ' +
          'to a mixin.',
        name
      );
    }
  }

  /**
   * Mixin helper which handles policy validation and reserved
   * specification keys when building React classes.
   */
  function mixSpecIntoComponent(Constructor, spec) {
    if (!spec) {
      if (process.env.NODE_ENV !== 'production') {
        var typeofSpec = typeof spec;
        var isMixinValid = typeofSpec === 'object' && spec !== null;

        if (process.env.NODE_ENV !== 'production') {
          warning(
            isMixinValid,
            "%s: You're attempting to include a mixin that is either null " +
              'or not an object. Check the mixins included by the component, ' +
              'as well as any mixins they include themselves. ' +
              'Expected object but got %s.',
            Constructor.displayName || 'ReactClass',
            spec === null ? null : typeofSpec
          );
        }
      }

      return;
    }

    _invariant(
      typeof spec !== 'function',
      "ReactClass: You're attempting to " +
        'use a component class or function as a mixin. Instead, just use a ' +
        'regular object.'
    );
    _invariant(
      !isValidElement(spec),
      "ReactClass: You're attempting to " +
        'use a component as a mixin. Instead, just use a regular object.'
    );

    var proto = Constructor.prototype;
    var autoBindPairs = proto.__reactAutoBindPairs;

    // By handling mixins before any other properties, we ensure the same
    // chaining order is applied to methods with DEFINE_MANY policy, whether
    // mixins are listed before or after these methods in the spec.
    if (spec.hasOwnProperty(MIXINS_KEY)) {
      RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
    }

    for (var name in spec) {
      if (!spec.hasOwnProperty(name)) {
        continue;
      }

      if (name === MIXINS_KEY) {
        // We have already handled mixins in a special case above.
        continue;
      }

      var property = spec[name];
      var isAlreadyDefined = proto.hasOwnProperty(name);
      validateMethodOverride(isAlreadyDefined, name);

      if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
        RESERVED_SPEC_KEYS[name](Constructor, property);
      } else {
        // Setup methods on prototype:
        // The following member methods should not be automatically bound:
        // 1. Expected ReactClass methods (in the "interface").
        // 2. Overridden methods (that were mixed in).
        var isReactClassMethod = ReactClassInterface.hasOwnProperty(name);
        var isFunction = typeof property === 'function';
        var shouldAutoBind =
          isFunction &&
          !isReactClassMethod &&
          !isAlreadyDefined &&
          spec.autobind !== false;

        if (shouldAutoBind) {
          autoBindPairs.push(name, property);
          proto[name] = property;
        } else {
          if (isAlreadyDefined) {
            var specPolicy = ReactClassInterface[name];

            // These cases should already be caught by validateMethodOverride.
            _invariant(
              isReactClassMethod &&
                (specPolicy === 'DEFINE_MANY_MERGED' ||
                  specPolicy === 'DEFINE_MANY'),
              'ReactClass: Unexpected spec policy %s for key %s ' +
                'when mixing in component specs.',
              specPolicy,
              name
            );

            // For methods which are defined more than once, call the existing
            // methods before calling the new property, merging if appropriate.
            if (specPolicy === 'DEFINE_MANY_MERGED') {
              proto[name] = createMergedResultFunction(proto[name], property);
            } else if (specPolicy === 'DEFINE_MANY') {
              proto[name] = createChainedFunction(proto[name], property);
            }
          } else {
            proto[name] = property;
            if (process.env.NODE_ENV !== 'production') {
              // Add verbose displayName to the function, which helps when looking
              // at profiling tools.
              if (typeof property === 'function' && spec.displayName) {
                proto[name].displayName = spec.displayName + '_' + name;
              }
            }
          }
        }
      }
    }
  }

  function mixStaticSpecIntoComponent(Constructor, statics) {
    if (!statics) {
      return;
    }

    for (var name in statics) {
      var property = statics[name];
      if (!statics.hasOwnProperty(name)) {
        continue;
      }

      var isReserved = name in RESERVED_SPEC_KEYS;
      _invariant(
        !isReserved,
        'ReactClass: You are attempting to define a reserved ' +
          'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' +
          'as an instance property instead; it will still be accessible on the ' +
          'constructor.',
        name
      );

      var isAlreadyDefined = name in Constructor;
      if (isAlreadyDefined) {
        var specPolicy = ReactClassStaticInterface.hasOwnProperty(name)
          ? ReactClassStaticInterface[name]
          : null;

        _invariant(
          specPolicy === 'DEFINE_MANY_MERGED',
          'ReactClass: You are attempting to define ' +
            '`%s` on your component more than once. This conflict may be ' +
            'due to a mixin.',
          name
        );

        Constructor[name] = createMergedResultFunction(Constructor[name], property);

        return;
      }

      Constructor[name] = property;
    }
  }

  /**
   * Merge two objects, but throw if both contain the same key.
   *
   * @param {object} one The first object, which is mutated.
   * @param {object} two The second object
   * @return {object} one after it has been mutated to contain everything in two.
   */
  function mergeIntoWithNoDuplicateKeys(one, two) {
    _invariant(
      one && two && typeof one === 'object' && typeof two === 'object',
      'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'
    );

    for (var key in two) {
      if (two.hasOwnProperty(key)) {
        _invariant(
          one[key] === undefined,
          'mergeIntoWithNoDuplicateKeys(): ' +
            'Tried to merge two objects with the same key: `%s`. This conflict ' +
            'may be due to a mixin; in particular, this may be caused by two ' +
            'getInitialState() or getDefaultProps() methods returning objects ' +
            'with clashing keys.',
          key
        );
        one[key] = two[key];
      }
    }
    return one;
  }

  /**
   * Creates a function that invokes two functions and merges their return values.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createMergedResultFunction(one, two) {
    return function mergedResult() {
      var a = one.apply(this, arguments);
      var b = two.apply(this, arguments);
      if (a == null) {
        return b;
      } else if (b == null) {
        return a;
      }
      var c = {};
      mergeIntoWithNoDuplicateKeys(c, a);
      mergeIntoWithNoDuplicateKeys(c, b);
      return c;
    };
  }

  /**
   * Creates a function that invokes two functions and ignores their return vales.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createChainedFunction(one, two) {
    return function chainedFunction() {
      one.apply(this, arguments);
      two.apply(this, arguments);
    };
  }

  /**
   * Binds a method to the component.
   *
   * @param {object} component Component whose method is going to be bound.
   * @param {function} method Method to be bound.
   * @return {function} The bound method.
   */
  function bindAutoBindMethod(component, method) {
    var boundMethod = method.bind(component);
    if (process.env.NODE_ENV !== 'production') {
      boundMethod.__reactBoundContext = component;
      boundMethod.__reactBoundMethod = method;
      boundMethod.__reactBoundArguments = null;
      var componentName = component.constructor.displayName;
      var _bind = boundMethod.bind;
      boundMethod.bind = function(newThis) {
        for (
          var _len = arguments.length,
            args = Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
          _key < _len;
          _key++
        ) {
          args[_key - 1] = arguments[_key];
        }

        // User is trying to bind() an autobound method; we effectively will
        // ignore the value of "this" that the user is trying to use, so
        // let's warn.
        if (newThis !== component && newThis !== null) {
          if (process.env.NODE_ENV !== 'production') {
            warning(
              false,
              'bind(): React component methods may only be bound to the ' +
                'component instance. See %s',
              componentName
            );
          }
        } else if (!args.length) {
          if (process.env.NODE_ENV !== 'production') {
            warning(
              false,
              'bind(): You are binding a component method to the component. ' +
                'React does this for you automatically in a high-performance ' +
                'way, so you can safely remove this call. See %s',
              componentName
            );
          }
          return boundMethod;
        }
        var reboundMethod = _bind.apply(boundMethod, arguments);
        reboundMethod.__reactBoundContext = component;
        reboundMethod.__reactBoundMethod = method;
        reboundMethod.__reactBoundArguments = args;
        return reboundMethod;
      };
    }
    return boundMethod;
  }

  /**
   * Binds all auto-bound methods in a component.
   *
   * @param {object} component Component whose method is going to be bound.
   */
  function bindAutoBindMethods(component) {
    var pairs = component.__reactAutoBindPairs;
    for (var i = 0; i < pairs.length; i += 2) {
      var autoBindKey = pairs[i];
      var method = pairs[i + 1];
      component[autoBindKey] = bindAutoBindMethod(component, method);
    }
  }

  var IsMountedPreMixin = {
    componentDidMount: function() {
      this.__isMounted = true;
    }
  };

  var IsMountedPostMixin = {
    componentWillUnmount: function() {
      this.__isMounted = false;
    }
  };

  /**
   * Add more to the ReactClass base class. These are all legacy features and
   * therefore not already part of the modern ReactComponent.
   */
  var ReactClassMixin = {
    /**
     * TODO: This will be deprecated because state should always keep a consistent
     * type signature and the only use case for this, is to avoid that.
     */
    replaceState: function(newState, callback) {
      this.updater.enqueueReplaceState(this, newState, callback);
    },

    /**
     * Checks whether or not this composite component is mounted.
     * @return {boolean} True if mounted, false otherwise.
     * @protected
     * @final
     */
    isMounted: function() {
      if (process.env.NODE_ENV !== 'production') {
        warning(
          this.__didWarnIsMounted,
          '%s: isMounted is deprecated. Instead, make sure to clean up ' +
            'subscriptions and pending requests in componentWillUnmount to ' +
            'prevent memory leaks.',
          (this.constructor && this.constructor.displayName) ||
            this.name ||
            'Component'
        );
        this.__didWarnIsMounted = true;
      }
      return !!this.__isMounted;
    }
  };

  var ReactClassComponent = function() {};
  _assign(
    ReactClassComponent.prototype,
    ReactComponent.prototype,
    ReactClassMixin
  );

  /**
   * Creates a composite component class given a class specification.
   * See https://facebook.github.io/react/docs/top-level-api.html#react.createclass
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  function createClass(spec) {
    // To keep our warnings more understandable, we'll use a little hack here to
    // ensure that Constructor.name !== 'Constructor'. This makes sure we don't
    // unnecessarily identify a class without displayName as 'Constructor'.
    var Constructor = identity(function(props, context, updater) {
      // This constructor gets overridden by mocks. The argument is used
      // by mocks to assert on what gets mounted.

      if (process.env.NODE_ENV !== 'production') {
        warning(
          this instanceof Constructor,
          'Something is calling a React component directly. Use a factory or ' +
            'JSX instead. See: https://fb.me/react-legacyfactory'
        );
      }

      // Wire up auto-binding
      if (this.__reactAutoBindPairs.length) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;

      this.state = null;

      // ReactClasses doesn't have constructors. Instead, they use the
      // getInitialState and componentWillMount methods for initialization.

      var initialState = this.getInitialState ? this.getInitialState() : null;
      if (process.env.NODE_ENV !== 'production') {
        // We allow auto-mocks to proceed as if they're returning null.
        if (
          initialState === undefined &&
          this.getInitialState._isMockFunction
        ) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      _invariant(
        typeof initialState === 'object' && !Array.isArray(initialState),
        '%s.getInitialState(): must return an object or null',
        Constructor.displayName || 'ReactCompositeComponent'
      );

      this.state = initialState;
    });
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;
    Constructor.prototype.__reactAutoBindPairs = [];

    injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));

    mixSpecIntoComponent(Constructor, IsMountedPreMixin);
    mixSpecIntoComponent(Constructor, spec);
    mixSpecIntoComponent(Constructor, IsMountedPostMixin);

    // Initialize the defaultProps property after all mixins have been merged.
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    if (process.env.NODE_ENV !== 'production') {
      // This is a tag to indicate that the use of these method names is ok,
      // since it's used with createClass. If it's not, then it's likely a
      // mistake so we'll warn you to use the static property, property
      // initializer or constructor respectively.
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps.isReactClassApproved = {};
      }
      if (Constructor.prototype.getInitialState) {
        Constructor.prototype.getInitialState.isReactClassApproved = {};
      }
    }

    _invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    );

    if (process.env.NODE_ENV !== 'production') {
      warning(
        !Constructor.prototype.componentShouldUpdate,
        '%s has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.',
        spec.displayName || 'A component'
      );
      warning(
        !Constructor.prototype.componentWillRecieveProps,
        '%s has a method called ' +
          'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
        spec.displayName || 'A component'
      );
      warning(
        !Constructor.prototype.UNSAFE_componentWillRecieveProps,
        '%s has a method called UNSAFE_componentWillRecieveProps(). ' +
          'Did you mean UNSAFE_componentWillReceiveProps()?',
        spec.displayName || 'A component'
      );
    }

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    return Constructor;
  }

  return createClass;
}

module.exports = factory;


}).call(this,require("gzNCgL"))
},{"fbjs/lib/emptyObject":4,"fbjs/lib/invariant":5,"fbjs/lib/warning":6,"gzNCgL":1,"object-assign":7}],3:[function(require,module,exports){
"use strict";

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;

},{}],4:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var emptyObject = {};

if (process.env.NODE_ENV !== 'production') {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;

}).call(this,require("gzNCgL"))
},{"gzNCgL":1}],5:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (process.env.NODE_ENV !== 'production') {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;

}).call(this,require("gzNCgL"))
},{"gzNCgL":1}],6:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var emptyFunction = require('./emptyFunction');

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  var printWarning = function printWarning(format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  warning = function warning(condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }

    if (format.indexOf('Failed Composite propType: ') === 0) {
      return; // Ignore CompositeComponent proptype check.
    }

    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = warning;

}).call(this,require("gzNCgL"))
},{"./emptyFunction":3,"gzNCgL":1}],7:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


},{}],8:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var printWarning = function() {};

if (process.env.NODE_ENV !== 'production') {
  var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');
  var loggedTypeFailures = {};

  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (process.env.NODE_ENV !== 'production') {
    for (var typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            var err = Error(
              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.'
            );
            err.name = 'Invariant Violation';
            throw err;
          }
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        if (error && !(error instanceof Error)) {
          printWarning(
            (componentName || 'React class') + ': type specification of ' +
            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
            'You may have forgotten to pass an argument to the type checker ' +
            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
            'shape all require an argument).'
          )

        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          printWarning(
            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
          );
        }
      }
    }
  }
}

module.exports = checkPropTypes;


}).call(this,require("gzNCgL"))
},{"./lib/ReactPropTypesSecret":11,"gzNCgL":1}],9:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// React 15.5 references this module, and assumes PropTypes are still callable in production.
// Therefore we re-export development-only version with all the PropTypes checks here.
// However if one is migrating to the `prop-types` npm library, they will go through the
// `index.js` entry point, and it will branch depending on the environment.
var factory = require('./factoryWithTypeCheckers');
module.exports = function(isValidElement) {
  // It is still allowed in 15.5.
  var throwOnDirectAccess = false;
  return factory(isValidElement, throwOnDirectAccess);
};


},{"./factoryWithTypeCheckers":10}],10:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var assign = require('object-assign');

var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');
var checkPropTypes = require('./checkPropTypes');

var printWarning = function() {};

if (process.env.NODE_ENV !== 'production') {
  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

function emptyFunctionThatReturnsNull() {
  return null;
}

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message) {
    this.message = message;
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (process.env.NODE_ENV !== 'production') {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          var err = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
          err.name = 'Invariant Violation';
          throw err;
        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            printWarning(
              'You are manually calling a React.PropTypes validation ' +
              'function for the `' + propFullName + '` prop on `' + componentName  + '`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      process.env.NODE_ENV !== 'production' ? printWarning('Invalid argument supplied to oneOf, expected an instance of array.') : void 0;
      return emptyFunctionThatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues);
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (propValue.hasOwnProperty(key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
      process.env.NODE_ENV !== 'production' ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
      return emptyFunctionThatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        printWarning(
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
        );
        return emptyFunctionThatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret) == null) {
          return null;
        }
      }

      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (!checker) {
          continue;
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from
      // props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


}).call(this,require("gzNCgL"))
},{"./checkPropTypes":8,"./lib/ReactPropTypesSecret":11,"gzNCgL":1,"object-assign":7}],11:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


},{}],12:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = ('' + key).replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });

  return '$' + escapedString;
}

/**
 * Unescape and unwrap key for human-readable display
 *
 * @param {string} key to unescape.
 * @return {string} the unescaped key.
 */
function unescape(key) {
  var unescapeRegex = /(=0|=2)/g;
  var unescaperLookup = {
    '=0': '=',
    '=2': ':'
  };
  var keySubstring = key[0] === '.' && key[1] === '$' ? key.substring(2) : key.substring(1);

  return ('' + keySubstring).replace(unescapeRegex, function (match) {
    return unescaperLookup[match];
  });
}

var KeyEscapeUtils = {
  escape: escape,
  unescape: unescape
};

module.exports = KeyEscapeUtils;

},{}],13:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var invariant = require('fbjs/lib/invariant');

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function (copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function (a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function (a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fourArgumentPooler = function (a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

var standardReleaser = function (instance) {
  var Klass = this;
  !(instance instanceof Klass) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Trying to release an instance into a pool of a different type.') : _prodInvariant('25') : void 0;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function (CopyConstructor, pooler) {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler
};

module.exports = PooledClass;

}).call(this,require("gzNCgL"))
},{"./reactProdInvariant":34,"fbjs/lib/invariant":5,"gzNCgL":1}],14:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var ReactBaseClasses = require('./ReactBaseClasses');
var ReactChildren = require('./ReactChildren');
var ReactDOMFactories = require('./ReactDOMFactories');
var ReactElement = require('./ReactElement');
var ReactPropTypes = require('./ReactPropTypes');
var ReactVersion = require('./ReactVersion');

var createReactClass = require('./createClass');
var onlyChild = require('./onlyChild');

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (process.env.NODE_ENV !== 'production') {
  var lowPriorityWarning = require('./lowPriorityWarning');
  var canDefineProperty = require('./canDefineProperty');
  var ReactElementValidator = require('./ReactElementValidator');
  var didWarnPropTypesDeprecated = false;
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var __spread = _assign;
var createMixin = function (mixin) {
  return mixin;
};

if (process.env.NODE_ENV !== 'production') {
  var warnedForSpread = false;
  var warnedForCreateMixin = false;
  __spread = function () {
    lowPriorityWarning(warnedForSpread, 'React.__spread is deprecated and should not be used. Use ' + 'Object.assign directly or another helper function with similar ' + 'semantics. You may be seeing this warning due to your compiler. ' + 'See https://fb.me/react-spread-deprecation for more details.');
    warnedForSpread = true;
    return _assign.apply(null, arguments);
  };

  createMixin = function (mixin) {
    lowPriorityWarning(warnedForCreateMixin, 'React.createMixin is deprecated and should not be used. ' + 'In React v16.0, it will be removed. ' + 'You can use this mixin directly instead. ' + 'See https://fb.me/createmixin-was-never-implemented for more info.');
    warnedForCreateMixin = true;
    return mixin;
  };
}

var React = {
  // Modern

  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild
  },

  Component: ReactBaseClasses.Component,
  PureComponent: ReactBaseClasses.PureComponent,

  createElement: createElement,
  cloneElement: cloneElement,
  isValidElement: ReactElement.isValidElement,

  // Classic

  PropTypes: ReactPropTypes,
  createClass: createReactClass,
  createFactory: createFactory,
  createMixin: createMixin,

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  DOM: ReactDOMFactories,

  version: ReactVersion,

  // Deprecated hook for JSX spread, don't use this for anything.
  __spread: __spread
};

if (process.env.NODE_ENV !== 'production') {
  var warnedForCreateClass = false;
  if (canDefineProperty) {
    Object.defineProperty(React, 'PropTypes', {
      get: function () {
        lowPriorityWarning(didWarnPropTypesDeprecated, 'Accessing PropTypes via the main React package is deprecated,' + ' and will be removed in  React v16.0.' + ' Use the latest available v15.* prop-types package from npm instead.' + ' For info on usage, compatibility, migration and more, see ' + 'https://fb.me/prop-types-docs');
        didWarnPropTypesDeprecated = true;
        return ReactPropTypes;
      }
    });

    Object.defineProperty(React, 'createClass', {
      get: function () {
        lowPriorityWarning(warnedForCreateClass, 'Accessing createClass via the main React package is deprecated,' + ' and will be removed in React v16.0.' + " Use a plain JavaScript class instead. If you're not yet " + 'ready to migrate, create-react-class v15.* is available ' + 'on npm as a temporary, drop-in replacement. ' + 'For more info see https://fb.me/react-create-class');
        warnedForCreateClass = true;
        return createReactClass;
      }
    });
  }

  // React.DOM factories are deprecated. Wrap these methods so that
  // invocations of the React.DOM namespace and alert users to switch
  // to the `react-dom-factories` package.
  React.DOM = {};
  var warnedForFactories = false;
  Object.keys(ReactDOMFactories).forEach(function (factory) {
    React.DOM[factory] = function () {
      if (!warnedForFactories) {
        lowPriorityWarning(false, 'Accessing factories like React.DOM.%s has been deprecated ' + 'and will be removed in v16.0+. Use the ' + 'react-dom-factories package instead. ' + ' Version 1.0 provides a drop-in replacement.' + ' For more info, see https://fb.me/react-dom-factories', factory);
        warnedForFactories = true;
      }
      return ReactDOMFactories[factory].apply(ReactDOMFactories, arguments);
    };
  });
}

module.exports = React;

}).call(this,require("gzNCgL"))
},{"./ReactBaseClasses":15,"./ReactChildren":16,"./ReactDOMFactories":19,"./ReactElement":20,"./ReactElementValidator":22,"./ReactPropTypes":25,"./ReactVersion":27,"./canDefineProperty":28,"./createClass":30,"./lowPriorityWarning":32,"./onlyChild":33,"gzNCgL":1,"object-assign":7}],15:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');

var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue');

var canDefineProperty = require('./canDefineProperty');
var emptyObject = require('fbjs/lib/emptyObject');
var invariant = require('fbjs/lib/invariant');
var lowPriorityWarning = require('./lowPriorityWarning');

/**
 * Base class helpers for the updating state of a component.
 */
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

ReactComponent.prototype.isReactComponent = {};

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
ReactComponent.prototype.setState = function (partialState, callback) {
  !(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'setState(...): takes an object of state variables to update or a function which returns an object of state variables.') : _prodInvariant('85') : void 0;
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'setState');
  }
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
ReactComponent.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'forceUpdate');
  }
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (process.env.NODE_ENV !== 'production') {
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };
  var defineDeprecationWarning = function (methodName, info) {
    if (canDefineProperty) {
      Object.defineProperty(ReactComponent.prototype, methodName, {
        get: function () {
          lowPriorityWarning(false, '%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);
          return undefined;
        }
      });
    }
  };
  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

/**
 * Base class helpers for the updating state of a component.
 */
function ReactPureComponent(props, context, updater) {
  // Duplicated from ReactComponent.
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

function ComponentDummy() {}
ComponentDummy.prototype = ReactComponent.prototype;
ReactPureComponent.prototype = new ComponentDummy();
ReactPureComponent.prototype.constructor = ReactPureComponent;
// Avoid an extra prototype jump for these methods.
_assign(ReactPureComponent.prototype, ReactComponent.prototype);
ReactPureComponent.prototype.isPureReactComponent = true;

module.exports = {
  Component: ReactComponent,
  PureComponent: ReactPureComponent
};

}).call(this,require("gzNCgL"))
},{"./ReactNoopUpdateQueue":23,"./canDefineProperty":28,"./lowPriorityWarning":32,"./reactProdInvariant":34,"fbjs/lib/emptyObject":4,"fbjs/lib/invariant":5,"gzNCgL":1,"object-assign":7}],16:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var PooledClass = require('./PooledClass');
var ReactElement = require('./ReactElement');

var emptyFunction = require('fbjs/lib/emptyFunction');
var traverseAllChildren = require('./traverseAllChildren');

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var fourArgumentPooler = PooledClass.fourArgumentPooler;

var userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.func = forEachFunction;
  this.context = forEachContext;
  this.count = 0;
}
ForEachBookKeeping.prototype.destructor = function () {
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(bookKeeping, child, name) {
  var func = bookKeeping.func,
      context = bookKeeping.context;

  func.call(context, child, bookKeeping.count++);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.foreach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }
  var traverseContext = ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, keyPrefix, mapFunction, mapContext) {
  this.result = mapResult;
  this.keyPrefix = keyPrefix;
  this.func = mapFunction;
  this.context = mapContext;
  this.count = 0;
}
MapBookKeeping.prototype.destructor = function () {
  this.result = null;
  this.keyPrefix = null;
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(MapBookKeeping, fourArgumentPooler);

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var result = bookKeeping.result,
      keyPrefix = bookKeeping.keyPrefix,
      func = bookKeeping.func,
      context = bookKeeping.context;


  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, emptyFunction.thatReturnsArgument);
  } else if (mappedChild != null) {
    if (ReactElement.isValidElement(mappedChild)) {
      mappedChild = ReactElement.cloneAndReplaceKey(mappedChild,
      // Keep both the (mapped) and old keys if they differ, just as
      // traverseAllChildren used to do for objects as children
      keyPrefix + (mappedChild.key && (!child || child.key !== mappedChild.key) ? escapeUserProvidedKey(mappedChild.key) + '/' : '') + childKey);
    }
    result.push(mappedChild);
  }
}

function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  var escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  var traverseContext = MapBookKeeping.getPooled(array, escapedPrefix, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.map
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, func, context);
  return result;
}

function forEachSingleChildDummy(traverseContext, child, name) {
  return null;
}

/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.count
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */
function countChildren(children, context) {
  return traverseAllChildren(children, forEachSingleChildDummy, null);
}

/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.toarray
 */
function toArray(children) {
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, emptyFunction.thatReturnsArgument);
  return result;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren,
  mapIntoWithKeyPrefixInternal: mapIntoWithKeyPrefixInternal,
  count: countChildren,
  toArray: toArray
};

module.exports = ReactChildren;

},{"./PooledClass":13,"./ReactElement":20,"./traverseAllChildren":35,"fbjs/lib/emptyFunction":3}],17:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactCurrentOwner = require('./ReactCurrentOwner');

var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

function isNative(fn) {
  // Based on isNative() from Lodash
  var funcToString = Function.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var reIsNative = RegExp('^' + funcToString
  // Take an example native function source for comparison
  .call(hasOwnProperty
  // Strip regex characters so we can use it for regex
  ).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'
  // Remove hasOwnProperty from the template to make it generic
  ).replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
  try {
    var source = funcToString.call(fn);
    return reIsNative.test(source);
  } catch (err) {
    return false;
  }
}

var canUseCollections =
// Array.from
typeof Array.from === 'function' &&
// Map
typeof Map === 'function' && isNative(Map) &&
// Map.prototype.keys
Map.prototype != null && typeof Map.prototype.keys === 'function' && isNative(Map.prototype.keys) &&
// Set
typeof Set === 'function' && isNative(Set) &&
// Set.prototype.keys
Set.prototype != null && typeof Set.prototype.keys === 'function' && isNative(Set.prototype.keys);

var setItem;
var getItem;
var removeItem;
var getItemIDs;
var addRoot;
var removeRoot;
var getRootIDs;

if (canUseCollections) {
  var itemMap = new Map();
  var rootIDSet = new Set();

  setItem = function (id, item) {
    itemMap.set(id, item);
  };
  getItem = function (id) {
    return itemMap.get(id);
  };
  removeItem = function (id) {
    itemMap['delete'](id);
  };
  getItemIDs = function () {
    return Array.from(itemMap.keys());
  };

  addRoot = function (id) {
    rootIDSet.add(id);
  };
  removeRoot = function (id) {
    rootIDSet['delete'](id);
  };
  getRootIDs = function () {
    return Array.from(rootIDSet.keys());
  };
} else {
  var itemByKey = {};
  var rootByKey = {};

  // Use non-numeric keys to prevent V8 performance issues:
  // https://github.com/facebook/react/pull/7232
  var getKeyFromID = function (id) {
    return '.' + id;
  };
  var getIDFromKey = function (key) {
    return parseInt(key.substr(1), 10);
  };

  setItem = function (id, item) {
    var key = getKeyFromID(id);
    itemByKey[key] = item;
  };
  getItem = function (id) {
    var key = getKeyFromID(id);
    return itemByKey[key];
  };
  removeItem = function (id) {
    var key = getKeyFromID(id);
    delete itemByKey[key];
  };
  getItemIDs = function () {
    return Object.keys(itemByKey).map(getIDFromKey);
  };

  addRoot = function (id) {
    var key = getKeyFromID(id);
    rootByKey[key] = true;
  };
  removeRoot = function (id) {
    var key = getKeyFromID(id);
    delete rootByKey[key];
  };
  getRootIDs = function () {
    return Object.keys(rootByKey).map(getIDFromKey);
  };
}

var unmountedIDs = [];

function purgeDeep(id) {
  var item = getItem(id);
  if (item) {
    var childIDs = item.childIDs;

    removeItem(id);
    childIDs.forEach(purgeDeep);
  }
}

function describeComponentFrame(name, source, ownerName) {
  return '\n    in ' + (name || 'Unknown') + (source ? ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' + source.lineNumber + ')' : ownerName ? ' (created by ' + ownerName + ')' : '');
}

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function describeID(id) {
  var name = ReactComponentTreeHook.getDisplayName(id);
  var element = ReactComponentTreeHook.getElement(id);
  var ownerID = ReactComponentTreeHook.getOwnerID(id);
  var ownerName;
  if (ownerID) {
    ownerName = ReactComponentTreeHook.getDisplayName(ownerID);
  }
  process.env.NODE_ENV !== 'production' ? warning(element, 'ReactComponentTreeHook: Missing React element for debugID %s when ' + 'building stack', id) : void 0;
  return describeComponentFrame(name, element && element._source, ownerName);
}

var ReactComponentTreeHook = {
  onSetChildren: function (id, nextChildIDs) {
    var item = getItem(id);
    !item ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Item must have been set') : _prodInvariant('144') : void 0;
    item.childIDs = nextChildIDs;

    for (var i = 0; i < nextChildIDs.length; i++) {
      var nextChildID = nextChildIDs[i];
      var nextChild = getItem(nextChildID);
      !nextChild ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected hook events to fire for the child before its parent includes it in onSetChildren().') : _prodInvariant('140') : void 0;
      !(nextChild.childIDs != null || typeof nextChild.element !== 'object' || nextChild.element == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onSetChildren() to fire for a container child before its parent includes it in onSetChildren().') : _prodInvariant('141') : void 0;
      !nextChild.isMounted ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onMountComponent() to fire for the child before its parent includes it in onSetChildren().') : _prodInvariant('71') : void 0;
      if (nextChild.parentID == null) {
        nextChild.parentID = id;
        // TODO: This shouldn't be necessary but mounting a new root during in
        // componentWillMount currently causes not-yet-mounted components to
        // be purged from our tree data so their parent id is missing.
      }
      !(nextChild.parentID === id) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onBeforeMountComponent() parent and onSetChildren() to be consistent (%s has parents %s and %s).', nextChildID, nextChild.parentID, id) : _prodInvariant('142', nextChildID, nextChild.parentID, id) : void 0;
    }
  },
  onBeforeMountComponent: function (id, element, parentID) {
    var item = {
      element: element,
      parentID: parentID,
      text: null,
      childIDs: [],
      isMounted: false,
      updateCount: 0
    };
    setItem(id, item);
  },
  onBeforeUpdateComponent: function (id, element) {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.element = element;
  },
  onMountComponent: function (id) {
    var item = getItem(id);
    !item ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Item must have been set') : _prodInvariant('144') : void 0;
    item.isMounted = true;
    var isRoot = item.parentID === 0;
    if (isRoot) {
      addRoot(id);
    }
  },
  onUpdateComponent: function (id) {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.updateCount++;
  },
  onUnmountComponent: function (id) {
    var item = getItem(id);
    if (item) {
      // We need to check if it exists.
      // `item` might not exist if it is inside an error boundary, and a sibling
      // error boundary child threw while mounting. Then this instance never
      // got a chance to mount, but it still gets an unmounting event during
      // the error boundary cleanup.
      item.isMounted = false;
      var isRoot = item.parentID === 0;
      if (isRoot) {
        removeRoot(id);
      }
    }
    unmountedIDs.push(id);
  },
  purgeUnmountedComponents: function () {
    if (ReactComponentTreeHook._preventPurging) {
      // Should only be used for testing.
      return;
    }

    for (var i = 0; i < unmountedIDs.length; i++) {
      var id = unmountedIDs[i];
      purgeDeep(id);
    }
    unmountedIDs.length = 0;
  },
  isMounted: function (id) {
    var item = getItem(id);
    return item ? item.isMounted : false;
  },
  getCurrentStackAddendum: function (topElement) {
    var info = '';
    if (topElement) {
      var name = getDisplayName(topElement);
      var owner = topElement._owner;
      info += describeComponentFrame(name, topElement._source, owner && owner.getName());
    }

    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    info += ReactComponentTreeHook.getStackAddendumByID(id);
    return info;
  },
  getStackAddendumByID: function (id) {
    var info = '';
    while (id) {
      info += describeID(id);
      id = ReactComponentTreeHook.getParentID(id);
    }
    return info;
  },
  getChildIDs: function (id) {
    var item = getItem(id);
    return item ? item.childIDs : [];
  },
  getDisplayName: function (id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element) {
      return null;
    }
    return getDisplayName(element);
  },
  getElement: function (id) {
    var item = getItem(id);
    return item ? item.element : null;
  },
  getOwnerID: function (id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element || !element._owner) {
      return null;
    }
    return element._owner._debugID;
  },
  getParentID: function (id) {
    var item = getItem(id);
    return item ? item.parentID : null;
  },
  getSource: function (id) {
    var item = getItem(id);
    var element = item ? item.element : null;
    var source = element != null ? element._source : null;
    return source;
  },
  getText: function (id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (typeof element === 'string') {
      return element;
    } else if (typeof element === 'number') {
      return '' + element;
    } else {
      return null;
    }
  },
  getUpdateCount: function (id) {
    var item = getItem(id);
    return item ? item.updateCount : 0;
  },


  getRootIDs: getRootIDs,
  getRegisteredIDs: getItemIDs,

  pushNonStandardWarningStack: function (isCreatingElement, currentSource) {
    if (typeof console.reactStack !== 'function') {
      return;
    }

    var stack = [];
    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    try {
      if (isCreatingElement) {
        stack.push({
          name: id ? ReactComponentTreeHook.getDisplayName(id) : null,
          fileName: currentSource ? currentSource.fileName : null,
          lineNumber: currentSource ? currentSource.lineNumber : null
        });
      }

      while (id) {
        var element = ReactComponentTreeHook.getElement(id);
        var parentID = ReactComponentTreeHook.getParentID(id);
        var ownerID = ReactComponentTreeHook.getOwnerID(id);
        var ownerName = ownerID ? ReactComponentTreeHook.getDisplayName(ownerID) : null;
        var source = element && element._source;
        stack.push({
          name: ownerName,
          fileName: source ? source.fileName : null,
          lineNumber: source ? source.lineNumber : null
        });
        id = parentID;
      }
    } catch (err) {
      // Internal state is messed up.
      // Stop building the stack (it's just a nice to have).
    }

    console.reactStack(stack);
  },
  popNonStandardWarningStack: function () {
    if (typeof console.reactStackEnd !== 'function') {
      return;
    }
    console.reactStackEnd();
  }
};

module.exports = ReactComponentTreeHook;

}).call(this,require("gzNCgL"))
},{"./ReactCurrentOwner":18,"./reactProdInvariant":34,"fbjs/lib/invariant":5,"fbjs/lib/warning":6,"gzNCgL":1}],18:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
var ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

module.exports = ReactCurrentOwner;

},{}],19:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var ReactElement = require('./ReactElement');

/**
 * Create a factory that creates HTML tag elements.
 *
 * @private
 */
var createDOMFactory = ReactElement.createFactory;
if (process.env.NODE_ENV !== 'production') {
  var ReactElementValidator = require('./ReactElementValidator');
  createDOMFactory = ReactElementValidator.createFactory;
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 *
 * @public
 */
var ReactDOMFactories = {
  a: createDOMFactory('a'),
  abbr: createDOMFactory('abbr'),
  address: createDOMFactory('address'),
  area: createDOMFactory('area'),
  article: createDOMFactory('article'),
  aside: createDOMFactory('aside'),
  audio: createDOMFactory('audio'),
  b: createDOMFactory('b'),
  base: createDOMFactory('base'),
  bdi: createDOMFactory('bdi'),
  bdo: createDOMFactory('bdo'),
  big: createDOMFactory('big'),
  blockquote: createDOMFactory('blockquote'),
  body: createDOMFactory('body'),
  br: createDOMFactory('br'),
  button: createDOMFactory('button'),
  canvas: createDOMFactory('canvas'),
  caption: createDOMFactory('caption'),
  cite: createDOMFactory('cite'),
  code: createDOMFactory('code'),
  col: createDOMFactory('col'),
  colgroup: createDOMFactory('colgroup'),
  data: createDOMFactory('data'),
  datalist: createDOMFactory('datalist'),
  dd: createDOMFactory('dd'),
  del: createDOMFactory('del'),
  details: createDOMFactory('details'),
  dfn: createDOMFactory('dfn'),
  dialog: createDOMFactory('dialog'),
  div: createDOMFactory('div'),
  dl: createDOMFactory('dl'),
  dt: createDOMFactory('dt'),
  em: createDOMFactory('em'),
  embed: createDOMFactory('embed'),
  fieldset: createDOMFactory('fieldset'),
  figcaption: createDOMFactory('figcaption'),
  figure: createDOMFactory('figure'),
  footer: createDOMFactory('footer'),
  form: createDOMFactory('form'),
  h1: createDOMFactory('h1'),
  h2: createDOMFactory('h2'),
  h3: createDOMFactory('h3'),
  h4: createDOMFactory('h4'),
  h5: createDOMFactory('h5'),
  h6: createDOMFactory('h6'),
  head: createDOMFactory('head'),
  header: createDOMFactory('header'),
  hgroup: createDOMFactory('hgroup'),
  hr: createDOMFactory('hr'),
  html: createDOMFactory('html'),
  i: createDOMFactory('i'),
  iframe: createDOMFactory('iframe'),
  img: createDOMFactory('img'),
  input: createDOMFactory('input'),
  ins: createDOMFactory('ins'),
  kbd: createDOMFactory('kbd'),
  keygen: createDOMFactory('keygen'),
  label: createDOMFactory('label'),
  legend: createDOMFactory('legend'),
  li: createDOMFactory('li'),
  link: createDOMFactory('link'),
  main: createDOMFactory('main'),
  map: createDOMFactory('map'),
  mark: createDOMFactory('mark'),
  menu: createDOMFactory('menu'),
  menuitem: createDOMFactory('menuitem'),
  meta: createDOMFactory('meta'),
  meter: createDOMFactory('meter'),
  nav: createDOMFactory('nav'),
  noscript: createDOMFactory('noscript'),
  object: createDOMFactory('object'),
  ol: createDOMFactory('ol'),
  optgroup: createDOMFactory('optgroup'),
  option: createDOMFactory('option'),
  output: createDOMFactory('output'),
  p: createDOMFactory('p'),
  param: createDOMFactory('param'),
  picture: createDOMFactory('picture'),
  pre: createDOMFactory('pre'),
  progress: createDOMFactory('progress'),
  q: createDOMFactory('q'),
  rp: createDOMFactory('rp'),
  rt: createDOMFactory('rt'),
  ruby: createDOMFactory('ruby'),
  s: createDOMFactory('s'),
  samp: createDOMFactory('samp'),
  script: createDOMFactory('script'),
  section: createDOMFactory('section'),
  select: createDOMFactory('select'),
  small: createDOMFactory('small'),
  source: createDOMFactory('source'),
  span: createDOMFactory('span'),
  strong: createDOMFactory('strong'),
  style: createDOMFactory('style'),
  sub: createDOMFactory('sub'),
  summary: createDOMFactory('summary'),
  sup: createDOMFactory('sup'),
  table: createDOMFactory('table'),
  tbody: createDOMFactory('tbody'),
  td: createDOMFactory('td'),
  textarea: createDOMFactory('textarea'),
  tfoot: createDOMFactory('tfoot'),
  th: createDOMFactory('th'),
  thead: createDOMFactory('thead'),
  time: createDOMFactory('time'),
  title: createDOMFactory('title'),
  tr: createDOMFactory('tr'),
  track: createDOMFactory('track'),
  u: createDOMFactory('u'),
  ul: createDOMFactory('ul'),
  'var': createDOMFactory('var'),
  video: createDOMFactory('video'),
  wbr: createDOMFactory('wbr'),

  // SVG
  circle: createDOMFactory('circle'),
  clipPath: createDOMFactory('clipPath'),
  defs: createDOMFactory('defs'),
  ellipse: createDOMFactory('ellipse'),
  g: createDOMFactory('g'),
  image: createDOMFactory('image'),
  line: createDOMFactory('line'),
  linearGradient: createDOMFactory('linearGradient'),
  mask: createDOMFactory('mask'),
  path: createDOMFactory('path'),
  pattern: createDOMFactory('pattern'),
  polygon: createDOMFactory('polygon'),
  polyline: createDOMFactory('polyline'),
  radialGradient: createDOMFactory('radialGradient'),
  rect: createDOMFactory('rect'),
  stop: createDOMFactory('stop'),
  svg: createDOMFactory('svg'),
  text: createDOMFactory('text'),
  tspan: createDOMFactory('tspan')
};

module.exports = ReactDOMFactories;

}).call(this,require("gzNCgL"))
},{"./ReactElement":20,"./ReactElementValidator":22,"gzNCgL":1}],20:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var ReactCurrentOwner = require('./ReactCurrentOwner');

var warning = require('fbjs/lib/warning');
var canDefineProperty = require('./canDefineProperty');
var hasOwnProperty = Object.prototype.hasOwnProperty;

var REACT_ELEMENT_TYPE = require('./ReactElementSymbol');

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

var specialPropKeyWarningShown, specialPropRefWarningShown;

function hasValidRef(config) {
  if (process.env.NODE_ENV !== 'production') {
    if (hasOwnProperty.call(config, 'ref')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.ref !== undefined;
}

function hasValidKey(config) {
  if (process.env.NODE_ENV !== 'production') {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function () {
    if (!specialPropKeyWarningShown) {
      specialPropKeyWarningShown = true;
      process.env.NODE_ENV !== 'production' ? warning(false, '%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName) : void 0;
    }
  };
  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function () {
    if (!specialPropRefWarningShown) {
      specialPropRefWarningShown = true;
      process.env.NODE_ENV !== 'production' ? warning(false, '%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName) : void 0;
    }
  };
  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, no instanceof check
 * will work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @param {*} owner
 * @param {*} props
 * @internal
 */
var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allow us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner
  };

  if (process.env.NODE_ENV !== 'production') {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    if (canDefineProperty) {
      Object.defineProperty(element._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false
      });
      // self and source are DEV only properties.
      Object.defineProperty(element, '_self', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self
      });
      // Two elements created in two different places should be considered
      // equal for testing purposes and therefore we hide it from enumeration.
      Object.defineProperty(element, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
    } else {
      element._store.validated = false;
      element._self = self;
      element._source = source;
    }
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};

/**
 * Create and return a new ReactElement of the given type.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.createelement
 */
ReactElement.createElement = function (type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (process.env.NODE_ENV !== 'production') {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    if (key || ref) {
      if (typeof props.$$typeof === 'undefined' || props.$$typeof !== REACT_ELEMENT_TYPE) {
        var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;
        if (key) {
          defineKeyPropWarningGetter(props, displayName);
        }
        if (ref) {
          defineRefPropWarningGetter(props, displayName);
        }
      }
    }
  }
  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
};

/**
 * Return a function that produces ReactElements of a given type.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.createfactory
 */
ReactElement.createFactory = function (type) {
  var factory = ReactElement.createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook TODO: Warn if this is accessed
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceKey = function (oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);

  return newElement;
};

/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.cloneelement
 */
ReactElement.cloneElement = function (element, config, children) {
  var propName;

  // Original props are copied
  var props = _assign({}, element.props);

  // Reserved names are extracted
  var key = element.key;
  var ref = element.ref;
  // Self is preserved since the owner is preserved.
  var self = element._self;
  // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.
  var source = element._source;

  // Owner will be preserved, unless ref is overridden
  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    // Remaining properties override existing props
    var defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
};

/**
 * Verifies the object is a ReactElement.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
ReactElement.isValidElement = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};

module.exports = ReactElement;

}).call(this,require("gzNCgL"))
},{"./ReactCurrentOwner":18,"./ReactElementSymbol":21,"./canDefineProperty":28,"fbjs/lib/warning":6,"gzNCgL":1,"object-assign":7}],21:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.

var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.element') || 0xeac7;

module.exports = REACT_ELEMENT_TYPE;

},{}],22:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

'use strict';

var ReactCurrentOwner = require('./ReactCurrentOwner');
var ReactComponentTreeHook = require('./ReactComponentTreeHook');
var ReactElement = require('./ReactElement');

var checkReactTypeSpec = require('./checkReactTypeSpec');

var canDefineProperty = require('./canDefineProperty');
var getIteratorFn = require('./getIteratorFn');
var warning = require('fbjs/lib/warning');
var lowPriorityWarning = require('./lowPriorityWarning');

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = ReactCurrentOwner.current.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

function getSourceInfoErrorAddendum(elementProps) {
  if (elementProps !== null && elementProps !== undefined && elementProps.__source !== undefined) {
    var source = elementProps.__source;
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    return ' Check your code at ' + fileName + ':' + lineNumber + '.';
  }
  return '';
}

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;
    if (parentName) {
      info = ' Check the top-level render call using <' + parentName + '>.';
    }
  }
  return info;
}

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  var memoizer = ownerHasKeyUseWarning.uniqueKey || (ownerHasKeyUseWarning.uniqueKey = {});

  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (memoizer[currentComponentErrorInfo]) {
    return;
  }
  memoizer[currentComponentErrorInfo] = true;

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwner = '';
  if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
    // Give the component that originally created this child.
    childOwner = ' It was passed a child from ' + element._owner.getName() + '.';
  }

  process.env.NODE_ENV !== 'production' ? warning(false, 'Each child in an array or iterator should have a unique "key" prop.' + '%s%s See https://fb.me/react-warning-keys for more information.%s', currentComponentErrorInfo, childOwner, ReactComponentTreeHook.getCurrentStackAddendum(element)) : void 0;
}

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (ReactElement.isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (ReactElement.isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);
    // Entry iterators provide implicit keys.
    if (iteratorFn) {
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;
        while (!(step = iterator.next()).done) {
          if (ReactElement.isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}

/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
function validatePropTypes(element) {
  var componentClass = element.type;
  if (typeof componentClass !== 'function') {
    return;
  }
  var name = componentClass.displayName || componentClass.name;
  if (componentClass.propTypes) {
    checkReactTypeSpec(componentClass.propTypes, element.props, 'prop', name, element, null);
  }
  if (typeof componentClass.getDefaultProps === 'function') {
    process.env.NODE_ENV !== 'production' ? warning(componentClass.getDefaultProps.isReactClassApproved, 'getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.') : void 0;
  }
}

var ReactElementValidator = {
  createElement: function (type, props, children) {
    var validType = typeof type === 'string' || typeof type === 'function';
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    if (!validType) {
      if (typeof type !== 'function' && typeof type !== 'string') {
        var info = '';
        if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
          info += ' You likely forgot to export your component from the file ' + "it's defined in.";
        }

        var sourceInfo = getSourceInfoErrorAddendum(props);
        if (sourceInfo) {
          info += sourceInfo;
        } else {
          info += getDeclarationErrorAddendum();
        }

        info += ReactComponentTreeHook.getCurrentStackAddendum();

        var currentSource = props !== null && props !== undefined && props.__source !== undefined ? props.__source : null;
        ReactComponentTreeHook.pushNonStandardWarningStack(true, currentSource);
        process.env.NODE_ENV !== 'production' ? warning(false, 'React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', type == null ? type : typeof type, info) : void 0;
        ReactComponentTreeHook.popNonStandardWarningStack();
      }
    }

    var element = ReactElement.createElement.apply(this, arguments);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)
    if (validType) {
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    }

    validatePropTypes(element);

    return element;
  },

  createFactory: function (type) {
    var validatedFactory = ReactElementValidator.createElement.bind(null, type);
    // Legacy hook TODO: Warn if this is accessed
    validatedFactory.type = type;

    if (process.env.NODE_ENV !== 'production') {
      if (canDefineProperty) {
        Object.defineProperty(validatedFactory, 'type', {
          enumerable: false,
          get: function () {
            lowPriorityWarning(false, 'Factory.type is deprecated. Access the class directly ' + 'before passing it to createFactory.');
            Object.defineProperty(this, 'type', {
              value: type
            });
            return type;
          }
        });
      }
    }

    return validatedFactory;
  },

  cloneElement: function (element, props, children) {
    var newElement = ReactElement.cloneElement.apply(this, arguments);
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    return newElement;
  }
};

module.exports = ReactElementValidator;

}).call(this,require("gzNCgL"))
},{"./ReactComponentTreeHook":17,"./ReactCurrentOwner":18,"./ReactElement":20,"./canDefineProperty":28,"./checkReactTypeSpec":29,"./getIteratorFn":31,"./lowPriorityWarning":32,"fbjs/lib/warning":6,"gzNCgL":1}],23:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var warning = require('fbjs/lib/warning');

function warnNoop(publicInstance, callerName) {
  if (process.env.NODE_ENV !== 'production') {
    var constructor = publicInstance.constructor;
    process.env.NODE_ENV !== 'production' ? warning(false, '%s(...): Can only update a mounted or mounting component. ' + 'This usually means you called %s() on an unmounted component. ' + 'This is a no-op. Please check the code for the %s component.', callerName, callerName, constructor && (constructor.displayName || constructor.name) || 'ReactClass') : void 0;
  }
}

/**
 * This is the abstract API for an update queue.
 */
var ReactNoopUpdateQueue = {
  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function (publicInstance) {
    return false;
  },

  /**
   * Enqueue a callback that will be executed after all the pending updates
   * have processed.
   *
   * @param {ReactClass} publicInstance The instance to use as `this` context.
   * @param {?function} callback Called after state is updated.
   * @internal
   */
  enqueueCallback: function (publicInstance, callback) {},

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @internal
   */
  enqueueForceUpdate: function (publicInstance) {
    warnNoop(publicInstance, 'forceUpdate');
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @internal
   */
  enqueueReplaceState: function (publicInstance, completeState) {
    warnNoop(publicInstance, 'replaceState');
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState) {
    warnNoop(publicInstance, 'setState');
  }
};

module.exports = ReactNoopUpdateQueue;

}).call(this,require("gzNCgL"))
},{"fbjs/lib/warning":6,"gzNCgL":1}],24:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactPropTypeLocationNames = {};

if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;

}).call(this,require("gzNCgL"))
},{"gzNCgL":1}],25:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _require = require('./ReactElement'),
    isValidElement = _require.isValidElement;

var factory = require('prop-types/factory');

module.exports = factory(isValidElement);

},{"./ReactElement":20,"prop-types/factory":9}],26:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;

},{}],27:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

module.exports = '15.6.2';

},{}],28:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var canDefineProperty = false;
if (process.env.NODE_ENV !== 'production') {
  try {
    // $FlowFixMe https://github.com/facebook/flow/issues/285
    Object.defineProperty({}, 'x', { get: function () {} });
    canDefineProperty = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

module.exports = canDefineProperty;

}).call(this,require("gzNCgL"))
},{"gzNCgL":1}],29:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactPropTypeLocationNames = require('./ReactPropTypeLocationNames');
var ReactPropTypesSecret = require('./ReactPropTypesSecret');

var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var ReactComponentTreeHook;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = require('./ReactComponentTreeHook');
}

var loggedTypeFailures = {};

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?object} element The React element that is being type-checked
 * @param {?number} debugID The React component instance that is being type-checked
 * @private
 */
function checkReactTypeSpec(typeSpecs, values, location, componentName, element, debugID) {
  for (var typeSpecName in typeSpecs) {
    if (typeSpecs.hasOwnProperty(typeSpecName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        // This is intentionally an invariant that gets caught. It's the same
        // behavior as without this statement except with a better message.
        !(typeof typeSpecs[typeSpecName] === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s: %s type `%s` is invalid; it must be a function, usually from React.PropTypes.', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : _prodInvariant('84', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : void 0;
        error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
      } catch (ex) {
        error = ex;
      }
      process.env.NODE_ENV !== 'production' ? warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName, typeof error) : void 0;
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var componentStackInfo = '';

        if (process.env.NODE_ENV !== 'production') {
          if (!ReactComponentTreeHook) {
            ReactComponentTreeHook = require('./ReactComponentTreeHook');
          }
          if (debugID !== null) {
            componentStackInfo = ReactComponentTreeHook.getStackAddendumByID(debugID);
          } else if (element !== null) {
            componentStackInfo = ReactComponentTreeHook.getCurrentStackAddendum(element);
          }
        }

        process.env.NODE_ENV !== 'production' ? warning(false, 'Failed %s type: %s%s', location, error.message, componentStackInfo) : void 0;
      }
    }
  }
}

module.exports = checkReactTypeSpec;

}).call(this,require("gzNCgL"))
},{"./ReactComponentTreeHook":17,"./ReactPropTypeLocationNames":24,"./ReactPropTypesSecret":26,"./reactProdInvariant":34,"fbjs/lib/invariant":5,"fbjs/lib/warning":6,"gzNCgL":1}],30:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _require = require('./ReactBaseClasses'),
    Component = _require.Component;

var _require2 = require('./ReactElement'),
    isValidElement = _require2.isValidElement;

var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue');
var factory = require('create-react-class/factory');

module.exports = factory(Component, isValidElement, ReactNoopUpdateQueue);

},{"./ReactBaseClasses":15,"./ReactElement":20,"./ReactNoopUpdateQueue":23,"create-react-class/factory":2}],31:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

/* global Symbol */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
 * Returns the iterator method function contained on the iterable object.
 *
 * Be sure to invoke the function with the iterable as context:
 *
 *     var iteratorFn = getIteratorFn(myIterable);
 *     if (iteratorFn) {
 *       var iterator = iteratorFn.call(myIterable);
 *       ...
 *     }
 *
 * @param {?object} maybeIterable
 * @return {?function}
 */
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

module.exports = getIteratorFn;

},{}],32:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

/**
 * Forked from fbjs/warning:
 * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
 *
 * Only change is we use console.warn instead of console.error,
 * and do nothing when 'console' is not supported.
 * This really simplifies the code.
 * ---
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var lowPriorityWarning = function () {};

if (process.env.NODE_ENV !== 'production') {
  var printWarning = function (format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.warn(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  lowPriorityWarning = function (condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }
    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = lowPriorityWarning;

}).call(this,require("gzNCgL"))
},{"gzNCgL":1}],33:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactElement = require('./ReactElement');

var invariant = require('fbjs/lib/invariant');

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.only
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */
function onlyChild(children) {
  !ReactElement.isValidElement(children) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'React.Children.only expected to receive a single React element child.') : _prodInvariant('143') : void 0;
  return children;
}

module.exports = onlyChild;

}).call(this,require("gzNCgL"))
},{"./ReactElement":20,"./reactProdInvariant":34,"fbjs/lib/invariant":5,"gzNCgL":1}],34:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
'use strict';

/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */

function reactProdInvariant(code) {
  var argCount = arguments.length - 1;

  var message = 'Minified React error #' + code + '; visit ' + 'http://facebook.github.io/react/docs/error-decoder.html?invariant=' + code;

  for (var argIdx = 0; argIdx < argCount; argIdx++) {
    message += '&args[]=' + encodeURIComponent(arguments[argIdx + 1]);
  }

  message += ' for the full message or use the non-minified dev environment' + ' for full errors and additional helpful warnings.';

  var error = new Error(message);
  error.name = 'Invariant Violation';
  error.framesToPop = 1; // we don't care about reactProdInvariant's own frame

  throw error;
}

module.exports = reactProdInvariant;

},{}],35:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactCurrentOwner = require('./ReactCurrentOwner');
var REACT_ELEMENT_TYPE = require('./ReactElementSymbol');

var getIteratorFn = require('./getIteratorFn');
var invariant = require('fbjs/lib/invariant');
var KeyEscapeUtils = require('./KeyEscapeUtils');
var warning = require('fbjs/lib/warning');

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

/**
 * This is inlined from ReactElement since this file is shared between
 * isomorphic and renderers. We could extract this to a
 *
 */

/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

var didWarnAboutMaps = false;

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (component && typeof component === 'object' && component.key != null) {
    // Explicit key
    return KeyEscapeUtils.escape(component.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  if (children === null || type === 'string' || type === 'number' ||
  // The following is inlined from ReactElement. This means we can optimize
  // some checks. React Fiber also inlines this logic for similar purposes.
  type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE) {
    callback(traverseContext, children,
    // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows.
    nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
    }
  } else {
    var iteratorFn = getIteratorFn(children);
    if (iteratorFn) {
      var iterator = iteratorFn.call(children);
      var step;
      if (iteratorFn !== children.entries) {
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = nextNamePrefix + getComponentKey(child, ii++);
          subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          var mapsAsChildrenAddendum = '';
          if (ReactCurrentOwner.current) {
            var mapsAsChildrenOwnerName = ReactCurrentOwner.current.getName();
            if (mapsAsChildrenOwnerName) {
              mapsAsChildrenAddendum = ' Check the render method of `' + mapsAsChildrenOwnerName + '`.';
            }
          }
          process.env.NODE_ENV !== 'production' ? warning(didWarnAboutMaps, 'Using Maps as children is not yet fully supported. It is an ' + 'experimental feature that might be removed. Convert it to a ' + 'sequence / iterable of keyed ReactElements instead.%s', mapsAsChildrenAddendum) : void 0;
          didWarnAboutMaps = true;
        }
        // Iterator will provide entry [k,v] tuples rather than values.
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (entry) {
            child = entry[1];
            nextName = nextNamePrefix + KeyEscapeUtils.escape(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0);
            subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
          }
        }
      }
    } else if (type === 'object') {
      var addendum = '';
      if (process.env.NODE_ENV !== 'production') {
        addendum = ' If you meant to render a collection of children, use an array ' + 'instead or wrap the object using createFragment(object) from the ' + 'React add-ons.';
        if (children._isReactElement) {
          addendum = " It looks like you're using an element created by a different " + 'version of React. Make sure to use only one copy of React.';
        }
        if (ReactCurrentOwner.current) {
          var name = ReactCurrentOwner.current.getName();
          if (name) {
            addendum += ' Check the render method of `' + name + '`.';
          }
        }
      }
      var childrenString = String(children);
      !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Objects are not valid as a React child (found: %s).%s', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : _prodInvariant('31', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : void 0;
    }
  }

  return subtreeCount;
}

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

module.exports = traverseAllChildren;

}).call(this,require("gzNCgL"))
},{"./KeyEscapeUtils":12,"./ReactCurrentOwner":18,"./ReactElementSymbol":21,"./getIteratorFn":31,"./reactProdInvariant":34,"fbjs/lib/invariant":5,"fbjs/lib/warning":6,"gzNCgL":1}],36:[function(require,module,exports){
'use strict';

module.exports = require('./lib/React');


},{"./lib/React":14}],37:[function(require,module,exports){
var React = require('react');

var AptList = React.createClass({displayName: "AptList",
  handleDelete: function() {
    this.props.onDelete(this.props.whichItem);
  },
  handleEdit: function() {
    this.props.onEdit(this.props.whichItem);
  },
  handleRun: function() {
    this.props.onRun(this.props.whichItem);
  },
  render: function() {
    let params = '';
    if (this.props.singleItem.allowParams == 'true') {
      params = ' [params]';
    } else {
      params = ''
    }
    return(
      React.createElement("li", {className: "pet-item media"}, 
        React.createElement("div", {className: "media-left"}, 
          React.createElement("button", {className: "pet-delete btn btn-xs btn-danger", onClick: this.handleDelete}, 
          React.createElement("span", {className: "glyphicon glyphicon-remove"}))
        ), 
        React.createElement("div", {className: "media-left"}, 
          React.createElement("button", {className: "pet-edit btn btn-xs btn-primary", onClick: this.handleEdit}, 
          React.createElement("span", {className: "glyphicon glyphicon-pencil"}))
        ), 
        React.createElement("div", {className: "media-left"}, 
          React.createElement("button", {className: "pet-edit btn btn-xs btn-success", onClick: this.handleRun}, 
          React.createElement("span", {className: "glyphicon glyphicon-play"}))
        ), 
        React.createElement("div", {className: "pet-info media-body"}, 
          React.createElement("div", {className: "pet-head"}, 
            React.createElement("span", {className: "pet-name"}, this.props.singleItem.trigger), 
            React.createElement("span", {className: "apt-date pull-right"}, this.props.singleItem.voice), 
            React.createElement("p", null), 
            React.createElement("span", {className: "apt-date pull-right"}, this.props.singleItem.ground)
          ), 
          React.createElement("div", {className: "owner-name"}, React.createElement("span", {className: "label-item"}, "Command:"), 
            this.props.singleItem.command, params), 
          React.createElement("div", {className: "apt-notes"}, this.props.singleItem.aptNotes)
        )
      )
    )
  }
});

module.exports = AptList;


},{"react":36}]},{},[37])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxwcm9jZXNzXFxicm93c2VyLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxjcmVhdGUtcmVhY3QtY2xhc3NcXGZhY3RvcnkuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXGZianNcXGxpYlxcZW1wdHlGdW5jdGlvbi5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xcZmJqc1xcbGliXFxlbXB0eU9iamVjdC5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xcZmJqc1xcbGliXFxpbnZhcmlhbnQuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXGZianNcXGxpYlxcd2FybmluZy5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xcb2JqZWN0LWFzc2lnblxcaW5kZXguanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXHByb3AtdHlwZXNcXGNoZWNrUHJvcFR5cGVzLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxwcm9wLXR5cGVzXFxmYWN0b3J5LmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxwcm9wLXR5cGVzXFxmYWN0b3J5V2l0aFR5cGVDaGVja2Vycy5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccHJvcC10eXBlc1xcbGliXFxSZWFjdFByb3BUeXBlc1NlY3JldC5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcS2V5RXNjYXBlVXRpbHMuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXHJlYWN0XFxsaWJcXFBvb2xlZENsYXNzLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxSZWFjdC5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RCYXNlQ2xhc3Nlcy5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RDaGlsZHJlbi5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RDb21wb25lbnRUcmVlSG9vay5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RDdXJyZW50T3duZXIuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXHJlYWN0XFxsaWJcXFJlYWN0RE9NRmFjdG9yaWVzLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxSZWFjdEVsZW1lbnQuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXHJlYWN0XFxsaWJcXFJlYWN0RWxlbWVudFN5bWJvbC5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RFbGVtZW50VmFsaWRhdG9yLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxSZWFjdE5vb3BVcGRhdGVRdWV1ZS5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RQcm9wVHlwZUxvY2F0aW9uTmFtZXMuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXHJlYWN0XFxsaWJcXFJlYWN0UHJvcFR5cGVzLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxSZWFjdFByb3BUeXBlc1NlY3JldC5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcUmVhY3RWZXJzaW9uLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxjYW5EZWZpbmVQcm9wZXJ0eS5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcY2hlY2tSZWFjdFR5cGVTcGVjLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxjcmVhdGVDbGFzcy5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcZ2V0SXRlcmF0b3JGbi5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcbG93UHJpb3JpdHlXYXJuaW5nLmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxcbm9kZV9tb2R1bGVzXFxyZWFjdFxcbGliXFxvbmx5Q2hpbGQuanMiLCJDOlxcdHJpZ2dlcmNtZERldlxcZ2l0aHViXFxUUklHR0VSY21kLUFnZW50XFxub2RlX21vZHVsZXNcXHJlYWN0XFxsaWJcXHJlYWN0UHJvZEludmFyaWFudC5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXGxpYlxcdHJhdmVyc2VBbGxDaGlsZHJlbi5qcyIsIkM6XFx0cmlnZ2VyY21kRGV2XFxnaXRodWJcXFRSSUdHRVJjbWQtQWdlbnRcXG5vZGVfbW9kdWxlc1xccmVhY3RcXHJlYWN0LmpzIiwiQzpcXHRyaWdnZXJjbWREZXZcXGdpdGh1YlxcVFJJR0dFUmNtZC1BZ2VudFxccHJvY2Vzc1xcanNcXGZha2VfZThkZmNlNDUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxvQ0FBb0M7O0FBRXBDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUVsQyxP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QUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQSxVQUFlLENBQUEsRUFBQTtZQUNyRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsTUFBYSxDQUFBLEVBQUE7VUFDL0Msb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxXQUFZLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFlLENBQUE7UUFDN0QsQ0FBQTtNQUNILENBQUE7S0FDTjtHQUNGO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgZW1wdHlPYmplY3QgPSByZXF1aXJlKCdmYmpzL2xpYi9lbXB0eU9iamVjdCcpO1xudmFyIF9pbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFyIHdhcm5pbmcgPSByZXF1aXJlKCdmYmpzL2xpYi93YXJuaW5nJyk7XG59XG5cbnZhciBNSVhJTlNfS0VZID0gJ21peGlucyc7XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBhbGxvdyB0aGUgY3JlYXRpb24gb2YgYW5vbnltb3VzIGZ1bmN0aW9ucyB3aGljaCBkbyBub3Rcbi8vIGhhdmUgLm5hbWUgc2V0IHRvIHRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSBiZWluZyBhc3NpZ25lZCB0by5cbmZ1bmN0aW9uIGlkZW50aXR5KGZuKSB7XG4gIHJldHVybiBmbjtcbn1cblxudmFyIFJlYWN0UHJvcFR5cGVMb2NhdGlvbk5hbWVzO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgUmVhY3RQcm9wVHlwZUxvY2F0aW9uTmFtZXMgPSB7XG4gICAgcHJvcDogJ3Byb3AnLFxuICAgIGNvbnRleHQ6ICdjb250ZXh0JyxcbiAgICBjaGlsZENvbnRleHQ6ICdjaGlsZCBjb250ZXh0J1xuICB9O1xufSBlbHNlIHtcbiAgUmVhY3RQcm9wVHlwZUxvY2F0aW9uTmFtZXMgPSB7fTtcbn1cblxuZnVuY3Rpb24gZmFjdG9yeShSZWFjdENvbXBvbmVudCwgaXNWYWxpZEVsZW1lbnQsIFJlYWN0Tm9vcFVwZGF0ZVF1ZXVlKSB7XG4gIC8qKlxuICAgKiBQb2xpY2llcyB0aGF0IGRlc2NyaWJlIG1ldGhvZHMgaW4gYFJlYWN0Q2xhc3NJbnRlcmZhY2VgLlxuICAgKi9cblxuICB2YXIgaW5qZWN0ZWRNaXhpbnMgPSBbXTtcblxuICAvKipcbiAgICogQ29tcG9zaXRlIGNvbXBvbmVudHMgYXJlIGhpZ2hlci1sZXZlbCBjb21wb25lbnRzIHRoYXQgY29tcG9zZSBvdGhlciBjb21wb3NpdGVcbiAgICogb3IgaG9zdCBjb21wb25lbnRzLlxuICAgKlxuICAgKiBUbyBjcmVhdGUgYSBuZXcgdHlwZSBvZiBgUmVhY3RDbGFzc2AsIHBhc3MgYSBzcGVjaWZpY2F0aW9uIG9mXG4gICAqIHlvdXIgbmV3IGNsYXNzIHRvIGBSZWFjdC5jcmVhdGVDbGFzc2AuIFRoZSBvbmx5IHJlcXVpcmVtZW50IG9mIHlvdXIgY2xhc3NcbiAgICogc3BlY2lmaWNhdGlvbiBpcyB0aGF0IHlvdSBpbXBsZW1lbnQgYSBgcmVuZGVyYCBtZXRob2QuXG4gICAqXG4gICAqICAgdmFyIE15Q29tcG9uZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgKiAgICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICogICAgICAgcmV0dXJuIDxkaXY+SGVsbG8gV29ybGQ8L2Rpdj47XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqXG4gICAqIFRoZSBjbGFzcyBzcGVjaWZpY2F0aW9uIHN1cHBvcnRzIGEgc3BlY2lmaWMgcHJvdG9jb2wgb2YgbWV0aG9kcyB0aGF0IGhhdmVcbiAgICogc3BlY2lhbCBtZWFuaW5nIChlLmcuIGByZW5kZXJgKS4gU2VlIGBSZWFjdENsYXNzSW50ZXJmYWNlYCBmb3JcbiAgICogbW9yZSB0aGUgY29tcHJlaGVuc2l2ZSBwcm90b2NvbC4gQW55IG90aGVyIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgaW4gdGhlXG4gICAqIGNsYXNzIHNwZWNpZmljYXRpb24gd2lsbCBiZSBhdmFpbGFibGUgb24gdGhlIHByb3RvdHlwZS5cbiAgICpcbiAgICogQGludGVyZmFjZSBSZWFjdENsYXNzSW50ZXJmYWNlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgdmFyIFJlYWN0Q2xhc3NJbnRlcmZhY2UgPSB7XG4gICAgLyoqXG4gICAgICogQW4gYXJyYXkgb2YgTWl4aW4gb2JqZWN0cyB0byBpbmNsdWRlIHdoZW4gZGVmaW5pbmcgeW91ciBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7YXJyYXl9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgbWl4aW5zOiAnREVGSU5FX01BTlknLFxuXG4gICAgLyoqXG4gICAgICogQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyBhbmQgbWV0aG9kcyB0aGF0IHNob3VsZCBiZSBkZWZpbmVkIG9uXG4gICAgICogdGhlIGNvbXBvbmVudCdzIGNvbnN0cnVjdG9yIGluc3RlYWQgb2YgaXRzIHByb3RvdHlwZSAoc3RhdGljIG1ldGhvZHMpLlxuICAgICAqXG4gICAgICogQHR5cGUge29iamVjdH1cbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKi9cbiAgICBzdGF0aWNzOiAnREVGSU5FX01BTlknLFxuXG4gICAgLyoqXG4gICAgICogRGVmaW5pdGlvbiBvZiBwcm9wIHR5cGVzIGZvciB0aGlzIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgcHJvcFR5cGVzOiAnREVGSU5FX01BTlknLFxuXG4gICAgLyoqXG4gICAgICogRGVmaW5pdGlvbiBvZiBjb250ZXh0IHR5cGVzIGZvciB0aGlzIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgY29udGV4dFR5cGVzOiAnREVGSU5FX01BTlknLFxuXG4gICAgLyoqXG4gICAgICogRGVmaW5pdGlvbiBvZiBjb250ZXh0IHR5cGVzIHRoaXMgY29tcG9uZW50IHNldHMgZm9yIGl0cyBjaGlsZHJlbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgY2hpbGRDb250ZXh0VHlwZXM6ICdERUZJTkVfTUFOWScsXG5cbiAgICAvLyA9PT09IERlZmluaXRpb24gbWV0aG9kcyA9PT09XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBtb3VudGVkLiBWYWx1ZXMgaW4gdGhlIG1hcHBpbmcgd2lsbCBiZSBzZXQgb25cbiAgICAgKiBgdGhpcy5wcm9wc2AgaWYgdGhhdCBwcm9wIGlzIG5vdCBzcGVjaWZpZWQgKGkuZS4gdXNpbmcgYW4gYGluYCBjaGVjaykuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIGJlZm9yZSBgZ2V0SW5pdGlhbFN0YXRlYCBhbmQgdGhlcmVmb3JlIGNhbm5vdCByZWx5XG4gICAgICogb24gYHRoaXMuc3RhdGVgIG9yIHVzZSBgdGhpcy5zZXRTdGF0ZWAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgZ2V0RGVmYXVsdFByb3BzOiAnREVGSU5FX01BTllfTUVSR0VEJyxcblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgb25jZSBiZWZvcmUgdGhlIGNvbXBvbmVudCBpcyBtb3VudGVkLiBUaGUgcmV0dXJuIHZhbHVlIHdpbGwgYmUgdXNlZFxuICAgICAqIGFzIHRoZSBpbml0aWFsIHZhbHVlIG9mIGB0aGlzLnN0YXRlYC5cbiAgICAgKlxuICAgICAqICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgKiAgICAgcmV0dXJuIHtcbiAgICAgKiAgICAgICBpc09uOiBmYWxzZSxcbiAgICAgKiAgICAgICBmb29CYXo6IG5ldyBCYXpGb28oKVxuICAgICAqICAgICB9XG4gICAgICogICB9XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiAnREVGSU5FX01BTllfTUVSR0VEJyxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm4ge29iamVjdH1cbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKi9cbiAgICBnZXRDaGlsZENvbnRleHQ6ICdERUZJTkVfTUFOWV9NRVJHRUQnLFxuXG4gICAgLyoqXG4gICAgICogVXNlcyBwcm9wcyBmcm9tIGB0aGlzLnByb3BzYCBhbmQgc3RhdGUgZnJvbSBgdGhpcy5zdGF0ZWAgdG8gcmVuZGVyIHRoZVxuICAgICAqIHN0cnVjdHVyZSBvZiB0aGUgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogTm8gZ3VhcmFudGVlcyBhcmUgbWFkZSBhYm91dCB3aGVuIG9yIGhvdyBvZnRlbiB0aGlzIG1ldGhvZCBpcyBpbnZva2VkLCBzb1xuICAgICAqIGl0IG11c3Qgbm90IGhhdmUgc2lkZSBlZmZlY3RzLlxuICAgICAqXG4gICAgICogICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAqICAgICB2YXIgbmFtZSA9IHRoaXMucHJvcHMubmFtZTtcbiAgICAgKiAgICAgcmV0dXJuIDxkaXY+SGVsbG8sIHtuYW1lfSE8L2Rpdj47XG4gICAgICogICB9XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtSZWFjdENvbXBvbmVudH1cbiAgICAgKiBAcmVxdWlyZWRcbiAgICAgKi9cbiAgICByZW5kZXI6ICdERUZJTkVfT05DRScsXG5cbiAgICAvLyA9PT09IERlbGVnYXRlIG1ldGhvZHMgPT09PVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgaW5pdGlhbGx5IGNyZWF0ZWQgYW5kIGFib3V0IHRvIGJlIG1vdW50ZWQuXG4gICAgICogVGhpcyBtYXkgaGF2ZSBzaWRlIGVmZmVjdHMsIGJ1dCBhbnkgZXh0ZXJuYWwgc3Vic2NyaXB0aW9ucyBvciBkYXRhIGNyZWF0ZWRcbiAgICAgKiBieSB0aGlzIG1ldGhvZCBtdXN0IGJlIGNsZWFuZWQgdXAgaW4gYGNvbXBvbmVudFdpbGxVbm1vdW50YC5cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqL1xuICAgIGNvbXBvbmVudFdpbGxNb3VudDogJ0RFRklORV9NQU5ZJyxcblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIG1vdW50ZWQgYW5kIGhhcyBhIERPTSByZXByZXNlbnRhdGlvbi5cbiAgICAgKiBIb3dldmVyLCB0aGVyZSBpcyBubyBndWFyYW50ZWUgdGhhdCB0aGUgRE9NIG5vZGUgaXMgaW4gdGhlIGRvY3VtZW50LlxuICAgICAqXG4gICAgICogVXNlIHRoaXMgYXMgYW4gb3Bwb3J0dW5pdHkgdG8gb3BlcmF0ZSBvbiB0aGUgRE9NIHdoZW4gdGhlIGNvbXBvbmVudCBoYXNcbiAgICAgKiBiZWVuIG1vdW50ZWQgKGluaXRpYWxpemVkIGFuZCByZW5kZXJlZCkgZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtET01FbGVtZW50fSByb290Tm9kZSBET00gZWxlbWVudCByZXByZXNlbnRpbmcgdGhlIGNvbXBvbmVudC5cbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKi9cbiAgICBjb21wb25lbnREaWRNb3VudDogJ0RFRklORV9NQU5ZJyxcblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgYmVmb3JlIHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgbmV3IHByb3BzLlxuICAgICAqXG4gICAgICogVXNlIHRoaXMgYXMgYW4gb3Bwb3J0dW5pdHkgdG8gcmVhY3QgdG8gYSBwcm9wIHRyYW5zaXRpb24gYnkgdXBkYXRpbmcgdGhlXG4gICAgICogc3RhdGUgdXNpbmcgYHRoaXMuc2V0U3RhdGVgLiBDdXJyZW50IHByb3BzIGFyZSBhY2Nlc3NlZCB2aWEgYHRoaXMucHJvcHNgLlxuICAgICAqXG4gICAgICogICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRDb250ZXh0KSB7XG4gICAgICogICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAqICAgICAgIGxpa2VzSW5jcmVhc2luZzogbmV4dFByb3BzLmxpa2VDb3VudCA+IHRoaXMucHJvcHMubGlrZUNvdW50XG4gICAgICogICAgIH0pO1xuICAgICAqICAgfVxuICAgICAqXG4gICAgICogTk9URTogVGhlcmUgaXMgbm8gZXF1aXZhbGVudCBgY29tcG9uZW50V2lsbFJlY2VpdmVTdGF0ZWAuIEFuIGluY29taW5nIHByb3BcbiAgICAgKiB0cmFuc2l0aW9uIG1heSBjYXVzZSBhIHN0YXRlIGNoYW5nZSwgYnV0IHRoZSBvcHBvc2l0ZSBpcyBub3QgdHJ1ZS4gSWYgeW91XG4gICAgICogbmVlZCBpdCwgeW91IGFyZSBwcm9iYWJseSBsb29raW5nIGZvciBgY29tcG9uZW50V2lsbFVwZGF0ZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gbmV4dFByb3BzXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogJ0RFRklORV9NQU5ZJyxcblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hpbGUgZGVjaWRpbmcgaWYgdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgdXBkYXRlZCBhcyBhIHJlc3VsdCBvZlxuICAgICAqIHJlY2VpdmluZyBuZXcgcHJvcHMsIHN0YXRlIGFuZC9vciBjb250ZXh0LlxuICAgICAqXG4gICAgICogVXNlIHRoaXMgYXMgYW4gb3Bwb3J0dW5pdHkgdG8gYHJldHVybiBmYWxzZWAgd2hlbiB5b3UncmUgY2VydGFpbiB0aGF0IHRoZVxuICAgICAqIHRyYW5zaXRpb24gdG8gdGhlIG5ldyBwcm9wcy9zdGF0ZS9jb250ZXh0IHdpbGwgbm90IHJlcXVpcmUgYSBjb21wb25lbnRcbiAgICAgKiB1cGRhdGUuXG4gICAgICpcbiAgICAgKiAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzLCBuZXh0U3RhdGUsIG5leHRDb250ZXh0KSB7XG4gICAgICogICAgIHJldHVybiAhZXF1YWwobmV4dFByb3BzLCB0aGlzLnByb3BzKSB8fFxuICAgICAqICAgICAgICFlcXVhbChuZXh0U3RhdGUsIHRoaXMuc3RhdGUpIHx8XG4gICAgICogICAgICAgIWVxdWFsKG5leHRDb250ZXh0LCB0aGlzLmNvbnRleHQpO1xuICAgICAqICAgfVxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5leHRQcm9wc1xuICAgICAqIEBwYXJhbSB7P29iamVjdH0gbmV4dFN0YXRlXG4gICAgICogQHBhcmFtIHs/b2JqZWN0fSBuZXh0Q29udGV4dFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGNvbXBvbmVudCBzaG91bGQgdXBkYXRlLlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqL1xuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogJ0RFRklORV9PTkNFJyxcblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGFib3V0IHRvIHVwZGF0ZSBkdWUgdG8gYSB0cmFuc2l0aW9uIGZyb21cbiAgICAgKiBgdGhpcy5wcm9wc2AsIGB0aGlzLnN0YXRlYCBhbmQgYHRoaXMuY29udGV4dGAgdG8gYG5leHRQcm9wc2AsIGBuZXh0U3RhdGVgXG4gICAgICogYW5kIGBuZXh0Q29udGV4dGAuXG4gICAgICpcbiAgICAgKiBVc2UgdGhpcyBhcyBhbiBvcHBvcnR1bml0eSB0byBwZXJmb3JtIHByZXBhcmF0aW9uIGJlZm9yZSBhbiB1cGRhdGUgb2NjdXJzLlxuICAgICAqXG4gICAgICogTk9URTogWW91ICoqY2Fubm90KiogdXNlIGB0aGlzLnNldFN0YXRlKClgIGluIHRoaXMgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5leHRQcm9wc1xuICAgICAqIEBwYXJhbSB7P29iamVjdH0gbmV4dFN0YXRlXG4gICAgICogQHBhcmFtIHs/b2JqZWN0fSBuZXh0Q29udGV4dFxuICAgICAqIEBwYXJhbSB7UmVhY3RSZWNvbmNpbGVUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKi9cbiAgICBjb21wb25lbnRXaWxsVXBkYXRlOiAnREVGSU5FX01BTlknLFxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSBjb21wb25lbnQncyBET00gcmVwcmVzZW50YXRpb24gaGFzIGJlZW4gdXBkYXRlZC5cbiAgICAgKlxuICAgICAqIFVzZSB0aGlzIGFzIGFuIG9wcG9ydHVuaXR5IHRvIG9wZXJhdGUgb24gdGhlIERPTSB3aGVuIHRoZSBjb21wb25lbnQgaGFzXG4gICAgICogYmVlbiB1cGRhdGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHByZXZQcm9wc1xuICAgICAqIEBwYXJhbSB7P29iamVjdH0gcHJldlN0YXRlXG4gICAgICogQHBhcmFtIHs/b2JqZWN0fSBwcmV2Q29udGV4dFxuICAgICAqIEBwYXJhbSB7RE9NRWxlbWVudH0gcm9vdE5vZGUgRE9NIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnQuXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiAnREVGSU5FX01BTlknLFxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgYWJvdXQgdG8gYmUgcmVtb3ZlZCBmcm9tIGl0cyBwYXJlbnQgYW5kIGhhdmVcbiAgICAgKiBpdHMgRE9NIHJlcHJlc2VudGF0aW9uIGRlc3Ryb3llZC5cbiAgICAgKlxuICAgICAqIFVzZSB0aGlzIGFzIGFuIG9wcG9ydHVuaXR5IHRvIGRlYWxsb2NhdGUgYW55IGV4dGVybmFsIHJlc291cmNlcy5cbiAgICAgKlxuICAgICAqIE5PVEU6IFRoZXJlIGlzIG5vIGBjb21wb25lbnREaWRVbm1vdW50YCBzaW5jZSB5b3VyIGNvbXBvbmVudCB3aWxsIGhhdmUgYmVlblxuICAgICAqIGRlc3Ryb3llZCBieSB0aGF0IHBvaW50LlxuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6ICdERUZJTkVfTUFOWScsXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlbWVudCBmb3IgKGRlcHJlY2F0ZWQpIGBjb21wb25lbnRXaWxsTW91bnRgLlxuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudDogJ0RFRklORV9NQU5ZJyxcblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VtZW50IGZvciAoZGVwcmVjYXRlZCkgYGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHNgLlxuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6ICdERUZJTkVfTUFOWScsXG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlbWVudCBmb3IgKGRlcHJlY2F0ZWQpIGBjb21wb25lbnRXaWxsVXBkYXRlYC5cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqL1xuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsVXBkYXRlOiAnREVGSU5FX01BTlknLFxuXG4gICAgLy8gPT09PSBBZHZhbmNlZCBtZXRob2RzID09PT1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGNvbXBvbmVudCdzIGN1cnJlbnRseSBtb3VudGVkIERPTSByZXByZXNlbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEJ5IGRlZmF1bHQsIHRoaXMgaW1wbGVtZW50cyBSZWFjdCdzIHJlbmRlcmluZyBhbmQgcmVjb25jaWxpYXRpb24gYWxnb3JpdGhtLlxuICAgICAqIFNvcGhpc3RpY2F0ZWQgY2xpZW50cyBtYXkgd2lzaCB0byBvdmVycmlkZSB0aGlzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWFjdFJlY29uY2lsZVRyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBvdmVycmlkYWJsZVxuICAgICAqL1xuICAgIHVwZGF0ZUNvbXBvbmVudDogJ09WRVJSSURFX0JBU0UnXG4gIH07XG5cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8gUmVhY3RDbGFzc0ludGVyZmFjZSBidXQgZm9yIHN0YXRpYyBtZXRob2RzLlxuICAgKi9cbiAgdmFyIFJlYWN0Q2xhc3NTdGF0aWNJbnRlcmZhY2UgPSB7XG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgaW52b2tlZCBhZnRlciBhIGNvbXBvbmVudCBpcyBpbnN0YW50aWF0ZWQgYW5kIHdoZW4gaXRcbiAgICAgKiByZWNlaXZlcyBuZXcgcHJvcHMuIFJldHVybiBhbiBvYmplY3QgdG8gdXBkYXRlIHN0YXRlIGluIHJlc3BvbnNlIHRvXG4gICAgICogcHJvcCBjaGFuZ2VzLiBSZXR1cm4gbnVsbCB0byBpbmRpY2F0ZSBubyBjaGFuZ2UgdG8gc3RhdGUuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcmV0dXJuZWQsIGl0cyBrZXlzIHdpbGwgYmUgbWVyZ2VkIGludG8gdGhlIGV4aXN0aW5nIHN0YXRlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7b2JqZWN0IHx8IG51bGx9XG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzOiAnREVGSU5FX01BTllfTUVSR0VEJ1xuICB9O1xuXG4gIC8qKlxuICAgKiBNYXBwaW5nIGZyb20gY2xhc3Mgc3BlY2lmaWNhdGlvbiBrZXlzIHRvIHNwZWNpYWwgcHJvY2Vzc2luZyBmdW5jdGlvbnMuXG4gICAqXG4gICAqIEFsdGhvdWdoIHRoZXNlIGFyZSBkZWNsYXJlZCBsaWtlIGluc3RhbmNlIHByb3BlcnRpZXMgaW4gdGhlIHNwZWNpZmljYXRpb25cbiAgICogd2hlbiBkZWZpbmluZyBjbGFzc2VzIHVzaW5nIGBSZWFjdC5jcmVhdGVDbGFzc2AsIHRoZXkgYXJlIGFjdHVhbGx5IHN0YXRpY1xuICAgKiBhbmQgYXJlIGFjY2Vzc2libGUgb24gdGhlIGNvbnN0cnVjdG9yIGluc3RlYWQgb2YgdGhlIHByb3RvdHlwZS4gRGVzcGl0ZVxuICAgKiBiZWluZyBzdGF0aWMsIHRoZXkgbXVzdCBiZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIFwic3RhdGljc1wiIGtleSB1bmRlclxuICAgKiB3aGljaCBhbGwgb3RoZXIgc3RhdGljIG1ldGhvZHMgYXJlIGRlZmluZWQuXG4gICAqL1xuICB2YXIgUkVTRVJWRURfU1BFQ19LRVlTID0ge1xuICAgIGRpc3BsYXlOYW1lOiBmdW5jdGlvbihDb25zdHJ1Y3RvciwgZGlzcGxheU5hbWUpIHtcbiAgICAgIENvbnN0cnVjdG9yLmRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWU7XG4gICAgfSxcbiAgICBtaXhpbnM6IGZ1bmN0aW9uKENvbnN0cnVjdG9yLCBtaXhpbnMpIHtcbiAgICAgIGlmIChtaXhpbnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtaXhpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBtaXhTcGVjSW50b0NvbXBvbmVudChDb25zdHJ1Y3RvciwgbWl4aW5zW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2hpbGRDb250ZXh0VHlwZXM6IGZ1bmN0aW9uKENvbnN0cnVjdG9yLCBjaGlsZENvbnRleHRUeXBlcykge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgdmFsaWRhdGVUeXBlRGVmKENvbnN0cnVjdG9yLCBjaGlsZENvbnRleHRUeXBlcywgJ2NoaWxkQ29udGV4dCcpO1xuICAgICAgfVxuICAgICAgQ29uc3RydWN0b3IuY2hpbGRDb250ZXh0VHlwZXMgPSBfYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAgQ29uc3RydWN0b3IuY2hpbGRDb250ZXh0VHlwZXMsXG4gICAgICAgIGNoaWxkQ29udGV4dFR5cGVzXG4gICAgICApO1xuICAgIH0sXG4gICAgY29udGV4dFR5cGVzOiBmdW5jdGlvbihDb25zdHJ1Y3RvciwgY29udGV4dFR5cGVzKSB7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICB2YWxpZGF0ZVR5cGVEZWYoQ29uc3RydWN0b3IsIGNvbnRleHRUeXBlcywgJ2NvbnRleHQnKTtcbiAgICAgIH1cbiAgICAgIENvbnN0cnVjdG9yLmNvbnRleHRUeXBlcyA9IF9hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICBDb25zdHJ1Y3Rvci5jb250ZXh0VHlwZXMsXG4gICAgICAgIGNvbnRleHRUeXBlc1xuICAgICAgKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFNwZWNpYWwgY2FzZSBnZXREZWZhdWx0UHJvcHMgd2hpY2ggc2hvdWxkIG1vdmUgaW50byBzdGF0aWNzIGJ1dCByZXF1aXJlc1xuICAgICAqIGF1dG9tYXRpYyBtZXJnaW5nLlxuICAgICAqL1xuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oQ29uc3RydWN0b3IsIGdldERlZmF1bHRQcm9wcykge1xuICAgICAgaWYgKENvbnN0cnVjdG9yLmdldERlZmF1bHRQcm9wcykge1xuICAgICAgICBDb25zdHJ1Y3Rvci5nZXREZWZhdWx0UHJvcHMgPSBjcmVhdGVNZXJnZWRSZXN1bHRGdW5jdGlvbihcbiAgICAgICAgICBDb25zdHJ1Y3Rvci5nZXREZWZhdWx0UHJvcHMsXG4gICAgICAgICAgZ2V0RGVmYXVsdFByb3BzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb25zdHJ1Y3Rvci5nZXREZWZhdWx0UHJvcHMgPSBnZXREZWZhdWx0UHJvcHM7XG4gICAgICB9XG4gICAgfSxcbiAgICBwcm9wVHlwZXM6IGZ1bmN0aW9uKENvbnN0cnVjdG9yLCBwcm9wVHlwZXMpIHtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIHZhbGlkYXRlVHlwZURlZihDb25zdHJ1Y3RvciwgcHJvcFR5cGVzLCAncHJvcCcpO1xuICAgICAgfVxuICAgICAgQ29uc3RydWN0b3IucHJvcFR5cGVzID0gX2Fzc2lnbih7fSwgQ29uc3RydWN0b3IucHJvcFR5cGVzLCBwcm9wVHlwZXMpO1xuICAgIH0sXG4gICAgc3RhdGljczogZnVuY3Rpb24oQ29uc3RydWN0b3IsIHN0YXRpY3MpIHtcbiAgICAgIG1peFN0YXRpY1NwZWNJbnRvQ29tcG9uZW50KENvbnN0cnVjdG9yLCBzdGF0aWNzKTtcbiAgICB9LFxuICAgIGF1dG9iaW5kOiBmdW5jdGlvbigpIHt9XG4gIH07XG5cbiAgZnVuY3Rpb24gdmFsaWRhdGVUeXBlRGVmKENvbnN0cnVjdG9yLCB0eXBlRGVmLCBsb2NhdGlvbikge1xuICAgIGZvciAodmFyIHByb3BOYW1lIGluIHR5cGVEZWYpIHtcbiAgICAgIGlmICh0eXBlRGVmLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAvLyB1c2UgYSB3YXJuaW5nIGluc3RlYWQgb2YgYW4gX2ludmFyaWFudCBzbyBjb21wb25lbnRzXG4gICAgICAgIC8vIGRvbid0IHNob3cgdXAgaW4gcHJvZCBidXQgb25seSBpbiBfX0RFVl9fXG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgd2FybmluZyhcbiAgICAgICAgICAgIHR5cGVvZiB0eXBlRGVmW3Byb3BOYW1lXSA9PT0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgICAgICclczogJXMgdHlwZSBgJXNgIGlzIGludmFsaWQ7IGl0IG11c3QgYmUgYSBmdW5jdGlvbiwgdXN1YWxseSBmcm9tICcgK1xuICAgICAgICAgICAgICAnUmVhY3QuUHJvcFR5cGVzLicsXG4gICAgICAgICAgICBDb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZSB8fCAnUmVhY3RDbGFzcycsXG4gICAgICAgICAgICBSZWFjdFByb3BUeXBlTG9jYXRpb25OYW1lc1tsb2NhdGlvbl0sXG4gICAgICAgICAgICBwcm9wTmFtZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2YWxpZGF0ZU1ldGhvZE92ZXJyaWRlKGlzQWxyZWFkeURlZmluZWQsIG5hbWUpIHtcbiAgICB2YXIgc3BlY1BvbGljeSA9IFJlYWN0Q2xhc3NJbnRlcmZhY2UuaGFzT3duUHJvcGVydHkobmFtZSlcbiAgICAgID8gUmVhY3RDbGFzc0ludGVyZmFjZVtuYW1lXVxuICAgICAgOiBudWxsO1xuXG4gICAgLy8gRGlzYWxsb3cgb3ZlcnJpZGluZyBvZiBiYXNlIGNsYXNzIG1ldGhvZHMgdW5sZXNzIGV4cGxpY2l0bHkgYWxsb3dlZC5cbiAgICBpZiAoUmVhY3RDbGFzc01peGluLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICBfaW52YXJpYW50KFxuICAgICAgICBzcGVjUG9saWN5ID09PSAnT1ZFUlJJREVfQkFTRScsXG4gICAgICAgICdSZWFjdENsYXNzSW50ZXJmYWNlOiBZb3UgYXJlIGF0dGVtcHRpbmcgdG8gb3ZlcnJpZGUgJyArXG4gICAgICAgICAgJ2Alc2AgZnJvbSB5b3VyIGNsYXNzIHNwZWNpZmljYXRpb24uIEVuc3VyZSB0aGF0IHlvdXIgbWV0aG9kIG5hbWVzICcgK1xuICAgICAgICAgICdkbyBub3Qgb3ZlcmxhcCB3aXRoIFJlYWN0IG1ldGhvZHMuJyxcbiAgICAgICAgbmFtZVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBEaXNhbGxvdyBkZWZpbmluZyBtZXRob2RzIG1vcmUgdGhhbiBvbmNlIHVubGVzcyBleHBsaWNpdGx5IGFsbG93ZWQuXG4gICAgaWYgKGlzQWxyZWFkeURlZmluZWQpIHtcbiAgICAgIF9pbnZhcmlhbnQoXG4gICAgICAgIHNwZWNQb2xpY3kgPT09ICdERUZJTkVfTUFOWScgfHwgc3BlY1BvbGljeSA9PT0gJ0RFRklORV9NQU5ZX01FUkdFRCcsXG4gICAgICAgICdSZWFjdENsYXNzSW50ZXJmYWNlOiBZb3UgYXJlIGF0dGVtcHRpbmcgdG8gZGVmaW5lICcgK1xuICAgICAgICAgICdgJXNgIG9uIHlvdXIgY29tcG9uZW50IG1vcmUgdGhhbiBvbmNlLiBUaGlzIGNvbmZsaWN0IG1heSBiZSBkdWUgJyArXG4gICAgICAgICAgJ3RvIGEgbWl4aW4uJyxcbiAgICAgICAgbmFtZVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWl4aW4gaGVscGVyIHdoaWNoIGhhbmRsZXMgcG9saWN5IHZhbGlkYXRpb24gYW5kIHJlc2VydmVkXG4gICAqIHNwZWNpZmljYXRpb24ga2V5cyB3aGVuIGJ1aWxkaW5nIFJlYWN0IGNsYXNzZXMuXG4gICAqL1xuICBmdW5jdGlvbiBtaXhTcGVjSW50b0NvbXBvbmVudChDb25zdHJ1Y3Rvciwgc3BlYykge1xuICAgIGlmICghc3BlYykge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgdmFyIHR5cGVvZlNwZWMgPSB0eXBlb2Ygc3BlYztcbiAgICAgICAgdmFyIGlzTWl4aW5WYWxpZCA9IHR5cGVvZlNwZWMgPT09ICdvYmplY3QnICYmIHNwZWMgIT09IG51bGw7XG5cbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICB3YXJuaW5nKFxuICAgICAgICAgICAgaXNNaXhpblZhbGlkLFxuICAgICAgICAgICAgXCIlczogWW91J3JlIGF0dGVtcHRpbmcgdG8gaW5jbHVkZSBhIG1peGluIHRoYXQgaXMgZWl0aGVyIG51bGwgXCIgK1xuICAgICAgICAgICAgICAnb3Igbm90IGFuIG9iamVjdC4gQ2hlY2sgdGhlIG1peGlucyBpbmNsdWRlZCBieSB0aGUgY29tcG9uZW50LCAnICtcbiAgICAgICAgICAgICAgJ2FzIHdlbGwgYXMgYW55IG1peGlucyB0aGV5IGluY2x1ZGUgdGhlbXNlbHZlcy4gJyArXG4gICAgICAgICAgICAgICdFeHBlY3RlZCBvYmplY3QgYnV0IGdvdCAlcy4nLFxuICAgICAgICAgICAgQ29uc3RydWN0b3IuZGlzcGxheU5hbWUgfHwgJ1JlYWN0Q2xhc3MnLFxuICAgICAgICAgICAgc3BlYyA9PT0gbnVsbCA/IG51bGwgOiB0eXBlb2ZTcGVjXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgX2ludmFyaWFudChcbiAgICAgIHR5cGVvZiBzcGVjICE9PSAnZnVuY3Rpb24nLFxuICAgICAgXCJSZWFjdENsYXNzOiBZb3UncmUgYXR0ZW1wdGluZyB0byBcIiArXG4gICAgICAgICd1c2UgYSBjb21wb25lbnQgY2xhc3Mgb3IgZnVuY3Rpb24gYXMgYSBtaXhpbi4gSW5zdGVhZCwganVzdCB1c2UgYSAnICtcbiAgICAgICAgJ3JlZ3VsYXIgb2JqZWN0LidcbiAgICApO1xuICAgIF9pbnZhcmlhbnQoXG4gICAgICAhaXNWYWxpZEVsZW1lbnQoc3BlYyksXG4gICAgICBcIlJlYWN0Q2xhc3M6IFlvdSdyZSBhdHRlbXB0aW5nIHRvIFwiICtcbiAgICAgICAgJ3VzZSBhIGNvbXBvbmVudCBhcyBhIG1peGluLiBJbnN0ZWFkLCBqdXN0IHVzZSBhIHJlZ3VsYXIgb2JqZWN0LidcbiAgICApO1xuXG4gICAgdmFyIHByb3RvID0gQ29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgIHZhciBhdXRvQmluZFBhaXJzID0gcHJvdG8uX19yZWFjdEF1dG9CaW5kUGFpcnM7XG5cbiAgICAvLyBCeSBoYW5kbGluZyBtaXhpbnMgYmVmb3JlIGFueSBvdGhlciBwcm9wZXJ0aWVzLCB3ZSBlbnN1cmUgdGhlIHNhbWVcbiAgICAvLyBjaGFpbmluZyBvcmRlciBpcyBhcHBsaWVkIHRvIG1ldGhvZHMgd2l0aCBERUZJTkVfTUFOWSBwb2xpY3ksIHdoZXRoZXJcbiAgICAvLyBtaXhpbnMgYXJlIGxpc3RlZCBiZWZvcmUgb3IgYWZ0ZXIgdGhlc2UgbWV0aG9kcyBpbiB0aGUgc3BlYy5cbiAgICBpZiAoc3BlYy5oYXNPd25Qcm9wZXJ0eShNSVhJTlNfS0VZKSkge1xuICAgICAgUkVTRVJWRURfU1BFQ19LRVlTLm1peGlucyhDb25zdHJ1Y3Rvciwgc3BlYy5taXhpbnMpO1xuICAgIH1cblxuICAgIGZvciAodmFyIG5hbWUgaW4gc3BlYykge1xuICAgICAgaWYgKCFzcGVjLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSA9PT0gTUlYSU5TX0tFWSkge1xuICAgICAgICAvLyBXZSBoYXZlIGFscmVhZHkgaGFuZGxlZCBtaXhpbnMgaW4gYSBzcGVjaWFsIGNhc2UgYWJvdmUuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvcGVydHkgPSBzcGVjW25hbWVdO1xuICAgICAgdmFyIGlzQWxyZWFkeURlZmluZWQgPSBwcm90by5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgICAgIHZhbGlkYXRlTWV0aG9kT3ZlcnJpZGUoaXNBbHJlYWR5RGVmaW5lZCwgbmFtZSk7XG5cbiAgICAgIGlmIChSRVNFUlZFRF9TUEVDX0tFWVMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgUkVTRVJWRURfU1BFQ19LRVlTW25hbWVdKENvbnN0cnVjdG9yLCBwcm9wZXJ0eSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTZXR1cCBtZXRob2RzIG9uIHByb3RvdHlwZTpcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBtZW1iZXIgbWV0aG9kcyBzaG91bGQgbm90IGJlIGF1dG9tYXRpY2FsbHkgYm91bmQ6XG4gICAgICAgIC8vIDEuIEV4cGVjdGVkIFJlYWN0Q2xhc3MgbWV0aG9kcyAoaW4gdGhlIFwiaW50ZXJmYWNlXCIpLlxuICAgICAgICAvLyAyLiBPdmVycmlkZGVuIG1ldGhvZHMgKHRoYXQgd2VyZSBtaXhlZCBpbikuXG4gICAgICAgIHZhciBpc1JlYWN0Q2xhc3NNZXRob2QgPSBSZWFjdENsYXNzSW50ZXJmYWNlLmhhc093blByb3BlcnR5KG5hbWUpO1xuICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IHR5cGVvZiBwcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgICAgdmFyIHNob3VsZEF1dG9CaW5kID1cbiAgICAgICAgICBpc0Z1bmN0aW9uICYmXG4gICAgICAgICAgIWlzUmVhY3RDbGFzc01ldGhvZCAmJlxuICAgICAgICAgICFpc0FscmVhZHlEZWZpbmVkICYmXG4gICAgICAgICAgc3BlYy5hdXRvYmluZCAhPT0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHNob3VsZEF1dG9CaW5kKSB7XG4gICAgICAgICAgYXV0b0JpbmRQYWlycy5wdXNoKG5hbWUsIHByb3BlcnR5KTtcbiAgICAgICAgICBwcm90b1tuYW1lXSA9IHByb3BlcnR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChpc0FscmVhZHlEZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgc3BlY1BvbGljeSA9IFJlYWN0Q2xhc3NJbnRlcmZhY2VbbmFtZV07XG5cbiAgICAgICAgICAgIC8vIFRoZXNlIGNhc2VzIHNob3VsZCBhbHJlYWR5IGJlIGNhdWdodCBieSB2YWxpZGF0ZU1ldGhvZE92ZXJyaWRlLlxuICAgICAgICAgICAgX2ludmFyaWFudChcbiAgICAgICAgICAgICAgaXNSZWFjdENsYXNzTWV0aG9kICYmXG4gICAgICAgICAgICAgICAgKHNwZWNQb2xpY3kgPT09ICdERUZJTkVfTUFOWV9NRVJHRUQnIHx8XG4gICAgICAgICAgICAgICAgICBzcGVjUG9saWN5ID09PSAnREVGSU5FX01BTlknKSxcbiAgICAgICAgICAgICAgJ1JlYWN0Q2xhc3M6IFVuZXhwZWN0ZWQgc3BlYyBwb2xpY3kgJXMgZm9yIGtleSAlcyAnICtcbiAgICAgICAgICAgICAgICAnd2hlbiBtaXhpbmcgaW4gY29tcG9uZW50IHNwZWNzLicsXG4gICAgICAgICAgICAgIHNwZWNQb2xpY3ksXG4gICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vIEZvciBtZXRob2RzIHdoaWNoIGFyZSBkZWZpbmVkIG1vcmUgdGhhbiBvbmNlLCBjYWxsIHRoZSBleGlzdGluZ1xuICAgICAgICAgICAgLy8gbWV0aG9kcyBiZWZvcmUgY2FsbGluZyB0aGUgbmV3IHByb3BlcnR5LCBtZXJnaW5nIGlmIGFwcHJvcHJpYXRlLlxuICAgICAgICAgICAgaWYgKHNwZWNQb2xpY3kgPT09ICdERUZJTkVfTUFOWV9NRVJHRUQnKSB7XG4gICAgICAgICAgICAgIHByb3RvW25hbWVdID0gY3JlYXRlTWVyZ2VkUmVzdWx0RnVuY3Rpb24ocHJvdG9bbmFtZV0sIHByb3BlcnR5KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3BlY1BvbGljeSA9PT0gJ0RFRklORV9NQU5ZJykge1xuICAgICAgICAgICAgICBwcm90b1tuYW1lXSA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihwcm90b1tuYW1lXSwgcHJvcGVydHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm90b1tuYW1lXSA9IHByb3BlcnR5O1xuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgLy8gQWRkIHZlcmJvc2UgZGlzcGxheU5hbWUgdG8gdGhlIGZ1bmN0aW9uLCB3aGljaCBoZWxwcyB3aGVuIGxvb2tpbmdcbiAgICAgICAgICAgICAgLy8gYXQgcHJvZmlsaW5nIHRvb2xzLlxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09PSAnZnVuY3Rpb24nICYmIHNwZWMuZGlzcGxheU5hbWUpIHtcbiAgICAgICAgICAgICAgICBwcm90b1tuYW1lXS5kaXNwbGF5TmFtZSA9IHNwZWMuZGlzcGxheU5hbWUgKyAnXycgKyBuYW1lO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWl4U3RhdGljU3BlY0ludG9Db21wb25lbnQoQ29uc3RydWN0b3IsIHN0YXRpY3MpIHtcbiAgICBpZiAoIXN0YXRpY3MpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBuYW1lIGluIHN0YXRpY3MpIHtcbiAgICAgIHZhciBwcm9wZXJ0eSA9IHN0YXRpY3NbbmFtZV07XG4gICAgICBpZiAoIXN0YXRpY3MuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHZhciBpc1Jlc2VydmVkID0gbmFtZSBpbiBSRVNFUlZFRF9TUEVDX0tFWVM7XG4gICAgICBfaW52YXJpYW50KFxuICAgICAgICAhaXNSZXNlcnZlZCxcbiAgICAgICAgJ1JlYWN0Q2xhc3M6IFlvdSBhcmUgYXR0ZW1wdGluZyB0byBkZWZpbmUgYSByZXNlcnZlZCAnICtcbiAgICAgICAgICAncHJvcGVydHksIGAlc2AsIHRoYXQgc2hvdWxkblxcJ3QgYmUgb24gdGhlIFwic3RhdGljc1wiIGtleS4gRGVmaW5lIGl0ICcgK1xuICAgICAgICAgICdhcyBhbiBpbnN0YW5jZSBwcm9wZXJ0eSBpbnN0ZWFkOyBpdCB3aWxsIHN0aWxsIGJlIGFjY2Vzc2libGUgb24gdGhlICcgK1xuICAgICAgICAgICdjb25zdHJ1Y3Rvci4nLFxuICAgICAgICBuYW1lXG4gICAgICApO1xuXG4gICAgICB2YXIgaXNBbHJlYWR5RGVmaW5lZCA9IG5hbWUgaW4gQ29uc3RydWN0b3I7XG4gICAgICBpZiAoaXNBbHJlYWR5RGVmaW5lZCkge1xuICAgICAgICB2YXIgc3BlY1BvbGljeSA9IFJlYWN0Q2xhc3NTdGF0aWNJbnRlcmZhY2UuaGFzT3duUHJvcGVydHkobmFtZSlcbiAgICAgICAgICA/IFJlYWN0Q2xhc3NTdGF0aWNJbnRlcmZhY2VbbmFtZV1cbiAgICAgICAgICA6IG51bGw7XG5cbiAgICAgICAgX2ludmFyaWFudChcbiAgICAgICAgICBzcGVjUG9saWN5ID09PSAnREVGSU5FX01BTllfTUVSR0VEJyxcbiAgICAgICAgICAnUmVhY3RDbGFzczogWW91IGFyZSBhdHRlbXB0aW5nIHRvIGRlZmluZSAnICtcbiAgICAgICAgICAgICdgJXNgIG9uIHlvdXIgY29tcG9uZW50IG1vcmUgdGhhbiBvbmNlLiBUaGlzIGNvbmZsaWN0IG1heSBiZSAnICtcbiAgICAgICAgICAgICdkdWUgdG8gYSBtaXhpbi4nLFxuICAgICAgICAgIG5hbWVcbiAgICAgICAgKTtcblxuICAgICAgICBDb25zdHJ1Y3RvcltuYW1lXSA9IGNyZWF0ZU1lcmdlZFJlc3VsdEZ1bmN0aW9uKENvbnN0cnVjdG9yW25hbWVdLCBwcm9wZXJ0eSk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBDb25zdHJ1Y3RvcltuYW1lXSA9IHByb3BlcnR5O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZXJnZSB0d28gb2JqZWN0cywgYnV0IHRocm93IGlmIGJvdGggY29udGFpbiB0aGUgc2FtZSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvbmUgVGhlIGZpcnN0IG9iamVjdCwgd2hpY2ggaXMgbXV0YXRlZC5cbiAgICogQHBhcmFtIHtvYmplY3R9IHR3byBUaGUgc2Vjb25kIG9iamVjdFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IG9uZSBhZnRlciBpdCBoYXMgYmVlbiBtdXRhdGVkIHRvIGNvbnRhaW4gZXZlcnl0aGluZyBpbiB0d28uXG4gICAqL1xuICBmdW5jdGlvbiBtZXJnZUludG9XaXRoTm9EdXBsaWNhdGVLZXlzKG9uZSwgdHdvKSB7XG4gICAgX2ludmFyaWFudChcbiAgICAgIG9uZSAmJiB0d28gJiYgdHlwZW9mIG9uZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHR3byA9PT0gJ29iamVjdCcsXG4gICAgICAnbWVyZ2VJbnRvV2l0aE5vRHVwbGljYXRlS2V5cygpOiBDYW5ub3QgbWVyZ2Ugbm9uLW9iamVjdHMuJ1xuICAgICk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gdHdvKSB7XG4gICAgICBpZiAodHdvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgX2ludmFyaWFudChcbiAgICAgICAgICBvbmVba2V5XSA9PT0gdW5kZWZpbmVkLFxuICAgICAgICAgICdtZXJnZUludG9XaXRoTm9EdXBsaWNhdGVLZXlzKCk6ICcgK1xuICAgICAgICAgICAgJ1RyaWVkIHRvIG1lcmdlIHR3byBvYmplY3RzIHdpdGggdGhlIHNhbWUga2V5OiBgJXNgLiBUaGlzIGNvbmZsaWN0ICcgK1xuICAgICAgICAgICAgJ21heSBiZSBkdWUgdG8gYSBtaXhpbjsgaW4gcGFydGljdWxhciwgdGhpcyBtYXkgYmUgY2F1c2VkIGJ5IHR3byAnICtcbiAgICAgICAgICAgICdnZXRJbml0aWFsU3RhdGUoKSBvciBnZXREZWZhdWx0UHJvcHMoKSBtZXRob2RzIHJldHVybmluZyBvYmplY3RzICcgK1xuICAgICAgICAgICAgJ3dpdGggY2xhc2hpbmcga2V5cy4nLFxuICAgICAgICAgIGtleVxuICAgICAgICApO1xuICAgICAgICBvbmVba2V5XSA9IHR3b1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb25lO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGludm9rZXMgdHdvIGZ1bmN0aW9ucyBhbmQgbWVyZ2VzIHRoZWlyIHJldHVybiB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uZSBGdW5jdGlvbiB0byBpbnZva2UgZmlyc3QuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHR3byBGdW5jdGlvbiB0byBpbnZva2Ugc2Vjb25kLlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gRnVuY3Rpb24gdGhhdCBpbnZva2VzIHRoZSB0d28gYXJndW1lbnQgZnVuY3Rpb25zLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlTWVyZ2VkUmVzdWx0RnVuY3Rpb24ob25lLCB0d28pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gbWVyZ2VkUmVzdWx0KCkge1xuICAgICAgdmFyIGEgPSBvbmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHZhciBiID0gdHdvLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoYSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgICAgfSBlbHNlIGlmIChiID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgICB9XG4gICAgICB2YXIgYyA9IHt9O1xuICAgICAgbWVyZ2VJbnRvV2l0aE5vRHVwbGljYXRlS2V5cyhjLCBhKTtcbiAgICAgIG1lcmdlSW50b1dpdGhOb0R1cGxpY2F0ZUtleXMoYywgYik7XG4gICAgICByZXR1cm4gYztcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGludm9rZXMgdHdvIGZ1bmN0aW9ucyBhbmQgaWdub3JlcyB0aGVpciByZXR1cm4gdmFsZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uZSBGdW5jdGlvbiB0byBpbnZva2UgZmlyc3QuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHR3byBGdW5jdGlvbiB0byBpbnZva2Ugc2Vjb25kLlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gRnVuY3Rpb24gdGhhdCBpbnZva2VzIHRoZSB0d28gYXJndW1lbnQgZnVuY3Rpb25zLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKG9uZSwgdHdvKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNoYWluZWRGdW5jdGlvbigpIHtcbiAgICAgIG9uZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgdHdvLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIG1ldGhvZCB0byB0aGUgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gY29tcG9uZW50IENvbXBvbmVudCB3aG9zZSBtZXRob2QgaXMgZ29pbmcgdG8gYmUgYm91bmQuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1ldGhvZCBNZXRob2QgdG8gYmUgYm91bmQuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufSBUaGUgYm91bmQgbWV0aG9kLlxuICAgKi9cbiAgZnVuY3Rpb24gYmluZEF1dG9CaW5kTWV0aG9kKGNvbXBvbmVudCwgbWV0aG9kKSB7XG4gICAgdmFyIGJvdW5kTWV0aG9kID0gbWV0aG9kLmJpbmQoY29tcG9uZW50KTtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgYm91bmRNZXRob2QuX19yZWFjdEJvdW5kQ29udGV4dCA9IGNvbXBvbmVudDtcbiAgICAgIGJvdW5kTWV0aG9kLl9fcmVhY3RCb3VuZE1ldGhvZCA9IG1ldGhvZDtcbiAgICAgIGJvdW5kTWV0aG9kLl9fcmVhY3RCb3VuZEFyZ3VtZW50cyA9IG51bGw7XG4gICAgICB2YXIgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZTtcbiAgICAgIHZhciBfYmluZCA9IGJvdW5kTWV0aG9kLmJpbmQ7XG4gICAgICBib3VuZE1ldGhvZC5iaW5kID0gZnVuY3Rpb24obmV3VGhpcykge1xuICAgICAgICBmb3IgKFxuICAgICAgICAgIHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksXG4gICAgICAgICAgICBfa2V5ID0gMTtcbiAgICAgICAgICBfa2V5IDwgX2xlbjtcbiAgICAgICAgICBfa2V5KytcbiAgICAgICAgKSB7XG4gICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VyIGlzIHRyeWluZyB0byBiaW5kKCkgYW4gYXV0b2JvdW5kIG1ldGhvZDsgd2UgZWZmZWN0aXZlbHkgd2lsbFxuICAgICAgICAvLyBpZ25vcmUgdGhlIHZhbHVlIG9mIFwidGhpc1wiIHRoYXQgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHVzZSwgc29cbiAgICAgICAgLy8gbGV0J3Mgd2Fybi5cbiAgICAgICAgaWYgKG5ld1RoaXMgIT09IGNvbXBvbmVudCAmJiBuZXdUaGlzICE9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIHdhcm5pbmcoXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAnYmluZCgpOiBSZWFjdCBjb21wb25lbnQgbWV0aG9kcyBtYXkgb25seSBiZSBib3VuZCB0byB0aGUgJyArXG4gICAgICAgICAgICAgICAgJ2NvbXBvbmVudCBpbnN0YW5jZS4gU2VlICVzJyxcbiAgICAgICAgICAgICAgY29tcG9uZW50TmFtZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIHdhcm5pbmcoXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAnYmluZCgpOiBZb3UgYXJlIGJpbmRpbmcgYSBjb21wb25lbnQgbWV0aG9kIHRvIHRoZSBjb21wb25lbnQuICcgK1xuICAgICAgICAgICAgICAgICdSZWFjdCBkb2VzIHRoaXMgZm9yIHlvdSBhdXRvbWF0aWNhbGx5IGluIGEgaGlnaC1wZXJmb3JtYW5jZSAnICtcbiAgICAgICAgICAgICAgICAnd2F5LCBzbyB5b3UgY2FuIHNhZmVseSByZW1vdmUgdGhpcyBjYWxsLiBTZWUgJXMnLFxuICAgICAgICAgICAgICBjb21wb25lbnROYW1lXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYm91bmRNZXRob2Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlYm91bmRNZXRob2QgPSBfYmluZC5hcHBseShib3VuZE1ldGhvZCwgYXJndW1lbnRzKTtcbiAgICAgICAgcmVib3VuZE1ldGhvZC5fX3JlYWN0Qm91bmRDb250ZXh0ID0gY29tcG9uZW50O1xuICAgICAgICByZWJvdW5kTWV0aG9kLl9fcmVhY3RCb3VuZE1ldGhvZCA9IG1ldGhvZDtcbiAgICAgICAgcmVib3VuZE1ldGhvZC5fX3JlYWN0Qm91bmRBcmd1bWVudHMgPSBhcmdzO1xuICAgICAgICByZXR1cm4gcmVib3VuZE1ldGhvZDtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBib3VuZE1ldGhvZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhbGwgYXV0by1ib3VuZCBtZXRob2RzIGluIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gY29tcG9uZW50IENvbXBvbmVudCB3aG9zZSBtZXRob2QgaXMgZ29pbmcgdG8gYmUgYm91bmQuXG4gICAqL1xuICBmdW5jdGlvbiBiaW5kQXV0b0JpbmRNZXRob2RzKGNvbXBvbmVudCkge1xuICAgIHZhciBwYWlycyA9IGNvbXBvbmVudC5fX3JlYWN0QXV0b0JpbmRQYWlycztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgYXV0b0JpbmRLZXkgPSBwYWlyc1tpXTtcbiAgICAgIHZhciBtZXRob2QgPSBwYWlyc1tpICsgMV07XG4gICAgICBjb21wb25lbnRbYXV0b0JpbmRLZXldID0gYmluZEF1dG9CaW5kTWV0aG9kKGNvbXBvbmVudCwgbWV0aG9kKTtcbiAgICB9XG4gIH1cblxuICB2YXIgSXNNb3VudGVkUHJlTWl4aW4gPSB7XG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fX2lzTW91bnRlZCA9IHRydWU7XG4gICAgfVxuICB9O1xuXG4gIHZhciBJc01vdW50ZWRQb3N0TWl4aW4gPSB7XG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fX2lzTW91bnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQWRkIG1vcmUgdG8gdGhlIFJlYWN0Q2xhc3MgYmFzZSBjbGFzcy4gVGhlc2UgYXJlIGFsbCBsZWdhY3kgZmVhdHVyZXMgYW5kXG4gICAqIHRoZXJlZm9yZSBub3QgYWxyZWFkeSBwYXJ0IG9mIHRoZSBtb2Rlcm4gUmVhY3RDb21wb25lbnQuXG4gICAqL1xuICB2YXIgUmVhY3RDbGFzc01peGluID0ge1xuICAgIC8qKlxuICAgICAqIFRPRE86IFRoaXMgd2lsbCBiZSBkZXByZWNhdGVkIGJlY2F1c2Ugc3RhdGUgc2hvdWxkIGFsd2F5cyBrZWVwIGEgY29uc2lzdGVudFxuICAgICAqIHR5cGUgc2lnbmF0dXJlIGFuZCB0aGUgb25seSB1c2UgY2FzZSBmb3IgdGhpcywgaXMgdG8gYXZvaWQgdGhhdC5cbiAgICAgKi9cbiAgICByZXBsYWNlU3RhdGU6IGZ1bmN0aW9uKG5ld1N0YXRlLCBjYWxsYmFjaykge1xuICAgICAgdGhpcy51cGRhdGVyLmVucXVldWVSZXBsYWNlU3RhdGUodGhpcywgbmV3U3RhdGUsIGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoaXMgY29tcG9zaXRlIGNvbXBvbmVudCBpcyBtb3VudGVkLlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgbW91bnRlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKiBAZmluYWxcbiAgICAgKi9cbiAgICBpc01vdW50ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgd2FybmluZyhcbiAgICAgICAgICB0aGlzLl9fZGlkV2FybklzTW91bnRlZCxcbiAgICAgICAgICAnJXM6IGlzTW91bnRlZCBpcyBkZXByZWNhdGVkLiBJbnN0ZWFkLCBtYWtlIHN1cmUgdG8gY2xlYW4gdXAgJyArXG4gICAgICAgICAgICAnc3Vic2NyaXB0aW9ucyBhbmQgcGVuZGluZyByZXF1ZXN0cyBpbiBjb21wb25lbnRXaWxsVW5tb3VudCB0byAnICtcbiAgICAgICAgICAgICdwcmV2ZW50IG1lbW9yeSBsZWFrcy4nLFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yICYmIHRoaXMuY29uc3RydWN0b3IuZGlzcGxheU5hbWUpIHx8XG4gICAgICAgICAgICB0aGlzLm5hbWUgfHxcbiAgICAgICAgICAgICdDb21wb25lbnQnXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX19kaWRXYXJuSXNNb3VudGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAhIXRoaXMuX19pc01vdW50ZWQ7XG4gICAgfVxuICB9O1xuXG4gIHZhciBSZWFjdENsYXNzQ29tcG9uZW50ID0gZnVuY3Rpb24oKSB7fTtcbiAgX2Fzc2lnbihcbiAgICBSZWFjdENsYXNzQ29tcG9uZW50LnByb3RvdHlwZSxcbiAgICBSZWFjdENvbXBvbmVudC5wcm90b3R5cGUsXG4gICAgUmVhY3RDbGFzc01peGluXG4gICk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb21wb3NpdGUgY29tcG9uZW50IGNsYXNzIGdpdmVuIGEgY2xhc3Mgc3BlY2lmaWNhdGlvbi5cbiAgICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvdG9wLWxldmVsLWFwaS5odG1sI3JlYWN0LmNyZWF0ZWNsYXNzXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBzcGVjIENsYXNzIHNwZWNpZmljYXRpb24gKHdoaWNoIG11c3QgZGVmaW5lIGByZW5kZXJgKS5cbiAgICogQHJldHVybiB7ZnVuY3Rpb259IENvbXBvbmVudCBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlQ2xhc3Moc3BlYykge1xuICAgIC8vIFRvIGtlZXAgb3VyIHdhcm5pbmdzIG1vcmUgdW5kZXJzdGFuZGFibGUsIHdlJ2xsIHVzZSBhIGxpdHRsZSBoYWNrIGhlcmUgdG9cbiAgICAvLyBlbnN1cmUgdGhhdCBDb25zdHJ1Y3Rvci5uYW1lICE9PSAnQ29uc3RydWN0b3InLiBUaGlzIG1ha2VzIHN1cmUgd2UgZG9uJ3RcbiAgICAvLyB1bm5lY2Vzc2FyaWx5IGlkZW50aWZ5IGEgY2xhc3Mgd2l0aG91dCBkaXNwbGF5TmFtZSBhcyAnQ29uc3RydWN0b3InLlxuICAgIHZhciBDb25zdHJ1Y3RvciA9IGlkZW50aXR5KGZ1bmN0aW9uKHByb3BzLCBjb250ZXh0LCB1cGRhdGVyKSB7XG4gICAgICAvLyBUaGlzIGNvbnN0cnVjdG9yIGdldHMgb3ZlcnJpZGRlbiBieSBtb2Nrcy4gVGhlIGFyZ3VtZW50IGlzIHVzZWRcbiAgICAgIC8vIGJ5IG1vY2tzIHRvIGFzc2VydCBvbiB3aGF0IGdldHMgbW91bnRlZC5cblxuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgd2FybmluZyhcbiAgICAgICAgICB0aGlzIGluc3RhbmNlb2YgQ29uc3RydWN0b3IsXG4gICAgICAgICAgJ1NvbWV0aGluZyBpcyBjYWxsaW5nIGEgUmVhY3QgY29tcG9uZW50IGRpcmVjdGx5LiBVc2UgYSBmYWN0b3J5IG9yICcgK1xuICAgICAgICAgICAgJ0pTWCBpbnN0ZWFkLiBTZWU6IGh0dHBzOi8vZmIubWUvcmVhY3QtbGVnYWN5ZmFjdG9yeSdcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2lyZSB1cCBhdXRvLWJpbmRpbmdcbiAgICAgIGlmICh0aGlzLl9fcmVhY3RBdXRvQmluZFBhaXJzLmxlbmd0aCkge1xuICAgICAgICBiaW5kQXV0b0JpbmRNZXRob2RzKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgdGhpcy5yZWZzID0gZW1wdHlPYmplY3Q7XG4gICAgICB0aGlzLnVwZGF0ZXIgPSB1cGRhdGVyIHx8IFJlYWN0Tm9vcFVwZGF0ZVF1ZXVlO1xuXG4gICAgICB0aGlzLnN0YXRlID0gbnVsbDtcblxuICAgICAgLy8gUmVhY3RDbGFzc2VzIGRvZXNuJ3QgaGF2ZSBjb25zdHJ1Y3RvcnMuIEluc3RlYWQsIHRoZXkgdXNlIHRoZVxuICAgICAgLy8gZ2V0SW5pdGlhbFN0YXRlIGFuZCBjb21wb25lbnRXaWxsTW91bnQgbWV0aG9kcyBmb3IgaW5pdGlhbGl6YXRpb24uXG5cbiAgICAgIHZhciBpbml0aWFsU3RhdGUgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSA/IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCkgOiBudWxsO1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgLy8gV2UgYWxsb3cgYXV0by1tb2NrcyB0byBwcm9jZWVkIGFzIGlmIHRoZXkncmUgcmV0dXJuaW5nIG51bGwuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBpbml0aWFsU3RhdGUgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgIHRoaXMuZ2V0SW5pdGlhbFN0YXRlLl9pc01vY2tGdW5jdGlvblxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIHByb2JhYmx5IGJhZCBwcmFjdGljZS4gQ29uc2lkZXIgd2FybmluZyBoZXJlIGFuZFxuICAgICAgICAgIC8vIGRlcHJlY2F0aW5nIHRoaXMgY29udmVuaWVuY2UuXG4gICAgICAgICAgaW5pdGlhbFN0YXRlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX2ludmFyaWFudChcbiAgICAgICAgdHlwZW9mIGluaXRpYWxTdGF0ZSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoaW5pdGlhbFN0YXRlKSxcbiAgICAgICAgJyVzLmdldEluaXRpYWxTdGF0ZSgpOiBtdXN0IHJldHVybiBhbiBvYmplY3Qgb3IgbnVsbCcsXG4gICAgICAgIENvbnN0cnVjdG9yLmRpc3BsYXlOYW1lIHx8ICdSZWFjdENvbXBvc2l0ZUNvbXBvbmVudCdcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuc3RhdGUgPSBpbml0aWFsU3RhdGU7XG4gICAgfSk7XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlID0gbmV3IFJlYWN0Q2xhc3NDb21wb25lbnQoKTtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuX19yZWFjdEF1dG9CaW5kUGFpcnMgPSBbXTtcblxuICAgIGluamVjdGVkTWl4aW5zLmZvckVhY2gobWl4U3BlY0ludG9Db21wb25lbnQuYmluZChudWxsLCBDb25zdHJ1Y3RvcikpO1xuXG4gICAgbWl4U3BlY0ludG9Db21wb25lbnQoQ29uc3RydWN0b3IsIElzTW91bnRlZFByZU1peGluKTtcbiAgICBtaXhTcGVjSW50b0NvbXBvbmVudChDb25zdHJ1Y3Rvciwgc3BlYyk7XG4gICAgbWl4U3BlY0ludG9Db21wb25lbnQoQ29uc3RydWN0b3IsIElzTW91bnRlZFBvc3RNaXhpbik7XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSBkZWZhdWx0UHJvcHMgcHJvcGVydHkgYWZ0ZXIgYWxsIG1peGlucyBoYXZlIGJlZW4gbWVyZ2VkLlxuICAgIGlmIChDb25zdHJ1Y3Rvci5nZXREZWZhdWx0UHJvcHMpIHtcbiAgICAgIENvbnN0cnVjdG9yLmRlZmF1bHRQcm9wcyA9IENvbnN0cnVjdG9yLmdldERlZmF1bHRQcm9wcygpO1xuICAgIH1cblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgdGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZSBvZiB0aGVzZSBtZXRob2QgbmFtZXMgaXMgb2ssXG4gICAgICAvLyBzaW5jZSBpdCdzIHVzZWQgd2l0aCBjcmVhdGVDbGFzcy4gSWYgaXQncyBub3QsIHRoZW4gaXQncyBsaWtlbHkgYVxuICAgICAgLy8gbWlzdGFrZSBzbyB3ZSdsbCB3YXJuIHlvdSB0byB1c2UgdGhlIHN0YXRpYyBwcm9wZXJ0eSwgcHJvcGVydHlcbiAgICAgIC8vIGluaXRpYWxpemVyIG9yIGNvbnN0cnVjdG9yIHJlc3BlY3RpdmVseS5cbiAgICAgIGlmIChDb25zdHJ1Y3Rvci5nZXREZWZhdWx0UHJvcHMpIHtcbiAgICAgICAgQ29uc3RydWN0b3IuZ2V0RGVmYXVsdFByb3BzLmlzUmVhY3RDbGFzc0FwcHJvdmVkID0ge307XG4gICAgICB9XG4gICAgICBpZiAoQ29uc3RydWN0b3IucHJvdG90eXBlLmdldEluaXRpYWxTdGF0ZSkge1xuICAgICAgICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0SW5pdGlhbFN0YXRlLmlzUmVhY3RDbGFzc0FwcHJvdmVkID0ge307XG4gICAgICB9XG4gICAgfVxuXG4gICAgX2ludmFyaWFudChcbiAgICAgIENvbnN0cnVjdG9yLnByb3RvdHlwZS5yZW5kZXIsXG4gICAgICAnY3JlYXRlQ2xhc3MoLi4uKTogQ2xhc3Mgc3BlY2lmaWNhdGlvbiBtdXN0IGltcGxlbWVudCBhIGByZW5kZXJgIG1ldGhvZC4nXG4gICAgKTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICB3YXJuaW5nKFxuICAgICAgICAhQ29uc3RydWN0b3IucHJvdG90eXBlLmNvbXBvbmVudFNob3VsZFVwZGF0ZSxcbiAgICAgICAgJyVzIGhhcyBhIG1ldGhvZCBjYWxsZWQgJyArXG4gICAgICAgICAgJ2NvbXBvbmVudFNob3VsZFVwZGF0ZSgpLiBEaWQgeW91IG1lYW4gc2hvdWxkQ29tcG9uZW50VXBkYXRlKCk/ICcgK1xuICAgICAgICAgICdUaGUgbmFtZSBpcyBwaHJhc2VkIGFzIGEgcXVlc3Rpb24gYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgJyArXG4gICAgICAgICAgJ2V4cGVjdGVkIHRvIHJldHVybiBhIHZhbHVlLicsXG4gICAgICAgIHNwZWMuZGlzcGxheU5hbWUgfHwgJ0EgY29tcG9uZW50J1xuICAgICAgKTtcbiAgICAgIHdhcm5pbmcoXG4gICAgICAgICFDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29tcG9uZW50V2lsbFJlY2lldmVQcm9wcyxcbiAgICAgICAgJyVzIGhhcyBhIG1ldGhvZCBjYWxsZWQgJyArXG4gICAgICAgICAgJ2NvbXBvbmVudFdpbGxSZWNpZXZlUHJvcHMoKS4gRGlkIHlvdSBtZWFuIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMoKT8nLFxuICAgICAgICBzcGVjLmRpc3BsYXlOYW1lIHx8ICdBIGNvbXBvbmVudCdcbiAgICAgICk7XG4gICAgICB3YXJuaW5nKFxuICAgICAgICAhQ29uc3RydWN0b3IucHJvdG90eXBlLlVOU0FGRV9jb21wb25lbnRXaWxsUmVjaWV2ZVByb3BzLFxuICAgICAgICAnJXMgaGFzIGEgbWV0aG9kIGNhbGxlZCBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2lldmVQcm9wcygpLiAnICtcbiAgICAgICAgICAnRGlkIHlvdSBtZWFuIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKCk/JyxcbiAgICAgICAgc3BlYy5kaXNwbGF5TmFtZSB8fCAnQSBjb21wb25lbnQnXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFJlZHVjZSB0aW1lIHNwZW50IGRvaW5nIGxvb2t1cHMgYnkgc2V0dGluZyB0aGVzZSBvbiB0aGUgcHJvdG90eXBlLlxuICAgIGZvciAodmFyIG1ldGhvZE5hbWUgaW4gUmVhY3RDbGFzc0ludGVyZmFjZSkge1xuICAgICAgaWYgKCFDb25zdHJ1Y3Rvci5wcm90b3R5cGVbbWV0aG9kTmFtZV0pIHtcbiAgICAgICAgQ29uc3RydWN0b3IucHJvdG90eXBlW21ldGhvZE5hbWVdID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gIH1cblxuICByZXR1cm4gY3JlYXRlQ2xhc3M7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIFxuICovXG5cbmZ1bmN0aW9uIG1ha2VFbXB0eUZ1bmN0aW9uKGFyZykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhcmc7XG4gIH07XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIGFuZCBkaXNjYXJkcyBpbnB1dHM7IGl0IGhhcyBubyBzaWRlIGVmZmVjdHMuIFRoaXMgaXNcbiAqIHByaW1hcmlseSB1c2VmdWwgaWRpb21hdGljYWxseSBmb3Igb3ZlcnJpZGFibGUgZnVuY3Rpb24gZW5kcG9pbnRzIHdoaWNoXG4gKiBhbHdheXMgbmVlZCB0byBiZSBjYWxsYWJsZSwgc2luY2UgSlMgbGFja3MgYSBudWxsLWNhbGwgaWRpb20gYWxhIENvY29hLlxuICovXG52YXIgZW1wdHlGdW5jdGlvbiA9IGZ1bmN0aW9uIGVtcHR5RnVuY3Rpb24oKSB7fTtcblxuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJucyA9IG1ha2VFbXB0eUZ1bmN0aW9uO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc0ZhbHNlID0gbWFrZUVtcHR5RnVuY3Rpb24oZmFsc2UpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc1RydWUgPSBtYWtlRW1wdHlGdW5jdGlvbih0cnVlKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNOdWxsID0gbWFrZUVtcHR5RnVuY3Rpb24obnVsbCk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVGhpcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc0FyZ3VtZW50ID0gZnVuY3Rpb24gKGFyZykge1xuICByZXR1cm4gYXJnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBlbXB0eUZ1bmN0aW9uOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGVtcHR5T2JqZWN0ID0ge307XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIE9iamVjdC5mcmVlemUoZW1wdHlPYmplY3QpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVtcHR5T2JqZWN0OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVc2UgaW52YXJpYW50KCkgdG8gYXNzZXJ0IHN0YXRlIHdoaWNoIHlvdXIgcHJvZ3JhbSBhc3N1bWVzIHRvIGJlIHRydWUuXG4gKlxuICogUHJvdmlkZSBzcHJpbnRmLXN0eWxlIGZvcm1hdCAob25seSAlcyBpcyBzdXBwb3J0ZWQpIGFuZCBhcmd1bWVudHNcbiAqIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBicm9rZSBhbmQgd2hhdCB5b3Ugd2VyZVxuICogZXhwZWN0aW5nLlxuICpcbiAqIFRoZSBpbnZhcmlhbnQgbWVzc2FnZSB3aWxsIGJlIHN0cmlwcGVkIGluIHByb2R1Y3Rpb24sIGJ1dCB0aGUgaW52YXJpYW50XG4gKiB3aWxsIHJlbWFpbiB0byBlbnN1cmUgbG9naWMgZG9lcyBub3QgZGlmZmVyIGluIHByb2R1Y3Rpb24uXG4gKi9cblxudmFyIHZhbGlkYXRlRm9ybWF0ID0gZnVuY3Rpb24gdmFsaWRhdGVGb3JtYXQoZm9ybWF0KSB7fTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFsaWRhdGVGb3JtYXQgPSBmdW5jdGlvbiB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGludmFyaWFudChjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpO1xuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgKyAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107XG4gICAgICB9KSk7XG4gICAgICBlcnJvci5uYW1lID0gJ0ludmFyaWFudCBWaW9sYXRpb24nO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbXB0eUZ1bmN0aW9uID0gcmVxdWlyZSgnLi9lbXB0eUZ1bmN0aW9uJyk7XG5cbi8qKlxuICogU2ltaWxhciB0byBpbnZhcmlhbnQgYnV0IG9ubHkgbG9ncyBhIHdhcm5pbmcgaWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LlxuICogVGhpcyBjYW4gYmUgdXNlZCB0byBsb2cgaXNzdWVzIGluIGRldmVsb3BtZW50IGVudmlyb25tZW50cyBpbiBjcml0aWNhbFxuICogcGF0aHMuIFJlbW92aW5nIHRoZSBsb2dnaW5nIGNvZGUgZm9yIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRzIHdpbGwga2VlcCB0aGVcbiAqIHNhbWUgbG9naWMgYW5kIGZvbGxvdyB0aGUgc2FtZSBjb2RlIHBhdGhzLlxuICovXG5cbnZhciB3YXJuaW5nID0gZW1wdHlGdW5jdGlvbjtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFyIHByaW50V2FybmluZyA9IGZ1bmN0aW9uIHByaW50V2FybmluZyhmb3JtYXQpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgdmFyIG1lc3NhZ2UgPSAnV2FybmluZzogJyArIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gYXJnc1thcmdJbmRleCsrXTtcbiAgICB9KTtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgLy8gLS0tIFdlbGNvbWUgdG8gZGVidWdnaW5nIFJlYWN0IC0tLVxuICAgICAgLy8gVGhpcyBlcnJvciB3YXMgdGhyb3duIGFzIGEgY29udmVuaWVuY2Ugc28gdGhhdCB5b3UgY2FuIHVzZSB0aGlzIHN0YWNrXG4gICAgICAvLyB0byBmaW5kIHRoZSBjYWxsc2l0ZSB0aGF0IGNhdXNlZCB0aGlzIHdhcm5pbmcgdG8gZmlyZS5cbiAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9IGNhdGNoICh4KSB7fVxuICB9O1xuXG4gIHdhcm5pbmcgPSBmdW5jdGlvbiB3YXJuaW5nKGNvbmRpdGlvbiwgZm9ybWF0KSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2B3YXJuaW5nKGNvbmRpdGlvbiwgZm9ybWF0LCAuLi5hcmdzKWAgcmVxdWlyZXMgYSB3YXJuaW5nICcgKyAnbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cblxuICAgIGlmIChmb3JtYXQuaW5kZXhPZignRmFpbGVkIENvbXBvc2l0ZSBwcm9wVHlwZTogJykgPT09IDApIHtcbiAgICAgIHJldHVybjsgLy8gSWdub3JlIENvbXBvc2l0ZUNvbXBvbmVudCBwcm9wdHlwZSBjaGVjay5cbiAgICB9XG5cbiAgICBpZiAoIWNvbmRpdGlvbikge1xuICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjIgPiAyID8gX2xlbjIgLSAyIDogMCksIF9rZXkyID0gMjsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgICBhcmdzW19rZXkyIC0gMl0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgICAgfVxuXG4gICAgICBwcmludFdhcm5pbmcuYXBwbHkodW5kZWZpbmVkLCBbZm9ybWF0XS5jb25jYXQoYXJncykpO1xuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3YXJuaW5nOyIsIi8qXG5vYmplY3QtYXNzaWduXG4oYykgU2luZHJlIFNvcmh1c1xuQGxpY2Vuc2UgTUlUXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGdldE93blByb3BlcnR5U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHByaW50V2FybmluZyA9IGZ1bmN0aW9uKCkge307XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZhciBSZWFjdFByb3BUeXBlc1NlY3JldCA9IHJlcXVpcmUoJy4vbGliL1JlYWN0UHJvcFR5cGVzU2VjcmV0Jyk7XG4gIHZhciBsb2dnZWRUeXBlRmFpbHVyZXMgPSB7fTtcblxuICBwcmludFdhcm5pbmcgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgdmFyIG1lc3NhZ2UgPSAnV2FybmluZzogJyArIHRleHQ7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIC8vIC0tLSBXZWxjb21lIHRvIGRlYnVnZ2luZyBSZWFjdCAtLS1cbiAgICAgIC8vIFRoaXMgZXJyb3Igd2FzIHRocm93biBhcyBhIGNvbnZlbmllbmNlIHNvIHRoYXQgeW91IGNhbiB1c2UgdGhpcyBzdGFja1xuICAgICAgLy8gdG8gZmluZCB0aGUgY2FsbHNpdGUgdGhhdCBjYXVzZWQgdGhpcyB3YXJuaW5nIHRvIGZpcmUuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfSBjYXRjaCAoeCkge31cbiAgfTtcbn1cblxuLyoqXG4gKiBBc3NlcnQgdGhhdCB0aGUgdmFsdWVzIG1hdGNoIHdpdGggdGhlIHR5cGUgc3BlY3MuXG4gKiBFcnJvciBtZXNzYWdlcyBhcmUgbWVtb3JpemVkIGFuZCB3aWxsIG9ubHkgYmUgc2hvd24gb25jZS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gdHlwZVNwZWNzIE1hcCBvZiBuYW1lIHRvIGEgUmVhY3RQcm9wVHlwZVxuICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyBSdW50aW1lIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgdHlwZS1jaGVja2VkXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYXRpb24gZS5nLiBcInByb3BcIiwgXCJjb250ZXh0XCIsIFwiY2hpbGQgY29udGV4dFwiXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tcG9uZW50TmFtZSBOYW1lIG9mIHRoZSBjb21wb25lbnQgZm9yIGVycm9yIG1lc3NhZ2VzLlxuICogQHBhcmFtIHs/RnVuY3Rpb259IGdldFN0YWNrIFJldHVybnMgdGhlIGNvbXBvbmVudCBzdGFjay5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNoZWNrUHJvcFR5cGVzKHR5cGVTcGVjcywgdmFsdWVzLCBsb2NhdGlvbiwgY29tcG9uZW50TmFtZSwgZ2V0U3RhY2spIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBmb3IgKHZhciB0eXBlU3BlY05hbWUgaW4gdHlwZVNwZWNzKSB7XG4gICAgICBpZiAodHlwZVNwZWNzLmhhc093blByb3BlcnR5KHR5cGVTcGVjTmFtZSkpIHtcbiAgICAgICAgdmFyIGVycm9yO1xuICAgICAgICAvLyBQcm9wIHR5cGUgdmFsaWRhdGlvbiBtYXkgdGhyb3cuIEluIGNhc2UgdGhleSBkbywgd2UgZG9uJ3Qgd2FudCB0b1xuICAgICAgICAvLyBmYWlsIHRoZSByZW5kZXIgcGhhc2Ugd2hlcmUgaXQgZGlkbid0IGZhaWwgYmVmb3JlLiBTbyB3ZSBsb2cgaXQuXG4gICAgICAgIC8vIEFmdGVyIHRoZXNlIGhhdmUgYmVlbiBjbGVhbmVkIHVwLCB3ZSdsbCBsZXQgdGhlbSB0aHJvdy5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGludGVudGlvbmFsbHkgYW4gaW52YXJpYW50IHRoYXQgZ2V0cyBjYXVnaHQuIEl0J3MgdGhlIHNhbWVcbiAgICAgICAgICAvLyBiZWhhdmlvciBhcyB3aXRob3V0IHRoaXMgc3RhdGVtZW50IGV4Y2VwdCB3aXRoIGEgYmV0dGVyIG1lc3NhZ2UuXG4gICAgICAgICAgaWYgKHR5cGVvZiB0eXBlU3BlY3NbdHlwZVNwZWNOYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIGVyciA9IEVycm9yKFxuICAgICAgICAgICAgICAoY29tcG9uZW50TmFtZSB8fCAnUmVhY3QgY2xhc3MnKSArICc6ICcgKyBsb2NhdGlvbiArICcgdHlwZSBgJyArIHR5cGVTcGVjTmFtZSArICdgIGlzIGludmFsaWQ7ICcgK1xuICAgICAgICAgICAgICAnaXQgbXVzdCBiZSBhIGZ1bmN0aW9uLCB1c3VhbGx5IGZyb20gdGhlIGBwcm9wLXR5cGVzYCBwYWNrYWdlLCBidXQgcmVjZWl2ZWQgYCcgKyB0eXBlb2YgdHlwZVNwZWNzW3R5cGVTcGVjTmFtZV0gKyAnYC4nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgZXJyLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVycm9yID0gdHlwZVNwZWNzW3R5cGVTcGVjTmFtZV0odmFsdWVzLCB0eXBlU3BlY05hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBudWxsLCBSZWFjdFByb3BUeXBlc1NlY3JldCk7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgZXJyb3IgPSBleDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXJyb3IgJiYgIShlcnJvciBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgICAgIHByaW50V2FybmluZyhcbiAgICAgICAgICAgIChjb21wb25lbnROYW1lIHx8ICdSZWFjdCBjbGFzcycpICsgJzogdHlwZSBzcGVjaWZpY2F0aW9uIG9mICcgK1xuICAgICAgICAgICAgbG9jYXRpb24gKyAnIGAnICsgdHlwZVNwZWNOYW1lICsgJ2AgaXMgaW52YWxpZDsgdGhlIHR5cGUgY2hlY2tlciAnICtcbiAgICAgICAgICAgICdmdW5jdGlvbiBtdXN0IHJldHVybiBgbnVsbGAgb3IgYW4gYEVycm9yYCBidXQgcmV0dXJuZWQgYSAnICsgdHlwZW9mIGVycm9yICsgJy4gJyArXG4gICAgICAgICAgICAnWW91IG1heSBoYXZlIGZvcmdvdHRlbiB0byBwYXNzIGFuIGFyZ3VtZW50IHRvIHRoZSB0eXBlIGNoZWNrZXIgJyArXG4gICAgICAgICAgICAnY3JlYXRvciAoYXJyYXlPZiwgaW5zdGFuY2VPZiwgb2JqZWN0T2YsIG9uZU9mLCBvbmVPZlR5cGUsIGFuZCAnICtcbiAgICAgICAgICAgICdzaGFwZSBhbGwgcmVxdWlyZSBhbiBhcmd1bWVudCkuJ1xuICAgICAgICAgIClcblxuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmICEoZXJyb3IubWVzc2FnZSBpbiBsb2dnZWRUeXBlRmFpbHVyZXMpKSB7XG4gICAgICAgICAgLy8gT25seSBtb25pdG9yIHRoaXMgZmFpbHVyZSBvbmNlIGJlY2F1c2UgdGhlcmUgdGVuZHMgdG8gYmUgYSBsb3Qgb2YgdGhlXG4gICAgICAgICAgLy8gc2FtZSBlcnJvci5cbiAgICAgICAgICBsb2dnZWRUeXBlRmFpbHVyZXNbZXJyb3IubWVzc2FnZV0gPSB0cnVlO1xuXG4gICAgICAgICAgdmFyIHN0YWNrID0gZ2V0U3RhY2sgPyBnZXRTdGFjaygpIDogJyc7XG5cbiAgICAgICAgICBwcmludFdhcm5pbmcoXG4gICAgICAgICAgICAnRmFpbGVkICcgKyBsb2NhdGlvbiArICcgdHlwZTogJyArIGVycm9yLm1lc3NhZ2UgKyAoc3RhY2sgIT0gbnVsbCA/IHN0YWNrIDogJycpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNoZWNrUHJvcFR5cGVzO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFJlYWN0IDE1LjUgcmVmZXJlbmNlcyB0aGlzIG1vZHVsZSwgYW5kIGFzc3VtZXMgUHJvcFR5cGVzIGFyZSBzdGlsbCBjYWxsYWJsZSBpbiBwcm9kdWN0aW9uLlxuLy8gVGhlcmVmb3JlIHdlIHJlLWV4cG9ydCBkZXZlbG9wbWVudC1vbmx5IHZlcnNpb24gd2l0aCBhbGwgdGhlIFByb3BUeXBlcyBjaGVja3MgaGVyZS5cbi8vIEhvd2V2ZXIgaWYgb25lIGlzIG1pZ3JhdGluZyB0byB0aGUgYHByb3AtdHlwZXNgIG5wbSBsaWJyYXJ5LCB0aGV5IHdpbGwgZ28gdGhyb3VnaCB0aGVcbi8vIGBpbmRleC5qc2AgZW50cnkgcG9pbnQsIGFuZCBpdCB3aWxsIGJyYW5jaCBkZXBlbmRpbmcgb24gdGhlIGVudmlyb25tZW50LlxudmFyIGZhY3RvcnkgPSByZXF1aXJlKCcuL2ZhY3RvcnlXaXRoVHlwZUNoZWNrZXJzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlzVmFsaWRFbGVtZW50KSB7XG4gIC8vIEl0IGlzIHN0aWxsIGFsbG93ZWQgaW4gMTUuNS5cbiAgdmFyIHRocm93T25EaXJlY3RBY2Nlc3MgPSBmYWxzZTtcbiAgcmV0dXJuIGZhY3RvcnkoaXNWYWxpZEVsZW1lbnQsIHRocm93T25EaXJlY3RBY2Nlc3MpO1xufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgUmVhY3RQcm9wVHlwZXNTZWNyZXQgPSByZXF1aXJlKCcuL2xpYi9SZWFjdFByb3BUeXBlc1NlY3JldCcpO1xudmFyIGNoZWNrUHJvcFR5cGVzID0gcmVxdWlyZSgnLi9jaGVja1Byb3BUeXBlcycpO1xuXG52YXIgcHJpbnRXYXJuaW5nID0gZnVuY3Rpb24oKSB7fTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgcHJpbnRXYXJuaW5nID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBtZXNzYWdlID0gJ1dhcm5pbmc6ICcgKyB0ZXh0O1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAvLyAtLS0gV2VsY29tZSB0byBkZWJ1Z2dpbmcgUmVhY3QgLS0tXG4gICAgICAvLyBUaGlzIGVycm9yIHdhcyB0aHJvd24gYXMgYSBjb252ZW5pZW5jZSBzbyB0aGF0IHlvdSBjYW4gdXNlIHRoaXMgc3RhY2tcbiAgICAgIC8vIHRvIGZpbmQgdGhlIGNhbGxzaXRlIHRoYXQgY2F1c2VkIHRoaXMgd2FybmluZyB0byBmaXJlLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH0gY2F0Y2ggKHgpIHt9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGVtcHR5RnVuY3Rpb25UaGF0UmV0dXJuc051bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlzVmFsaWRFbGVtZW50LCB0aHJvd09uRGlyZWN0QWNjZXNzKSB7XG4gIC8qIGdsb2JhbCBTeW1ib2wgKi9cbiAgdmFyIElURVJBVE9SX1NZTUJPTCA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgU3ltYm9sLml0ZXJhdG9yO1xuICB2YXIgRkFVWF9JVEVSQVRPUl9TWU1CT0wgPSAnQEBpdGVyYXRvcic7IC8vIEJlZm9yZSBTeW1ib2wgc3BlYy5cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaXRlcmF0b3IgbWV0aG9kIGZ1bmN0aW9uIGNvbnRhaW5lZCBvbiB0aGUgaXRlcmFibGUgb2JqZWN0LlxuICAgKlxuICAgKiBCZSBzdXJlIHRvIGludm9rZSB0aGUgZnVuY3Rpb24gd2l0aCB0aGUgaXRlcmFibGUgYXMgY29udGV4dDpcbiAgICpcbiAgICogICAgIHZhciBpdGVyYXRvckZuID0gZ2V0SXRlcmF0b3JGbihteUl0ZXJhYmxlKTtcbiAgICogICAgIGlmIChpdGVyYXRvckZuKSB7XG4gICAqICAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhdG9yRm4uY2FsbChteUl0ZXJhYmxlKTtcbiAgICogICAgICAgLi4uXG4gICAqICAgICB9XG4gICAqXG4gICAqIEBwYXJhbSB7P29iamVjdH0gbWF5YmVJdGVyYWJsZVxuICAgKiBAcmV0dXJuIHs/ZnVuY3Rpb259XG4gICAqL1xuICBmdW5jdGlvbiBnZXRJdGVyYXRvckZuKG1heWJlSXRlcmFibGUpIHtcbiAgICB2YXIgaXRlcmF0b3JGbiA9IG1heWJlSXRlcmFibGUgJiYgKElURVJBVE9SX1NZTUJPTCAmJiBtYXliZUl0ZXJhYmxlW0lURVJBVE9SX1NZTUJPTF0gfHwgbWF5YmVJdGVyYWJsZVtGQVVYX0lURVJBVE9SX1NZTUJPTF0pO1xuICAgIGlmICh0eXBlb2YgaXRlcmF0b3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGl0ZXJhdG9yRm47XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3Rpb24gb2YgbWV0aG9kcyB0aGF0IGFsbG93IGRlY2xhcmF0aW9uIGFuZCB2YWxpZGF0aW9uIG9mIHByb3BzIHRoYXQgYXJlXG4gICAqIHN1cHBsaWVkIHRvIFJlYWN0IGNvbXBvbmVudHMuIEV4YW1wbGUgdXNhZ2U6XG4gICAqXG4gICAqICAgdmFyIFByb3BzID0gcmVxdWlyZSgnUmVhY3RQcm9wVHlwZXMnKTtcbiAgICogICB2YXIgTXlBcnRpY2xlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgKiAgICAgcHJvcFR5cGVzOiB7XG4gICAqICAgICAgIC8vIEFuIG9wdGlvbmFsIHN0cmluZyBwcm9wIG5hbWVkIFwiZGVzY3JpcHRpb25cIi5cbiAgICogICAgICAgZGVzY3JpcHRpb246IFByb3BzLnN0cmluZyxcbiAgICpcbiAgICogICAgICAgLy8gQSByZXF1aXJlZCBlbnVtIHByb3AgbmFtZWQgXCJjYXRlZ29yeVwiLlxuICAgKiAgICAgICBjYXRlZ29yeTogUHJvcHMub25lT2YoWydOZXdzJywnUGhvdG9zJ10pLmlzUmVxdWlyZWQsXG4gICAqXG4gICAqICAgICAgIC8vIEEgcHJvcCBuYW1lZCBcImRpYWxvZ1wiIHRoYXQgcmVxdWlyZXMgYW4gaW5zdGFuY2Ugb2YgRGlhbG9nLlxuICAgKiAgICAgICBkaWFsb2c6IFByb3BzLmluc3RhbmNlT2YoRGlhbG9nKS5pc1JlcXVpcmVkXG4gICAqICAgICB9LFxuICAgKiAgICAgcmVuZGVyOiBmdW5jdGlvbigpIHsgLi4uIH1cbiAgICogICB9KTtcbiAgICpcbiAgICogQSBtb3JlIGZvcm1hbCBzcGVjaWZpY2F0aW9uIG9mIGhvdyB0aGVzZSBtZXRob2RzIGFyZSB1c2VkOlxuICAgKlxuICAgKiAgIHR5cGUgOj0gYXJyYXl8Ym9vbHxmdW5jfG9iamVjdHxudW1iZXJ8c3RyaW5nfG9uZU9mKFsuLi5dKXxpbnN0YW5jZU9mKC4uLilcbiAgICogICBkZWNsIDo9IFJlYWN0UHJvcFR5cGVzLnt0eXBlfSguaXNSZXF1aXJlZCk/XG4gICAqXG4gICAqIEVhY2ggYW5kIGV2ZXJ5IGRlY2xhcmF0aW9uIHByb2R1Y2VzIGEgZnVuY3Rpb24gd2l0aCB0aGUgc2FtZSBzaWduYXR1cmUuIFRoaXNcbiAgICogYWxsb3dzIHRoZSBjcmVhdGlvbiBvZiBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbnMuIEZvciBleGFtcGxlOlxuICAgKlxuICAgKiAgdmFyIE15TGluayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICogICAgcHJvcFR5cGVzOiB7XG4gICAqICAgICAgLy8gQW4gb3B0aW9uYWwgc3RyaW5nIG9yIFVSSSBwcm9wIG5hbWVkIFwiaHJlZlwiLlxuICAgKiAgICAgIGhyZWY6IGZ1bmN0aW9uKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSkge1xuICAgKiAgICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICogICAgICAgIGlmIChwcm9wVmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgcHJvcFZhbHVlICE9PSAnc3RyaW5nJyAmJlxuICAgKiAgICAgICAgICAgICEocHJvcFZhbHVlIGluc3RhbmNlb2YgVVJJKSkge1xuICAgKiAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFxuICAgKiAgICAgICAgICAgICdFeHBlY3RlZCBhIHN0cmluZyBvciBhbiBVUkkgZm9yICcgKyBwcm9wTmFtZSArICcgaW4gJyArXG4gICAqICAgICAgICAgICAgY29tcG9uZW50TmFtZVxuICAgKiAgICAgICAgICApO1xuICAgKiAgICAgICAgfVxuICAgKiAgICAgIH1cbiAgICogICAgfSxcbiAgICogICAgcmVuZGVyOiBmdW5jdGlvbigpIHsuLi59XG4gICAqICB9KTtcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuXG4gIHZhciBBTk9OWU1PVVMgPSAnPDxhbm9ueW1vdXM+Pic7XG5cbiAgLy8gSW1wb3J0YW50IVxuICAvLyBLZWVwIHRoaXMgbGlzdCBpbiBzeW5jIHdpdGggcHJvZHVjdGlvbiB2ZXJzaW9uIGluIGAuL2ZhY3RvcnlXaXRoVGhyb3dpbmdTaGltcy5qc2AuXG4gIHZhciBSZWFjdFByb3BUeXBlcyA9IHtcbiAgICBhcnJheTogY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoJ2FycmF5JyksXG4gICAgYm9vbDogY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoJ2Jvb2xlYW4nKSxcbiAgICBmdW5jOiBjcmVhdGVQcmltaXRpdmVUeXBlQ2hlY2tlcignZnVuY3Rpb24nKSxcbiAgICBudW1iZXI6IGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyKCdudW1iZXInKSxcbiAgICBvYmplY3Q6IGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyKCdvYmplY3QnKSxcbiAgICBzdHJpbmc6IGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyKCdzdHJpbmcnKSxcbiAgICBzeW1ib2w6IGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyKCdzeW1ib2wnKSxcblxuICAgIGFueTogY3JlYXRlQW55VHlwZUNoZWNrZXIoKSxcbiAgICBhcnJheU9mOiBjcmVhdGVBcnJheU9mVHlwZUNoZWNrZXIsXG4gICAgZWxlbWVudDogY3JlYXRlRWxlbWVudFR5cGVDaGVja2VyKCksXG4gICAgaW5zdGFuY2VPZjogY3JlYXRlSW5zdGFuY2VUeXBlQ2hlY2tlcixcbiAgICBub2RlOiBjcmVhdGVOb2RlQ2hlY2tlcigpLFxuICAgIG9iamVjdE9mOiBjcmVhdGVPYmplY3RPZlR5cGVDaGVja2VyLFxuICAgIG9uZU9mOiBjcmVhdGVFbnVtVHlwZUNoZWNrZXIsXG4gICAgb25lT2ZUeXBlOiBjcmVhdGVVbmlvblR5cGVDaGVja2VyLFxuICAgIHNoYXBlOiBjcmVhdGVTaGFwZVR5cGVDaGVja2VyLFxuICAgIGV4YWN0OiBjcmVhdGVTdHJpY3RTaGFwZVR5cGVDaGVja2VyLFxuICB9O1xuXG4gIC8qKlxuICAgKiBpbmxpbmVkIE9iamVjdC5pcyBwb2x5ZmlsbCB0byBhdm9pZCByZXF1aXJpbmcgY29uc3VtZXJzIHNoaXAgdGhlaXIgb3duXG4gICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL09iamVjdC9pc1xuICAgKi9cbiAgLyplc2xpbnQtZGlzYWJsZSBuby1zZWxmLWNvbXBhcmUqL1xuICBmdW5jdGlvbiBpcyh4LCB5KSB7XG4gICAgLy8gU2FtZVZhbHVlIGFsZ29yaXRobVxuICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAvLyBTdGVwcyAxLTUsIDctMTBcbiAgICAgIC8vIFN0ZXBzIDYuYi02LmU6ICswICE9IC0wXG4gICAgICByZXR1cm4geCAhPT0gMCB8fCAxIC8geCA9PT0gMSAvIHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFN0ZXAgNi5hOiBOYU4gPT0gTmFOXG4gICAgICByZXR1cm4geCAhPT0geCAmJiB5ICE9PSB5O1xuICAgIH1cbiAgfVxuICAvKmVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlKi9cblxuICAvKipcbiAgICogV2UgdXNlIGFuIEVycm9yLWxpa2Ugb2JqZWN0IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IGFzIHBlb3BsZSBtYXkgY2FsbFxuICAgKiBQcm9wVHlwZXMgZGlyZWN0bHkgYW5kIGluc3BlY3QgdGhlaXIgb3V0cHV0LiBIb3dldmVyLCB3ZSBkb24ndCB1c2UgcmVhbFxuICAgKiBFcnJvcnMgYW55bW9yZS4gV2UgZG9uJ3QgaW5zcGVjdCB0aGVpciBzdGFjayBhbnl3YXksIGFuZCBjcmVhdGluZyB0aGVtXG4gICAqIGlzIHByb2hpYml0aXZlbHkgZXhwZW5zaXZlIGlmIHRoZXkgYXJlIGNyZWF0ZWQgdG9vIG9mdGVuLCBzdWNoIGFzIHdoYXRcbiAgICogaGFwcGVucyBpbiBvbmVPZlR5cGUoKSBmb3IgYW55IHR5cGUgYmVmb3JlIHRoZSBvbmUgdGhhdCBtYXRjaGVkLlxuICAgKi9cbiAgZnVuY3Rpb24gUHJvcFR5cGVFcnJvcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLnN0YWNrID0gJyc7XG4gIH1cbiAgLy8gTWFrZSBgaW5zdGFuY2VvZiBFcnJvcmAgc3RpbGwgd29yayBmb3IgcmV0dXJuZWQgZXJyb3JzLlxuICBQcm9wVHlwZUVycm9yLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcblxuICBmdW5jdGlvbiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSkge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICB2YXIgbWFudWFsUHJvcFR5cGVDYWxsQ2FjaGUgPSB7fTtcbiAgICAgIHZhciBtYW51YWxQcm9wVHlwZVdhcm5pbmdDb3VudCA9IDA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNoZWNrVHlwZShpc1JlcXVpcmVkLCBwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUsIHNlY3JldCkge1xuICAgICAgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudE5hbWUgfHwgQU5PTllNT1VTO1xuICAgICAgcHJvcEZ1bGxOYW1lID0gcHJvcEZ1bGxOYW1lIHx8IHByb3BOYW1lO1xuXG4gICAgICBpZiAoc2VjcmV0ICE9PSBSZWFjdFByb3BUeXBlc1NlY3JldCkge1xuICAgICAgICBpZiAodGhyb3dPbkRpcmVjdEFjY2Vzcykge1xuICAgICAgICAgIC8vIE5ldyBiZWhhdmlvciBvbmx5IGZvciB1c2VycyBvZiBgcHJvcC10eXBlc2AgcGFja2FnZVxuICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnQ2FsbGluZyBQcm9wVHlwZXMgdmFsaWRhdG9ycyBkaXJlY3RseSBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBgcHJvcC10eXBlc2AgcGFja2FnZS4gJyArXG4gICAgICAgICAgICAnVXNlIGBQcm9wVHlwZXMuY2hlY2tQcm9wVHlwZXMoKWAgdG8gY2FsbCB0aGVtLiAnICtcbiAgICAgICAgICAgICdSZWFkIG1vcmUgYXQgaHR0cDovL2ZiLm1lL3VzZS1jaGVjay1wcm9wLXR5cGVzJ1xuICAgICAgICAgICk7XG4gICAgICAgICAgZXJyLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgLy8gT2xkIGJlaGF2aW9yIGZvciBwZW9wbGUgdXNpbmcgUmVhY3QuUHJvcFR5cGVzXG4gICAgICAgICAgdmFyIGNhY2hlS2V5ID0gY29tcG9uZW50TmFtZSArICc6JyArIHByb3BOYW1lO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFtYW51YWxQcm9wVHlwZUNhbGxDYWNoZVtjYWNoZUtleV0gJiZcbiAgICAgICAgICAgIC8vIEF2b2lkIHNwYW1taW5nIHRoZSBjb25zb2xlIGJlY2F1c2UgdGhleSBhcmUgb2Z0ZW4gbm90IGFjdGlvbmFibGUgZXhjZXB0IGZvciBsaWIgYXV0aG9yc1xuICAgICAgICAgICAgbWFudWFsUHJvcFR5cGVXYXJuaW5nQ291bnQgPCAzXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBwcmludFdhcm5pbmcoXG4gICAgICAgICAgICAgICdZb3UgYXJlIG1hbnVhbGx5IGNhbGxpbmcgYSBSZWFjdC5Qcm9wVHlwZXMgdmFsaWRhdGlvbiAnICtcbiAgICAgICAgICAgICAgJ2Z1bmN0aW9uIGZvciB0aGUgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBwcm9wIG9uIGAnICsgY29tcG9uZW50TmFtZSAgKyAnYC4gVGhpcyBpcyBkZXByZWNhdGVkICcgK1xuICAgICAgICAgICAgICAnYW5kIHdpbGwgdGhyb3cgaW4gdGhlIHN0YW5kYWxvbmUgYHByb3AtdHlwZXNgIHBhY2thZ2UuICcgK1xuICAgICAgICAgICAgICAnWW91IG1heSBiZSBzZWVpbmcgdGhpcyB3YXJuaW5nIGR1ZSB0byBhIHRoaXJkLXBhcnR5IFByb3BUeXBlcyAnICtcbiAgICAgICAgICAgICAgJ2xpYnJhcnkuIFNlZSBodHRwczovL2ZiLm1lL3JlYWN0LXdhcm5pbmctZG9udC1jYWxsLXByb3B0eXBlcyAnICsgJ2ZvciBkZXRhaWxzLidcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBtYW51YWxQcm9wVHlwZUNhbGxDYWNoZVtjYWNoZUtleV0gPSB0cnVlO1xuICAgICAgICAgICAgbWFudWFsUHJvcFR5cGVXYXJuaW5nQ291bnQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChwcm9wc1twcm9wTmFtZV0gPT0gbnVsbCkge1xuICAgICAgICBpZiAoaXNSZXF1aXJlZCkge1xuICAgICAgICAgIGlmIChwcm9wc1twcm9wTmFtZV0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignVGhlICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBpcyBtYXJrZWQgYXMgcmVxdWlyZWQgJyArICgnaW4gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGJ1dCBpdHMgdmFsdWUgaXMgYG51bGxgLicpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdUaGUgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIGlzIG1hcmtlZCBhcyByZXF1aXJlZCBpbiAnICsgKCdgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgYnV0IGl0cyB2YWx1ZSBpcyBgdW5kZWZpbmVkYC4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY2hhaW5lZENoZWNrVHlwZSA9IGNoZWNrVHlwZS5iaW5kKG51bGwsIGZhbHNlKTtcbiAgICBjaGFpbmVkQ2hlY2tUeXBlLmlzUmVxdWlyZWQgPSBjaGVja1R5cGUuYmluZChudWxsLCB0cnVlKTtcblxuICAgIHJldHVybiBjaGFpbmVkQ2hlY2tUeXBlO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoZXhwZWN0ZWRUeXBlKSB7XG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lLCBzZWNyZXQpIHtcbiAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG4gICAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgICAgaWYgKHByb3BUeXBlICE9PSBleHBlY3RlZFR5cGUpIHtcbiAgICAgICAgLy8gYHByb3BWYWx1ZWAgYmVpbmcgaW5zdGFuY2Ugb2YsIHNheSwgZGF0ZS9yZWdleHAsIHBhc3MgdGhlICdvYmplY3QnXG4gICAgICAgIC8vIGNoZWNrLCBidXQgd2UgY2FuIG9mZmVyIGEgbW9yZSBwcmVjaXNlIGVycm9yIG1lc3NhZ2UgaGVyZSByYXRoZXIgdGhhblxuICAgICAgICAvLyAnb2YgdHlwZSBgb2JqZWN0YCcuXG4gICAgICAgIHZhciBwcmVjaXNlVHlwZSA9IGdldFByZWNpc2VUeXBlKHByb3BWYWx1ZSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiB0eXBlICcgKyAoJ2AnICsgcHJlY2lzZVR5cGUgKyAnYCBzdXBwbGllZCB0byBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgJykgKyAoJ2AnICsgZXhwZWN0ZWRUeXBlICsgJ2AuJykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVBbnlUeXBlQ2hlY2tlcigpIHtcbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIoZW1wdHlGdW5jdGlvblRoYXRSZXR1cm5zTnVsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVBcnJheU9mVHlwZUNoZWNrZXIodHlwZUNoZWNrZXIpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIGlmICh0eXBlb2YgdHlwZUNoZWNrZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdQcm9wZXJ0eSBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIGNvbXBvbmVudCBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCBoYXMgaW52YWxpZCBQcm9wVHlwZSBub3RhdGlvbiBpbnNpZGUgYXJyYXlPZi4nKTtcbiAgICAgIH1cbiAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvcFZhbHVlKSkge1xuICAgICAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIHR5cGUgJyArICgnYCcgKyBwcm9wVHlwZSArICdgIHN1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBhbiBhcnJheS4nKSk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZXJyb3IgPSB0eXBlQ2hlY2tlcihwcm9wVmFsdWUsIGksIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUgKyAnWycgKyBpICsgJ10nLCBSZWFjdFByb3BUeXBlc1NlY3JldCk7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZUNoYWluYWJsZVR5cGVDaGVja2VyKHZhbGlkYXRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRUeXBlQ2hlY2tlcigpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG4gICAgICBpZiAoIWlzVmFsaWRFbGVtZW50KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgdmFyIHByb3BUeXBlID0gZ2V0UHJvcFR5cGUocHJvcFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiB0eXBlICcgKyAoJ2AnICsgcHJvcFR5cGUgKyAnYCBzdXBwbGllZCB0byBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYSBzaW5nbGUgUmVhY3RFbGVtZW50LicpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2VUeXBlQ2hlY2tlcihleHBlY3RlZENsYXNzKSB7XG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKSB7XG4gICAgICBpZiAoIShwcm9wc1twcm9wTmFtZV0gaW5zdGFuY2VvZiBleHBlY3RlZENsYXNzKSkge1xuICAgICAgICB2YXIgZXhwZWN0ZWRDbGFzc05hbWUgPSBleHBlY3RlZENsYXNzLm5hbWUgfHwgQU5PTllNT1VTO1xuICAgICAgICB2YXIgYWN0dWFsQ2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKHByb3BzW3Byb3BOYW1lXSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignSW52YWxpZCAnICsgbG9jYXRpb24gKyAnIGAnICsgcHJvcEZ1bGxOYW1lICsgJ2Agb2YgdHlwZSAnICsgKCdgJyArIGFjdHVhbENsYXNzTmFtZSArICdgIHN1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCAnKSArICgnaW5zdGFuY2Ugb2YgYCcgKyBleHBlY3RlZENsYXNzTmFtZSArICdgLicpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRW51bVR5cGVDaGVja2VyKGV4cGVjdGVkVmFsdWVzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGV4cGVjdGVkVmFsdWVzKSkge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IHByaW50V2FybmluZygnSW52YWxpZCBhcmd1bWVudCBzdXBwbGllZCB0byBvbmVPZiwgZXhwZWN0ZWQgYW4gaW5zdGFuY2Ugb2YgYXJyYXkuJykgOiB2b2lkIDA7XG4gICAgICByZXR1cm4gZW1wdHlGdW5jdGlvblRoYXRSZXR1cm5zTnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4cGVjdGVkVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpcyhwcm9wVmFsdWUsIGV4cGVjdGVkVmFsdWVzW2ldKSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciB2YWx1ZXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShleHBlY3RlZFZhbHVlcyk7XG4gICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIHZhbHVlIGAnICsgcHJvcFZhbHVlICsgJ2AgJyArICgnc3VwcGxpZWQgdG8gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIG9uZSBvZiAnICsgdmFsdWVzU3RyaW5nICsgJy4nKSk7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVPYmplY3RPZlR5cGVDaGVja2VyKHR5cGVDaGVja2VyKSB7XG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKSB7XG4gICAgICBpZiAodHlwZW9mIHR5cGVDaGVja2VyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignUHJvcGVydHkgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiBjb21wb25lbnQgYCcgKyBjb21wb25lbnROYW1lICsgJ2AgaGFzIGludmFsaWQgUHJvcFR5cGUgbm90YXRpb24gaW5zaWRlIG9iamVjdE9mLicpO1xuICAgICAgfVxuICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICAgIHZhciBwcm9wVHlwZSA9IGdldFByb3BUeXBlKHByb3BWYWx1ZSk7XG4gICAgICBpZiAocHJvcFR5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignSW52YWxpZCAnICsgbG9jYXRpb24gKyAnIGAnICsgcHJvcEZ1bGxOYW1lICsgJ2Agb2YgdHlwZSAnICsgKCdgJyArIHByb3BUeXBlICsgJ2Agc3VwcGxpZWQgdG8gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIGFuIG9iamVjdC4nKSk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBrZXkgaW4gcHJvcFZhbHVlKSB7XG4gICAgICAgIGlmIChwcm9wVmFsdWUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIHZhciBlcnJvciA9IHR5cGVDaGVja2VyKHByb3BWYWx1ZSwga2V5LCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lICsgJy4nICsga2V5LCBSZWFjdFByb3BUeXBlc1NlY3JldCk7XG4gICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlVW5pb25UeXBlQ2hlY2tlcihhcnJheU9mVHlwZUNoZWNrZXJzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5T2ZUeXBlQ2hlY2tlcnMpKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gcHJpbnRXYXJuaW5nKCdJbnZhbGlkIGFyZ3VtZW50IHN1cHBsaWVkIHRvIG9uZU9mVHlwZSwgZXhwZWN0ZWQgYW4gaW5zdGFuY2Ugb2YgYXJyYXkuJykgOiB2b2lkIDA7XG4gICAgICByZXR1cm4gZW1wdHlGdW5jdGlvblRoYXRSZXR1cm5zTnVsbDtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5T2ZUeXBlQ2hlY2tlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGVja2VyID0gYXJyYXlPZlR5cGVDaGVja2Vyc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgY2hlY2tlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwcmludFdhcm5pbmcoXG4gICAgICAgICAgJ0ludmFsaWQgYXJndW1lbnQgc3VwcGxpZWQgdG8gb25lT2ZUeXBlLiBFeHBlY3RlZCBhbiBhcnJheSBvZiBjaGVjayBmdW5jdGlvbnMsIGJ1dCAnICtcbiAgICAgICAgICAncmVjZWl2ZWQgJyArIGdldFBvc3RmaXhGb3JUeXBlV2FybmluZyhjaGVja2VyKSArICcgYXQgaW5kZXggJyArIGkgKyAnLidcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGVtcHR5RnVuY3Rpb25UaGF0UmV0dXJuc051bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5T2ZUeXBlQ2hlY2tlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoZWNrZXIgPSBhcnJheU9mVHlwZUNoZWNrZXJzW2ldO1xuICAgICAgICBpZiAoY2hlY2tlcihwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUsIFJlYWN0UHJvcFR5cGVzU2VjcmV0KSA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBzdXBwbGllZCB0byAnICsgKCdgJyArIGNvbXBvbmVudE5hbWUgKyAnYC4nKSk7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVOb2RlQ2hlY2tlcigpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIGlmICghaXNOb2RlKHByb3BzW3Byb3BOYW1lXSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBzdXBwbGllZCB0byAnICsgKCdgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYSBSZWFjdE5vZGUuJykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTaGFwZVR5cGVDaGVja2VyKHNoYXBlVHlwZXMpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG4gICAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgICAgaWYgKHByb3BUeXBlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIHR5cGUgYCcgKyBwcm9wVHlwZSArICdgICcgKyAoJ3N1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBgb2JqZWN0YC4nKSk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBrZXkgaW4gc2hhcGVUeXBlcykge1xuICAgICAgICB2YXIgY2hlY2tlciA9IHNoYXBlVHlwZXNba2V5XTtcbiAgICAgICAgaWYgKCFjaGVja2VyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVycm9yID0gY2hlY2tlcihwcm9wVmFsdWUsIGtleSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSArICcuJyArIGtleSwgUmVhY3RQcm9wVHlwZXNTZWNyZXQpO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RyaWN0U2hhcGVUeXBlQ2hlY2tlcihzaGFwZVR5cGVzKSB7XG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKSB7XG4gICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgICAgdmFyIHByb3BUeXBlID0gZ2V0UHJvcFR5cGUocHJvcFZhbHVlKTtcbiAgICAgIGlmIChwcm9wVHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiB0eXBlIGAnICsgcHJvcFR5cGUgKyAnYCAnICsgKCdzdXBwbGllZCB0byBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYG9iamVjdGAuJykpO1xuICAgICAgfVxuICAgICAgLy8gV2UgbmVlZCB0byBjaGVjayBhbGwga2V5cyBpbiBjYXNlIHNvbWUgYXJlIHJlcXVpcmVkIGJ1dCBtaXNzaW5nIGZyb21cbiAgICAgIC8vIHByb3BzLlxuICAgICAgdmFyIGFsbEtleXMgPSBhc3NpZ24oe30sIHByb3BzW3Byb3BOYW1lXSwgc2hhcGVUeXBlcyk7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYWxsS2V5cykge1xuICAgICAgICB2YXIgY2hlY2tlciA9IHNoYXBlVHlwZXNba2V5XTtcbiAgICAgICAgaWYgKCFjaGVja2VyKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKFxuICAgICAgICAgICAgJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIGtleSBgJyArIGtleSArICdgIHN1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLicgK1xuICAgICAgICAgICAgJ1xcbkJhZCBvYmplY3Q6ICcgKyBKU09OLnN0cmluZ2lmeShwcm9wc1twcm9wTmFtZV0sIG51bGwsICcgICcpICtcbiAgICAgICAgICAgICdcXG5WYWxpZCBrZXlzOiAnICsgIEpTT04uc3RyaW5naWZ5KE9iamVjdC5rZXlzKHNoYXBlVHlwZXMpLCBudWxsLCAnICAnKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVycm9yID0gY2hlY2tlcihwcm9wVmFsdWUsIGtleSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSArICcuJyArIGtleSwgUmVhY3RQcm9wVHlwZXNTZWNyZXQpO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc05vZGUocHJvcFZhbHVlKSB7XG4gICAgc3dpdGNoICh0eXBlb2YgcHJvcFZhbHVlKSB7XG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiAhcHJvcFZhbHVlO1xuICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvcFZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBwcm9wVmFsdWUuZXZlcnkoaXNOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvcFZhbHVlID09PSBudWxsIHx8IGlzVmFsaWRFbGVtZW50KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpdGVyYXRvckZuID0gZ2V0SXRlcmF0b3JGbihwcm9wVmFsdWUpO1xuICAgICAgICBpZiAoaXRlcmF0b3JGbikge1xuICAgICAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhdG9yRm4uY2FsbChwcm9wVmFsdWUpO1xuICAgICAgICAgIHZhciBzdGVwO1xuICAgICAgICAgIGlmIChpdGVyYXRvckZuICE9PSBwcm9wVmFsdWUuZW50cmllcykge1xuICAgICAgICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICAgICAgICBpZiAoIWlzTm9kZShzdGVwLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJdGVyYXRvciB3aWxsIHByb3ZpZGUgZW50cnkgW2ssdl0gdHVwbGVzIHJhdGhlciB0aGFuIHZhbHVlcy5cbiAgICAgICAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc05vZGUoZW50cnlbMV0pKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzU3ltYm9sKHByb3BUeXBlLCBwcm9wVmFsdWUpIHtcbiAgICAvLyBOYXRpdmUgU3ltYm9sLlxuICAgIGlmIChwcm9wVHlwZSA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIDE5LjQuMy41IFN5bWJvbC5wcm90b3R5cGVbQEB0b1N0cmluZ1RhZ10gPT09ICdTeW1ib2wnXG4gICAgaWYgKHByb3BWYWx1ZVsnQEB0b1N0cmluZ1RhZyddID09PSAnU3ltYm9sJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgZm9yIG5vbi1zcGVjIGNvbXBsaWFudCBTeW1ib2xzIHdoaWNoIGFyZSBwb2x5ZmlsbGVkLlxuICAgIGlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHByb3BWYWx1ZSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRXF1aXZhbGVudCBvZiBgdHlwZW9mYCBidXQgd2l0aCBzcGVjaWFsIGhhbmRsaW5nIGZvciBhcnJheSBhbmQgcmVnZXhwLlxuICBmdW5jdGlvbiBnZXRQcm9wVHlwZShwcm9wVmFsdWUpIHtcbiAgICB2YXIgcHJvcFR5cGUgPSB0eXBlb2YgcHJvcFZhbHVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByb3BWYWx1ZSkpIHtcbiAgICAgIHJldHVybiAnYXJyYXknO1xuICAgIH1cbiAgICBpZiAocHJvcFZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAvLyBPbGQgd2Via2l0cyAoYXQgbGVhc3QgdW50aWwgQW5kcm9pZCA0LjApIHJldHVybiAnZnVuY3Rpb24nIHJhdGhlciB0aGFuXG4gICAgICAvLyAnb2JqZWN0JyBmb3IgdHlwZW9mIGEgUmVnRXhwLiBXZSdsbCBub3JtYWxpemUgdGhpcyBoZXJlIHNvIHRoYXQgL2JsYS9cbiAgICAgIC8vIHBhc3NlcyBQcm9wVHlwZXMub2JqZWN0LlxuICAgICAgcmV0dXJuICdvYmplY3QnO1xuICAgIH1cbiAgICBpZiAoaXNTeW1ib2wocHJvcFR5cGUsIHByb3BWYWx1ZSkpIHtcbiAgICAgIHJldHVybiAnc3ltYm9sJztcbiAgICB9XG4gICAgcmV0dXJuIHByb3BUeXBlO1xuICB9XG5cbiAgLy8gVGhpcyBoYW5kbGVzIG1vcmUgdHlwZXMgdGhhbiBgZ2V0UHJvcFR5cGVgLiBPbmx5IHVzZWQgZm9yIGVycm9yIG1lc3NhZ2VzLlxuICAvLyBTZWUgYGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyYC5cbiAgZnVuY3Rpb24gZ2V0UHJlY2lzZVR5cGUocHJvcFZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBwcm9wVmFsdWUgPT09ICd1bmRlZmluZWQnIHx8IHByb3BWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuICcnICsgcHJvcFZhbHVlO1xuICAgIH1cbiAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgIGlmIChwcm9wVHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmIChwcm9wVmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIHJldHVybiAnZGF0ZSc7XG4gICAgICB9IGVsc2UgaWYgKHByb3BWYWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICByZXR1cm4gJ3JlZ2V4cCc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm9wVHlwZTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBzdHJpbmcgdGhhdCBpcyBwb3N0Zml4ZWQgdG8gYSB3YXJuaW5nIGFib3V0IGFuIGludmFsaWQgdHlwZS5cbiAgLy8gRm9yIGV4YW1wbGUsIFwidW5kZWZpbmVkXCIgb3IgXCJvZiB0eXBlIGFycmF5XCJcbiAgZnVuY3Rpb24gZ2V0UG9zdGZpeEZvclR5cGVXYXJuaW5nKHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSBnZXRQcmVjaXNlVHlwZSh2YWx1ZSk7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdhcnJheSc6XG4gICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICByZXR1cm4gJ2FuICcgKyB0eXBlO1xuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgIGNhc2UgJ3JlZ2V4cCc6XG4gICAgICAgIHJldHVybiAnYSAnICsgdHlwZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgY2xhc3MgbmFtZSBvZiB0aGUgb2JqZWN0LCBpZiBhbnkuXG4gIGZ1bmN0aW9uIGdldENsYXNzTmFtZShwcm9wVmFsdWUpIHtcbiAgICBpZiAoIXByb3BWYWx1ZS5jb25zdHJ1Y3RvciB8fCAhcHJvcFZhbHVlLmNvbnN0cnVjdG9yLm5hbWUpIHtcbiAgICAgIHJldHVybiBBTk9OWU1PVVM7XG4gICAgfVxuICAgIHJldHVybiBwcm9wVmFsdWUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuXG4gIFJlYWN0UHJvcFR5cGVzLmNoZWNrUHJvcFR5cGVzID0gY2hlY2tQcm9wVHlwZXM7XG4gIFJlYWN0UHJvcFR5cGVzLlByb3BUeXBlcyA9IFJlYWN0UHJvcFR5cGVzO1xuXG4gIHJldHVybiBSZWFjdFByb3BUeXBlcztcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0UHJvcFR5cGVzU2VjcmV0ID0gJ1NFQ1JFVF9ET19OT1RfUEFTU19USElTX09SX1lPVV9XSUxMX0JFX0ZJUkVEJztcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFByb3BUeXBlc1NlY3JldDtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEVzY2FwZSBhbmQgd3JhcCBrZXkgc28gaXQgaXMgc2FmZSB0byB1c2UgYXMgYSByZWFjdGlkXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0byBiZSBlc2NhcGVkLlxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgZXNjYXBlZCBrZXkuXG4gKi9cblxuZnVuY3Rpb24gZXNjYXBlKGtleSkge1xuICB2YXIgZXNjYXBlUmVnZXggPSAvWz06XS9nO1xuICB2YXIgZXNjYXBlckxvb2t1cCA9IHtcbiAgICAnPSc6ICc9MCcsXG4gICAgJzonOiAnPTInXG4gIH07XG4gIHZhciBlc2NhcGVkU3RyaW5nID0gKCcnICsga2V5KS5yZXBsYWNlKGVzY2FwZVJlZ2V4LCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICByZXR1cm4gZXNjYXBlckxvb2t1cFttYXRjaF07XG4gIH0pO1xuXG4gIHJldHVybiAnJCcgKyBlc2NhcGVkU3RyaW5nO1xufVxuXG4vKipcbiAqIFVuZXNjYXBlIGFuZCB1bndyYXAga2V5IGZvciBodW1hbi1yZWFkYWJsZSBkaXNwbGF5XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0byB1bmVzY2FwZS5cbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIHVuZXNjYXBlZCBrZXkuXG4gKi9cbmZ1bmN0aW9uIHVuZXNjYXBlKGtleSkge1xuICB2YXIgdW5lc2NhcGVSZWdleCA9IC8oPTB8PTIpL2c7XG4gIHZhciB1bmVzY2FwZXJMb29rdXAgPSB7XG4gICAgJz0wJzogJz0nLFxuICAgICc9Mic6ICc6J1xuICB9O1xuICB2YXIga2V5U3Vic3RyaW5nID0ga2V5WzBdID09PSAnLicgJiYga2V5WzFdID09PSAnJCcgPyBrZXkuc3Vic3RyaW5nKDIpIDoga2V5LnN1YnN0cmluZygxKTtcblxuICByZXR1cm4gKCcnICsga2V5U3Vic3RyaW5nKS5yZXBsYWNlKHVuZXNjYXBlUmVnZXgsIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgIHJldHVybiB1bmVzY2FwZXJMb29rdXBbbWF0Y2hdO1xuICB9KTtcbn1cblxudmFyIEtleUVzY2FwZVV0aWxzID0ge1xuICBlc2NhcGU6IGVzY2FwZSxcbiAgdW5lc2NhcGU6IHVuZXNjYXBlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtleUVzY2FwZVV0aWxzOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3Byb2RJbnZhcmlhbnQgPSByZXF1aXJlKCcuL3JlYWN0UHJvZEludmFyaWFudCcpO1xuXG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnZmJqcy9saWIvaW52YXJpYW50Jyk7XG5cbi8qKlxuICogU3RhdGljIHBvb2xlcnMuIFNldmVyYWwgY3VzdG9tIHZlcnNpb25zIGZvciBlYWNoIHBvdGVudGlhbCBudW1iZXIgb2ZcbiAqIGFyZ3VtZW50cy4gQSBjb21wbGV0ZWx5IGdlbmVyaWMgcG9vbGVyIGlzIGVhc3kgdG8gaW1wbGVtZW50LCBidXQgd291bGRcbiAqIHJlcXVpcmUgYWNjZXNzaW5nIHRoZSBgYXJndW1lbnRzYCBvYmplY3QuIEluIGVhY2ggb2YgdGhlc2UsIGB0aGlzYCByZWZlcnMgdG9cbiAqIHRoZSBDbGFzcyBpdHNlbGYsIG5vdCBhbiBpbnN0YW5jZS4gSWYgYW55IG90aGVycyBhcmUgbmVlZGVkLCBzaW1wbHkgYWRkIHRoZW1cbiAqIGhlcmUsIG9yIGluIHRoZWlyIG93biBmaWxlcy5cbiAqL1xudmFyIG9uZUFyZ3VtZW50UG9vbGVyID0gZnVuY3Rpb24gKGNvcHlGaWVsZHNGcm9tKSB7XG4gIHZhciBLbGFzcyA9IHRoaXM7XG4gIGlmIChLbGFzcy5pbnN0YW5jZVBvb2wubGVuZ3RoKSB7XG4gICAgdmFyIGluc3RhbmNlID0gS2xhc3MuaW5zdGFuY2VQb29sLnBvcCgpO1xuICAgIEtsYXNzLmNhbGwoaW5zdGFuY2UsIGNvcHlGaWVsZHNGcm9tKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBLbGFzcyhjb3B5RmllbGRzRnJvbSk7XG4gIH1cbn07XG5cbnZhciB0d29Bcmd1bWVudFBvb2xlciA9IGZ1bmN0aW9uIChhMSwgYTIpIHtcbiAgdmFyIEtsYXNzID0gdGhpcztcbiAgaWYgKEtsYXNzLmluc3RhbmNlUG9vbC5sZW5ndGgpIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBLbGFzcy5pbnN0YW5jZVBvb2wucG9wKCk7XG4gICAgS2xhc3MuY2FsbChpbnN0YW5jZSwgYTEsIGEyKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBLbGFzcyhhMSwgYTIpO1xuICB9XG59O1xuXG52YXIgdGhyZWVBcmd1bWVudFBvb2xlciA9IGZ1bmN0aW9uIChhMSwgYTIsIGEzKSB7XG4gIHZhciBLbGFzcyA9IHRoaXM7XG4gIGlmIChLbGFzcy5pbnN0YW5jZVBvb2wubGVuZ3RoKSB7XG4gICAgdmFyIGluc3RhbmNlID0gS2xhc3MuaW5zdGFuY2VQb29sLnBvcCgpO1xuICAgIEtsYXNzLmNhbGwoaW5zdGFuY2UsIGExLCBhMiwgYTMpO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IEtsYXNzKGExLCBhMiwgYTMpO1xuICB9XG59O1xuXG52YXIgZm91ckFyZ3VtZW50UG9vbGVyID0gZnVuY3Rpb24gKGExLCBhMiwgYTMsIGE0KSB7XG4gIHZhciBLbGFzcyA9IHRoaXM7XG4gIGlmIChLbGFzcy5pbnN0YW5jZVBvb2wubGVuZ3RoKSB7XG4gICAgdmFyIGluc3RhbmNlID0gS2xhc3MuaW5zdGFuY2VQb29sLnBvcCgpO1xuICAgIEtsYXNzLmNhbGwoaW5zdGFuY2UsIGExLCBhMiwgYTMsIGE0KTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBLbGFzcyhhMSwgYTIsIGEzLCBhNCk7XG4gIH1cbn07XG5cbnZhciBzdGFuZGFyZFJlbGVhc2VyID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gIHZhciBLbGFzcyA9IHRoaXM7XG4gICEoaW5zdGFuY2UgaW5zdGFuY2VvZiBLbGFzcykgPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnVHJ5aW5nIHRvIHJlbGVhc2UgYW4gaW5zdGFuY2UgaW50byBhIHBvb2wgb2YgYSBkaWZmZXJlbnQgdHlwZS4nKSA6IF9wcm9kSW52YXJpYW50KCcyNScpIDogdm9pZCAwO1xuICBpbnN0YW5jZS5kZXN0cnVjdG9yKCk7XG4gIGlmIChLbGFzcy5pbnN0YW5jZVBvb2wubGVuZ3RoIDwgS2xhc3MucG9vbFNpemUpIHtcbiAgICBLbGFzcy5pbnN0YW5jZVBvb2wucHVzaChpbnN0YW5jZSk7XG4gIH1cbn07XG5cbnZhciBERUZBVUxUX1BPT0xfU0laRSA9IDEwO1xudmFyIERFRkFVTFRfUE9PTEVSID0gb25lQXJndW1lbnRQb29sZXI7XG5cbi8qKlxuICogQXVnbWVudHMgYENvcHlDb25zdHJ1Y3RvcmAgdG8gYmUgYSBwb29sYWJsZSBjbGFzcywgYXVnbWVudGluZyBvbmx5IHRoZSBjbGFzc1xuICogaXRzZWxmIChzdGF0aWNhbGx5KSBub3QgYWRkaW5nIGFueSBwcm90b3R5cGljYWwgZmllbGRzLiBBbnkgQ29weUNvbnN0cnVjdG9yXG4gKiB5b3UgZ2l2ZSB0aGlzIG1heSBoYXZlIGEgYHBvb2xTaXplYCBwcm9wZXJ0eSwgYW5kIHdpbGwgbG9vayBmb3IgYVxuICogcHJvdG90eXBpY2FsIGBkZXN0cnVjdG9yYCBvbiBpbnN0YW5jZXMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gQ29weUNvbnN0cnVjdG9yIENvbnN0cnVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVzZXQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwb29sZXIgQ3VzdG9taXphYmxlIHBvb2xlci5cbiAqL1xudmFyIGFkZFBvb2xpbmdUbyA9IGZ1bmN0aW9uIChDb3B5Q29uc3RydWN0b3IsIHBvb2xlcikge1xuICAvLyBDYXN0aW5nIGFzIGFueSBzbyB0aGF0IGZsb3cgaWdub3JlcyB0aGUgYWN0dWFsIGltcGxlbWVudGF0aW9uIGFuZCB0cnVzdHNcbiAgLy8gaXQgdG8gbWF0Y2ggdGhlIHR5cGUgd2UgZGVjbGFyZWRcbiAgdmFyIE5ld0tsYXNzID0gQ29weUNvbnN0cnVjdG9yO1xuICBOZXdLbGFzcy5pbnN0YW5jZVBvb2wgPSBbXTtcbiAgTmV3S2xhc3MuZ2V0UG9vbGVkID0gcG9vbGVyIHx8IERFRkFVTFRfUE9PTEVSO1xuICBpZiAoIU5ld0tsYXNzLnBvb2xTaXplKSB7XG4gICAgTmV3S2xhc3MucG9vbFNpemUgPSBERUZBVUxUX1BPT0xfU0laRTtcbiAgfVxuICBOZXdLbGFzcy5yZWxlYXNlID0gc3RhbmRhcmRSZWxlYXNlcjtcbiAgcmV0dXJuIE5ld0tsYXNzO1xufTtcblxudmFyIFBvb2xlZENsYXNzID0ge1xuICBhZGRQb29saW5nVG86IGFkZFBvb2xpbmdUbyxcbiAgb25lQXJndW1lbnRQb29sZXI6IG9uZUFyZ3VtZW50UG9vbGVyLFxuICB0d29Bcmd1bWVudFBvb2xlcjogdHdvQXJndW1lbnRQb29sZXIsXG4gIHRocmVlQXJndW1lbnRQb29sZXI6IHRocmVlQXJndW1lbnRQb29sZXIsXG4gIGZvdXJBcmd1bWVudFBvb2xlcjogZm91ckFyZ3VtZW50UG9vbGVyXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2xlZENsYXNzOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9hc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBSZWFjdEJhc2VDbGFzc2VzID0gcmVxdWlyZSgnLi9SZWFjdEJhc2VDbGFzc2VzJyk7XG52YXIgUmVhY3RDaGlsZHJlbiA9IHJlcXVpcmUoJy4vUmVhY3RDaGlsZHJlbicpO1xudmFyIFJlYWN0RE9NRmFjdG9yaWVzID0gcmVxdWlyZSgnLi9SZWFjdERPTUZhY3RvcmllcycpO1xudmFyIFJlYWN0RWxlbWVudCA9IHJlcXVpcmUoJy4vUmVhY3RFbGVtZW50Jyk7XG52YXIgUmVhY3RQcm9wVHlwZXMgPSByZXF1aXJlKCcuL1JlYWN0UHJvcFR5cGVzJyk7XG52YXIgUmVhY3RWZXJzaW9uID0gcmVxdWlyZSgnLi9SZWFjdFZlcnNpb24nKTtcblxudmFyIGNyZWF0ZVJlYWN0Q2xhc3MgPSByZXF1aXJlKCcuL2NyZWF0ZUNsYXNzJyk7XG52YXIgb25seUNoaWxkID0gcmVxdWlyZSgnLi9vbmx5Q2hpbGQnKTtcblxudmFyIGNyZWF0ZUVsZW1lbnQgPSBSZWFjdEVsZW1lbnQuY3JlYXRlRWxlbWVudDtcbnZhciBjcmVhdGVGYWN0b3J5ID0gUmVhY3RFbGVtZW50LmNyZWF0ZUZhY3Rvcnk7XG52YXIgY2xvbmVFbGVtZW50ID0gUmVhY3RFbGVtZW50LmNsb25lRWxlbWVudDtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFyIGxvd1ByaW9yaXR5V2FybmluZyA9IHJlcXVpcmUoJy4vbG93UHJpb3JpdHlXYXJuaW5nJyk7XG4gIHZhciBjYW5EZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vY2FuRGVmaW5lUHJvcGVydHknKTtcbiAgdmFyIFJlYWN0RWxlbWVudFZhbGlkYXRvciA9IHJlcXVpcmUoJy4vUmVhY3RFbGVtZW50VmFsaWRhdG9yJyk7XG4gIHZhciBkaWRXYXJuUHJvcFR5cGVzRGVwcmVjYXRlZCA9IGZhbHNlO1xuICBjcmVhdGVFbGVtZW50ID0gUmVhY3RFbGVtZW50VmFsaWRhdG9yLmNyZWF0ZUVsZW1lbnQ7XG4gIGNyZWF0ZUZhY3RvcnkgPSBSZWFjdEVsZW1lbnRWYWxpZGF0b3IuY3JlYXRlRmFjdG9yeTtcbiAgY2xvbmVFbGVtZW50ID0gUmVhY3RFbGVtZW50VmFsaWRhdG9yLmNsb25lRWxlbWVudDtcbn1cblxudmFyIF9fc3ByZWFkID0gX2Fzc2lnbjtcbnZhciBjcmVhdGVNaXhpbiA9IGZ1bmN0aW9uIChtaXhpbikge1xuICByZXR1cm4gbWl4aW47XG59O1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YXIgd2FybmVkRm9yU3ByZWFkID0gZmFsc2U7XG4gIHZhciB3YXJuZWRGb3JDcmVhdGVNaXhpbiA9IGZhbHNlO1xuICBfX3NwcmVhZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBsb3dQcmlvcml0eVdhcm5pbmcod2FybmVkRm9yU3ByZWFkLCAnUmVhY3QuX19zcHJlYWQgaXMgZGVwcmVjYXRlZCBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkLiBVc2UgJyArICdPYmplY3QuYXNzaWduIGRpcmVjdGx5IG9yIGFub3RoZXIgaGVscGVyIGZ1bmN0aW9uIHdpdGggc2ltaWxhciAnICsgJ3NlbWFudGljcy4gWW91IG1heSBiZSBzZWVpbmcgdGhpcyB3YXJuaW5nIGR1ZSB0byB5b3VyIGNvbXBpbGVyLiAnICsgJ1NlZSBodHRwczovL2ZiLm1lL3JlYWN0LXNwcmVhZC1kZXByZWNhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLicpO1xuICAgIHdhcm5lZEZvclNwcmVhZCA9IHRydWU7XG4gICAgcmV0dXJuIF9hc3NpZ24uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBjcmVhdGVNaXhpbiA9IGZ1bmN0aW9uIChtaXhpbikge1xuICAgIGxvd1ByaW9yaXR5V2FybmluZyh3YXJuZWRGb3JDcmVhdGVNaXhpbiwgJ1JlYWN0LmNyZWF0ZU1peGluIGlzIGRlcHJlY2F0ZWQgYW5kIHNob3VsZCBub3QgYmUgdXNlZC4gJyArICdJbiBSZWFjdCB2MTYuMCwgaXQgd2lsbCBiZSByZW1vdmVkLiAnICsgJ1lvdSBjYW4gdXNlIHRoaXMgbWl4aW4gZGlyZWN0bHkgaW5zdGVhZC4gJyArICdTZWUgaHR0cHM6Ly9mYi5tZS9jcmVhdGVtaXhpbi13YXMtbmV2ZXItaW1wbGVtZW50ZWQgZm9yIG1vcmUgaW5mby4nKTtcbiAgICB3YXJuZWRGb3JDcmVhdGVNaXhpbiA9IHRydWU7XG4gICAgcmV0dXJuIG1peGluO1xuICB9O1xufVxuXG52YXIgUmVhY3QgPSB7XG4gIC8vIE1vZGVyblxuXG4gIENoaWxkcmVuOiB7XG4gICAgbWFwOiBSZWFjdENoaWxkcmVuLm1hcCxcbiAgICBmb3JFYWNoOiBSZWFjdENoaWxkcmVuLmZvckVhY2gsXG4gICAgY291bnQ6IFJlYWN0Q2hpbGRyZW4uY291bnQsXG4gICAgdG9BcnJheTogUmVhY3RDaGlsZHJlbi50b0FycmF5LFxuICAgIG9ubHk6IG9ubHlDaGlsZFxuICB9LFxuXG4gIENvbXBvbmVudDogUmVhY3RCYXNlQ2xhc3Nlcy5Db21wb25lbnQsXG4gIFB1cmVDb21wb25lbnQ6IFJlYWN0QmFzZUNsYXNzZXMuUHVyZUNvbXBvbmVudCxcblxuICBjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50LFxuICBjbG9uZUVsZW1lbnQ6IGNsb25lRWxlbWVudCxcbiAgaXNWYWxpZEVsZW1lbnQ6IFJlYWN0RWxlbWVudC5pc1ZhbGlkRWxlbWVudCxcblxuICAvLyBDbGFzc2ljXG5cbiAgUHJvcFR5cGVzOiBSZWFjdFByb3BUeXBlcyxcbiAgY3JlYXRlQ2xhc3M6IGNyZWF0ZVJlYWN0Q2xhc3MsXG4gIGNyZWF0ZUZhY3Rvcnk6IGNyZWF0ZUZhY3RvcnksXG4gIGNyZWF0ZU1peGluOiBjcmVhdGVNaXhpbixcblxuICAvLyBUaGlzIGxvb2tzIERPTSBzcGVjaWZpYyBidXQgdGhlc2UgYXJlIGFjdHVhbGx5IGlzb21vcnBoaWMgaGVscGVyc1xuICAvLyBzaW5jZSB0aGV5IGFyZSBqdXN0IGdlbmVyYXRpbmcgRE9NIHN0cmluZ3MuXG4gIERPTTogUmVhY3RET01GYWN0b3JpZXMsXG5cbiAgdmVyc2lvbjogUmVhY3RWZXJzaW9uLFxuXG4gIC8vIERlcHJlY2F0ZWQgaG9vayBmb3IgSlNYIHNwcmVhZCwgZG9uJ3QgdXNlIHRoaXMgZm9yIGFueXRoaW5nLlxuICBfX3NwcmVhZDogX19zcHJlYWRcbn07XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZhciB3YXJuZWRGb3JDcmVhdGVDbGFzcyA9IGZhbHNlO1xuICBpZiAoY2FuRGVmaW5lUHJvcGVydHkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVhY3QsICdQcm9wVHlwZXMnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbG93UHJpb3JpdHlXYXJuaW5nKGRpZFdhcm5Qcm9wVHlwZXNEZXByZWNhdGVkLCAnQWNjZXNzaW5nIFByb3BUeXBlcyB2aWEgdGhlIG1haW4gUmVhY3QgcGFja2FnZSBpcyBkZXByZWNhdGVkLCcgKyAnIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gIFJlYWN0IHYxNi4wLicgKyAnIFVzZSB0aGUgbGF0ZXN0IGF2YWlsYWJsZSB2MTUuKiBwcm9wLXR5cGVzIHBhY2thZ2UgZnJvbSBucG0gaW5zdGVhZC4nICsgJyBGb3IgaW5mbyBvbiB1c2FnZSwgY29tcGF0aWJpbGl0eSwgbWlncmF0aW9uIGFuZCBtb3JlLCBzZWUgJyArICdodHRwczovL2ZiLm1lL3Byb3AtdHlwZXMtZG9jcycpO1xuICAgICAgICBkaWRXYXJuUHJvcFR5cGVzRGVwcmVjYXRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBSZWFjdFByb3BUeXBlcztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWFjdCwgJ2NyZWF0ZUNsYXNzJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvd1ByaW9yaXR5V2FybmluZyh3YXJuZWRGb3JDcmVhdGVDbGFzcywgJ0FjY2Vzc2luZyBjcmVhdGVDbGFzcyB2aWEgdGhlIG1haW4gUmVhY3QgcGFja2FnZSBpcyBkZXByZWNhdGVkLCcgKyAnIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gUmVhY3QgdjE2LjAuJyArIFwiIFVzZSBhIHBsYWluIEphdmFTY3JpcHQgY2xhc3MgaW5zdGVhZC4gSWYgeW91J3JlIG5vdCB5ZXQgXCIgKyAncmVhZHkgdG8gbWlncmF0ZSwgY3JlYXRlLXJlYWN0LWNsYXNzIHYxNS4qIGlzIGF2YWlsYWJsZSAnICsgJ29uIG5wbSBhcyBhIHRlbXBvcmFyeSwgZHJvcC1pbiByZXBsYWNlbWVudC4gJyArICdGb3IgbW9yZSBpbmZvIHNlZSBodHRwczovL2ZiLm1lL3JlYWN0LWNyZWF0ZS1jbGFzcycpO1xuICAgICAgICB3YXJuZWRGb3JDcmVhdGVDbGFzcyA9IHRydWU7XG4gICAgICAgIHJldHVybiBjcmVhdGVSZWFjdENsYXNzO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gUmVhY3QuRE9NIGZhY3RvcmllcyBhcmUgZGVwcmVjYXRlZC4gV3JhcCB0aGVzZSBtZXRob2RzIHNvIHRoYXRcbiAgLy8gaW52b2NhdGlvbnMgb2YgdGhlIFJlYWN0LkRPTSBuYW1lc3BhY2UgYW5kIGFsZXJ0IHVzZXJzIHRvIHN3aXRjaFxuICAvLyB0byB0aGUgYHJlYWN0LWRvbS1mYWN0b3JpZXNgIHBhY2thZ2UuXG4gIFJlYWN0LkRPTSA9IHt9O1xuICB2YXIgd2FybmVkRm9yRmFjdG9yaWVzID0gZmFsc2U7XG4gIE9iamVjdC5rZXlzKFJlYWN0RE9NRmFjdG9yaWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgUmVhY3QuRE9NW2ZhY3RvcnldID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF3YXJuZWRGb3JGYWN0b3JpZXMpIHtcbiAgICAgICAgbG93UHJpb3JpdHlXYXJuaW5nKGZhbHNlLCAnQWNjZXNzaW5nIGZhY3RvcmllcyBsaWtlIFJlYWN0LkRPTS4lcyBoYXMgYmVlbiBkZXByZWNhdGVkICcgKyAnYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB2MTYuMCsuIFVzZSB0aGUgJyArICdyZWFjdC1kb20tZmFjdG9yaWVzIHBhY2thZ2UgaW5zdGVhZC4gJyArICcgVmVyc2lvbiAxLjAgcHJvdmlkZXMgYSBkcm9wLWluIHJlcGxhY2VtZW50LicgKyAnIEZvciBtb3JlIGluZm8sIHNlZSBodHRwczovL2ZiLm1lL3JlYWN0LWRvbS1mYWN0b3JpZXMnLCBmYWN0b3J5KTtcbiAgICAgICAgd2FybmVkRm9yRmFjdG9yaWVzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBSZWFjdERPTUZhY3Rvcmllc1tmYWN0b3J5XS5hcHBseShSZWFjdERPTUZhY3RvcmllcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdDsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfcHJvZEludmFyaWFudCA9IHJlcXVpcmUoJy4vcmVhY3RQcm9kSW52YXJpYW50JyksXG4gICAgX2Fzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIFJlYWN0Tm9vcFVwZGF0ZVF1ZXVlID0gcmVxdWlyZSgnLi9SZWFjdE5vb3BVcGRhdGVRdWV1ZScpO1xuXG52YXIgY2FuRGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCcuL2NhbkRlZmluZVByb3BlcnR5Jyk7XG52YXIgZW1wdHlPYmplY3QgPSByZXF1aXJlKCdmYmpzL2xpYi9lbXB0eU9iamVjdCcpO1xudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xudmFyIGxvd1ByaW9yaXR5V2FybmluZyA9IHJlcXVpcmUoJy4vbG93UHJpb3JpdHlXYXJuaW5nJyk7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBoZWxwZXJzIGZvciB0aGUgdXBkYXRpbmcgc3RhdGUgb2YgYSBjb21wb25lbnQuXG4gKi9cbmZ1bmN0aW9uIFJlYWN0Q29tcG9uZW50KHByb3BzLCBjb250ZXh0LCB1cGRhdGVyKSB7XG4gIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5yZWZzID0gZW1wdHlPYmplY3Q7XG4gIC8vIFdlIGluaXRpYWxpemUgdGhlIGRlZmF1bHQgdXBkYXRlciBidXQgdGhlIHJlYWwgb25lIGdldHMgaW5qZWN0ZWQgYnkgdGhlXG4gIC8vIHJlbmRlcmVyLlxuICB0aGlzLnVwZGF0ZXIgPSB1cGRhdGVyIHx8IFJlYWN0Tm9vcFVwZGF0ZVF1ZXVlO1xufVxuXG5SZWFjdENvbXBvbmVudC5wcm90b3R5cGUuaXNSZWFjdENvbXBvbmVudCA9IHt9O1xuXG4vKipcbiAqIFNldHMgYSBzdWJzZXQgb2YgdGhlIHN0YXRlLiBBbHdheXMgdXNlIHRoaXMgdG8gbXV0YXRlXG4gKiBzdGF0ZS4gWW91IHNob3VsZCB0cmVhdCBgdGhpcy5zdGF0ZWAgYXMgaW1tdXRhYmxlLlxuICpcbiAqIFRoZXJlIGlzIG5vIGd1YXJhbnRlZSB0aGF0IGB0aGlzLnN0YXRlYCB3aWxsIGJlIGltbWVkaWF0ZWx5IHVwZGF0ZWQsIHNvXG4gKiBhY2Nlc3NpbmcgYHRoaXMuc3RhdGVgIGFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QgbWF5IHJldHVybiB0aGUgb2xkIHZhbHVlLlxuICpcbiAqIFRoZXJlIGlzIG5vIGd1YXJhbnRlZSB0aGF0IGNhbGxzIHRvIGBzZXRTdGF0ZWAgd2lsbCBydW4gc3luY2hyb25vdXNseSxcbiAqIGFzIHRoZXkgbWF5IGV2ZW50dWFsbHkgYmUgYmF0Y2hlZCB0b2dldGhlci4gIFlvdSBjYW4gcHJvdmlkZSBhbiBvcHRpb25hbFxuICogY2FsbGJhY2sgdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNhbGwgdG8gc2V0U3RhdGUgaXMgYWN0dWFsbHlcbiAqIGNvbXBsZXRlZC5cbiAqXG4gKiBXaGVuIGEgZnVuY3Rpb24gaXMgcHJvdmlkZWQgdG8gc2V0U3RhdGUsIGl0IHdpbGwgYmUgY2FsbGVkIGF0IHNvbWUgcG9pbnQgaW5cbiAqIHRoZSBmdXR1cmUgKG5vdCBzeW5jaHJvbm91c2x5KS4gSXQgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGUgdXAgdG8gZGF0ZVxuICogY29tcG9uZW50IGFyZ3VtZW50cyAoc3RhdGUsIHByb3BzLCBjb250ZXh0KS4gVGhlc2UgdmFsdWVzIGNhbiBiZSBkaWZmZXJlbnRcbiAqIGZyb20gdGhpcy4qIGJlY2F1c2UgeW91ciBmdW5jdGlvbiBtYXkgYmUgY2FsbGVkIGFmdGVyIHJlY2VpdmVQcm9wcyBidXQgYmVmb3JlXG4gKiBzaG91bGRDb21wb25lbnRVcGRhdGUsIGFuZCB0aGlzIG5ldyBzdGF0ZSwgcHJvcHMsIGFuZCBjb250ZXh0IHdpbGwgbm90IHlldCBiZVxuICogYXNzaWduZWQgdG8gdGhpcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdHxmdW5jdGlvbn0gcGFydGlhbFN0YXRlIE5leHQgcGFydGlhbCBzdGF0ZSBvciBmdW5jdGlvbiB0b1xuICogICAgICAgIHByb2R1Y2UgbmV4dCBwYXJ0aWFsIHN0YXRlIHRvIGJlIG1lcmdlZCB3aXRoIGN1cnJlbnQgc3RhdGUuXG4gKiBAcGFyYW0gez9mdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGVkIGFmdGVyIHN0YXRlIGlzIHVwZGF0ZWQuXG4gKiBAZmluYWxcbiAqIEBwcm90ZWN0ZWRcbiAqL1xuUmVhY3RDb21wb25lbnQucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24gKHBhcnRpYWxTdGF0ZSwgY2FsbGJhY2spIHtcbiAgISh0eXBlb2YgcGFydGlhbFN0YXRlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgcGFydGlhbFN0YXRlID09PSAnZnVuY3Rpb24nIHx8IHBhcnRpYWxTdGF0ZSA9PSBudWxsKSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdzZXRTdGF0ZSguLi4pOiB0YWtlcyBhbiBvYmplY3Qgb2Ygc3RhdGUgdmFyaWFibGVzIHRvIHVwZGF0ZSBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYW4gb2JqZWN0IG9mIHN0YXRlIHZhcmlhYmxlcy4nKSA6IF9wcm9kSW52YXJpYW50KCc4NScpIDogdm9pZCAwO1xuICB0aGlzLnVwZGF0ZXIuZW5xdWV1ZVNldFN0YXRlKHRoaXMsIHBhcnRpYWxTdGF0ZSk7XG4gIGlmIChjYWxsYmFjaykge1xuICAgIHRoaXMudXBkYXRlci5lbnF1ZXVlQ2FsbGJhY2sodGhpcywgY2FsbGJhY2ssICdzZXRTdGF0ZScpO1xuICB9XG59O1xuXG4vKipcbiAqIEZvcmNlcyBhbiB1cGRhdGUuIFRoaXMgc2hvdWxkIG9ubHkgYmUgaW52b2tlZCB3aGVuIGl0IGlzIGtub3duIHdpdGhcbiAqIGNlcnRhaW50eSB0aGF0IHdlIGFyZSAqKm5vdCoqIGluIGEgRE9NIHRyYW5zYWN0aW9uLlxuICpcbiAqIFlvdSBtYXkgd2FudCB0byBjYWxsIHRoaXMgd2hlbiB5b3Uga25vdyB0aGF0IHNvbWUgZGVlcGVyIGFzcGVjdCBvZiB0aGVcbiAqIGNvbXBvbmVudCdzIHN0YXRlIGhhcyBjaGFuZ2VkIGJ1dCBgc2V0U3RhdGVgIHdhcyBub3QgY2FsbGVkLlxuICpcbiAqIFRoaXMgd2lsbCBub3QgaW52b2tlIGBzaG91bGRDb21wb25lbnRVcGRhdGVgLCBidXQgaXQgd2lsbCBpbnZva2VcbiAqIGBjb21wb25lbnRXaWxsVXBkYXRlYCBhbmQgYGNvbXBvbmVudERpZFVwZGF0ZWAuXG4gKlxuICogQHBhcmFtIHs/ZnVuY3Rpb259IGNhbGxiYWNrIENhbGxlZCBhZnRlciB1cGRhdGUgaXMgY29tcGxldGUuXG4gKiBAZmluYWxcbiAqIEBwcm90ZWN0ZWRcbiAqL1xuUmVhY3RDb21wb25lbnQucHJvdG90eXBlLmZvcmNlVXBkYXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHRoaXMudXBkYXRlci5lbnF1ZXVlRm9yY2VVcGRhdGUodGhpcyk7XG4gIGlmIChjYWxsYmFjaykge1xuICAgIHRoaXMudXBkYXRlci5lbnF1ZXVlQ2FsbGJhY2sodGhpcywgY2FsbGJhY2ssICdmb3JjZVVwZGF0ZScpO1xuICB9XG59O1xuXG4vKipcbiAqIERlcHJlY2F0ZWQgQVBJcy4gVGhlc2UgQVBJcyB1c2VkIHRvIGV4aXN0IG9uIGNsYXNzaWMgUmVhY3QgY2xhc3NlcyBidXQgc2luY2VcbiAqIHdlIHdvdWxkIGxpa2UgdG8gZGVwcmVjYXRlIHRoZW0sIHdlJ3JlIG5vdCBnb2luZyB0byBtb3ZlIHRoZW0gb3ZlciB0byB0aGlzXG4gKiBtb2Rlcm4gYmFzZSBjbGFzcy4gSW5zdGVhZCwgd2UgZGVmaW5lIGEgZ2V0dGVyIHRoYXQgd2FybnMgaWYgaXQncyBhY2Nlc3NlZC5cbiAqL1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFyIGRlcHJlY2F0ZWRBUElzID0ge1xuICAgIGlzTW91bnRlZDogWydpc01vdW50ZWQnLCAnSW5zdGVhZCwgbWFrZSBzdXJlIHRvIGNsZWFuIHVwIHN1YnNjcmlwdGlvbnMgYW5kIHBlbmRpbmcgcmVxdWVzdHMgaW4gJyArICdjb21wb25lbnRXaWxsVW5tb3VudCB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy4nXSxcbiAgICByZXBsYWNlU3RhdGU6IFsncmVwbGFjZVN0YXRlJywgJ1JlZmFjdG9yIHlvdXIgY29kZSB0byB1c2Ugc2V0U3RhdGUgaW5zdGVhZCAoc2VlICcgKyAnaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2lzc3Vlcy8zMjM2KS4nXVxuICB9O1xuICB2YXIgZGVmaW5lRGVwcmVjYXRpb25XYXJuaW5nID0gZnVuY3Rpb24gKG1ldGhvZE5hbWUsIGluZm8pIHtcbiAgICBpZiAoY2FuRGVmaW5lUHJvcGVydHkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWFjdENvbXBvbmVudC5wcm90b3R5cGUsIG1ldGhvZE5hbWUsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbG93UHJpb3JpdHlXYXJuaW5nKGZhbHNlLCAnJXMoLi4uKSBpcyBkZXByZWNhdGVkIGluIHBsYWluIEphdmFTY3JpcHQgUmVhY3QgY2xhc3Nlcy4gJXMnLCBpbmZvWzBdLCBpbmZvWzFdKTtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIGZvciAodmFyIGZuTmFtZSBpbiBkZXByZWNhdGVkQVBJcykge1xuICAgIGlmIChkZXByZWNhdGVkQVBJcy5oYXNPd25Qcm9wZXJ0eShmbk5hbWUpKSB7XG4gICAgICBkZWZpbmVEZXByZWNhdGlvbldhcm5pbmcoZm5OYW1lLCBkZXByZWNhdGVkQVBJc1tmbk5hbWVdKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGhlbHBlcnMgZm9yIHRoZSB1cGRhdGluZyBzdGF0ZSBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZnVuY3Rpb24gUmVhY3RQdXJlQ29tcG9uZW50KHByb3BzLCBjb250ZXh0LCB1cGRhdGVyKSB7XG4gIC8vIER1cGxpY2F0ZWQgZnJvbSBSZWFjdENvbXBvbmVudC5cbiAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLnJlZnMgPSBlbXB0eU9iamVjdDtcbiAgLy8gV2UgaW5pdGlhbGl6ZSB0aGUgZGVmYXVsdCB1cGRhdGVyIGJ1dCB0aGUgcmVhbCBvbmUgZ2V0cyBpbmplY3RlZCBieSB0aGVcbiAgLy8gcmVuZGVyZXIuXG4gIHRoaXMudXBkYXRlciA9IHVwZGF0ZXIgfHwgUmVhY3ROb29wVXBkYXRlUXVldWU7XG59XG5cbmZ1bmN0aW9uIENvbXBvbmVudER1bW15KCkge31cbkNvbXBvbmVudER1bW15LnByb3RvdHlwZSA9IFJlYWN0Q29tcG9uZW50LnByb3RvdHlwZTtcblJlYWN0UHVyZUNvbXBvbmVudC5wcm90b3R5cGUgPSBuZXcgQ29tcG9uZW50RHVtbXkoKTtcblJlYWN0UHVyZUNvbXBvbmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBSZWFjdFB1cmVDb21wb25lbnQ7XG4vLyBBdm9pZCBhbiBleHRyYSBwcm90b3R5cGUganVtcCBmb3IgdGhlc2UgbWV0aG9kcy5cbl9hc3NpZ24oUmVhY3RQdXJlQ29tcG9uZW50LnByb3RvdHlwZSwgUmVhY3RDb21wb25lbnQucHJvdG90eXBlKTtcblJlYWN0UHVyZUNvbXBvbmVudC5wcm90b3R5cGUuaXNQdXJlUmVhY3RDb21wb25lbnQgPSB0cnVlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQ29tcG9uZW50OiBSZWFjdENvbXBvbmVudCxcbiAgUHVyZUNvbXBvbmVudDogUmVhY3RQdXJlQ29tcG9uZW50XG59OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFBvb2xlZENsYXNzID0gcmVxdWlyZSgnLi9Qb29sZWRDbGFzcycpO1xudmFyIFJlYWN0RWxlbWVudCA9IHJlcXVpcmUoJy4vUmVhY3RFbGVtZW50Jyk7XG5cbnZhciBlbXB0eUZ1bmN0aW9uID0gcmVxdWlyZSgnZmJqcy9saWIvZW1wdHlGdW5jdGlvbicpO1xudmFyIHRyYXZlcnNlQWxsQ2hpbGRyZW4gPSByZXF1aXJlKCcuL3RyYXZlcnNlQWxsQ2hpbGRyZW4nKTtcblxudmFyIHR3b0FyZ3VtZW50UG9vbGVyID0gUG9vbGVkQ2xhc3MudHdvQXJndW1lbnRQb29sZXI7XG52YXIgZm91ckFyZ3VtZW50UG9vbGVyID0gUG9vbGVkQ2xhc3MuZm91ckFyZ3VtZW50UG9vbGVyO1xuXG52YXIgdXNlclByb3ZpZGVkS2V5RXNjYXBlUmVnZXggPSAvXFwvKy9nO1xuZnVuY3Rpb24gZXNjYXBlVXNlclByb3ZpZGVkS2V5KHRleHQpIHtcbiAgcmV0dXJuICgnJyArIHRleHQpLnJlcGxhY2UodXNlclByb3ZpZGVkS2V5RXNjYXBlUmVnZXgsICckJi8nKTtcbn1cblxuLyoqXG4gKiBQb29sZWRDbGFzcyByZXByZXNlbnRpbmcgdGhlIGJvb2trZWVwaW5nIGFzc29jaWF0ZWQgd2l0aCBwZXJmb3JtaW5nIGEgY2hpbGRcbiAqIHRyYXZlcnNhbC4gQWxsb3dzIGF2b2lkaW5nIGJpbmRpbmcgY2FsbGJhY2tzLlxuICpcbiAqIEBjb25zdHJ1Y3RvciBGb3JFYWNoQm9va0tlZXBpbmdcbiAqIEBwYXJhbSB7IWZ1bmN0aW9ufSBmb3JFYWNoRnVuY3Rpb24gRnVuY3Rpb24gdG8gcGVyZm9ybSB0cmF2ZXJzYWwgd2l0aC5cbiAqIEBwYXJhbSB7Pyp9IGZvckVhY2hDb250ZXh0IENvbnRleHQgdG8gcGVyZm9ybSBjb250ZXh0IHdpdGguXG4gKi9cbmZ1bmN0aW9uIEZvckVhY2hCb29rS2VlcGluZyhmb3JFYWNoRnVuY3Rpb24sIGZvckVhY2hDb250ZXh0KSB7XG4gIHRoaXMuZnVuYyA9IGZvckVhY2hGdW5jdGlvbjtcbiAgdGhpcy5jb250ZXh0ID0gZm9yRWFjaENvbnRleHQ7XG4gIHRoaXMuY291bnQgPSAwO1xufVxuRm9yRWFjaEJvb2tLZWVwaW5nLnByb3RvdHlwZS5kZXN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmZ1bmMgPSBudWxsO1xuICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICB0aGlzLmNvdW50ID0gMDtcbn07XG5Qb29sZWRDbGFzcy5hZGRQb29saW5nVG8oRm9yRWFjaEJvb2tLZWVwaW5nLCB0d29Bcmd1bWVudFBvb2xlcik7XG5cbmZ1bmN0aW9uIGZvckVhY2hTaW5nbGVDaGlsZChib29rS2VlcGluZywgY2hpbGQsIG5hbWUpIHtcbiAgdmFyIGZ1bmMgPSBib29rS2VlcGluZy5mdW5jLFxuICAgICAgY29udGV4dCA9IGJvb2tLZWVwaW5nLmNvbnRleHQ7XG5cbiAgZnVuYy5jYWxsKGNvbnRleHQsIGNoaWxkLCBib29rS2VlcGluZy5jb3VudCsrKTtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXMgYHByb3BzLmNoaWxkcmVuYC5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy90b3AtbGV2ZWwtYXBpLmh0bWwjcmVhY3QuY2hpbGRyZW4uZm9yZWFjaFxuICpcbiAqIFRoZSBwcm92aWRlZCBmb3JFYWNoRnVuYyhjaGlsZCwgaW5kZXgpIHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoXG4gKiBsZWFmIGNoaWxkLlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHBhcmFtIHtmdW5jdGlvbigqLCBpbnQpfSBmb3JFYWNoRnVuY1xuICogQHBhcmFtIHsqfSBmb3JFYWNoQ29udGV4dCBDb250ZXh0IGZvciBmb3JFYWNoQ29udGV4dC5cbiAqL1xuZnVuY3Rpb24gZm9yRWFjaENoaWxkcmVuKGNoaWxkcmVuLCBmb3JFYWNoRnVuYywgZm9yRWFjaENvbnRleHQpIHtcbiAgaWYgKGNoaWxkcmVuID09IG51bGwpIHtcbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cbiAgdmFyIHRyYXZlcnNlQ29udGV4dCA9IEZvckVhY2hCb29rS2VlcGluZy5nZXRQb29sZWQoZm9yRWFjaEZ1bmMsIGZvckVhY2hDb250ZXh0KTtcbiAgdHJhdmVyc2VBbGxDaGlsZHJlbihjaGlsZHJlbiwgZm9yRWFjaFNpbmdsZUNoaWxkLCB0cmF2ZXJzZUNvbnRleHQpO1xuICBGb3JFYWNoQm9va0tlZXBpbmcucmVsZWFzZSh0cmF2ZXJzZUNvbnRleHQpO1xufVxuXG4vKipcbiAqIFBvb2xlZENsYXNzIHJlcHJlc2VudGluZyB0aGUgYm9va2tlZXBpbmcgYXNzb2NpYXRlZCB3aXRoIHBlcmZvcm1pbmcgYSBjaGlsZFxuICogbWFwcGluZy4gQWxsb3dzIGF2b2lkaW5nIGJpbmRpbmcgY2FsbGJhY2tzLlxuICpcbiAqIEBjb25zdHJ1Y3RvciBNYXBCb29rS2VlcGluZ1xuICogQHBhcmFtIHshKn0gbWFwUmVzdWx0IE9iamVjdCBjb250YWluaW5nIHRoZSBvcmRlcmVkIG1hcCBvZiByZXN1bHRzLlxuICogQHBhcmFtIHshZnVuY3Rpb259IG1hcEZ1bmN0aW9uIEZ1bmN0aW9uIHRvIHBlcmZvcm0gbWFwcGluZyB3aXRoLlxuICogQHBhcmFtIHs/Kn0gbWFwQ29udGV4dCBDb250ZXh0IHRvIHBlcmZvcm0gbWFwcGluZyB3aXRoLlxuICovXG5mdW5jdGlvbiBNYXBCb29rS2VlcGluZyhtYXBSZXN1bHQsIGtleVByZWZpeCwgbWFwRnVuY3Rpb24sIG1hcENvbnRleHQpIHtcbiAgdGhpcy5yZXN1bHQgPSBtYXBSZXN1bHQ7XG4gIHRoaXMua2V5UHJlZml4ID0ga2V5UHJlZml4O1xuICB0aGlzLmZ1bmMgPSBtYXBGdW5jdGlvbjtcbiAgdGhpcy5jb250ZXh0ID0gbWFwQ29udGV4dDtcbiAgdGhpcy5jb3VudCA9IDA7XG59XG5NYXBCb29rS2VlcGluZy5wcm90b3R5cGUuZGVzdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5yZXN1bHQgPSBudWxsO1xuICB0aGlzLmtleVByZWZpeCA9IG51bGw7XG4gIHRoaXMuZnVuYyA9IG51bGw7XG4gIHRoaXMuY29udGV4dCA9IG51bGw7XG4gIHRoaXMuY291bnQgPSAwO1xufTtcblBvb2xlZENsYXNzLmFkZFBvb2xpbmdUbyhNYXBCb29rS2VlcGluZywgZm91ckFyZ3VtZW50UG9vbGVyKTtcblxuZnVuY3Rpb24gbWFwU2luZ2xlQ2hpbGRJbnRvQ29udGV4dChib29rS2VlcGluZywgY2hpbGQsIGNoaWxkS2V5KSB7XG4gIHZhciByZXN1bHQgPSBib29rS2VlcGluZy5yZXN1bHQsXG4gICAgICBrZXlQcmVmaXggPSBib29rS2VlcGluZy5rZXlQcmVmaXgsXG4gICAgICBmdW5jID0gYm9va0tlZXBpbmcuZnVuYyxcbiAgICAgIGNvbnRleHQgPSBib29rS2VlcGluZy5jb250ZXh0O1xuXG5cbiAgdmFyIG1hcHBlZENoaWxkID0gZnVuYy5jYWxsKGNvbnRleHQsIGNoaWxkLCBib29rS2VlcGluZy5jb3VudCsrKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkobWFwcGVkQ2hpbGQpKSB7XG4gICAgbWFwSW50b1dpdGhLZXlQcmVmaXhJbnRlcm5hbChtYXBwZWRDaGlsZCwgcmVzdWx0LCBjaGlsZEtleSwgZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc0FyZ3VtZW50KTtcbiAgfSBlbHNlIGlmIChtYXBwZWRDaGlsZCAhPSBudWxsKSB7XG4gICAgaWYgKFJlYWN0RWxlbWVudC5pc1ZhbGlkRWxlbWVudChtYXBwZWRDaGlsZCkpIHtcbiAgICAgIG1hcHBlZENoaWxkID0gUmVhY3RFbGVtZW50LmNsb25lQW5kUmVwbGFjZUtleShtYXBwZWRDaGlsZCxcbiAgICAgIC8vIEtlZXAgYm90aCB0aGUgKG1hcHBlZCkgYW5kIG9sZCBrZXlzIGlmIHRoZXkgZGlmZmVyLCBqdXN0IGFzXG4gICAgICAvLyB0cmF2ZXJzZUFsbENoaWxkcmVuIHVzZWQgdG8gZG8gZm9yIG9iamVjdHMgYXMgY2hpbGRyZW5cbiAgICAgIGtleVByZWZpeCArIChtYXBwZWRDaGlsZC5rZXkgJiYgKCFjaGlsZCB8fCBjaGlsZC5rZXkgIT09IG1hcHBlZENoaWxkLmtleSkgPyBlc2NhcGVVc2VyUHJvdmlkZWRLZXkobWFwcGVkQ2hpbGQua2V5KSArICcvJyA6ICcnKSArIGNoaWxkS2V5KTtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2gobWFwcGVkQ2hpbGQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcEludG9XaXRoS2V5UHJlZml4SW50ZXJuYWwoY2hpbGRyZW4sIGFycmF5LCBwcmVmaXgsIGZ1bmMsIGNvbnRleHQpIHtcbiAgdmFyIGVzY2FwZWRQcmVmaXggPSAnJztcbiAgaWYgKHByZWZpeCAhPSBudWxsKSB7XG4gICAgZXNjYXBlZFByZWZpeCA9IGVzY2FwZVVzZXJQcm92aWRlZEtleShwcmVmaXgpICsgJy8nO1xuICB9XG4gIHZhciB0cmF2ZXJzZUNvbnRleHQgPSBNYXBCb29rS2VlcGluZy5nZXRQb29sZWQoYXJyYXksIGVzY2FwZWRQcmVmaXgsIGZ1bmMsIGNvbnRleHQpO1xuICB0cmF2ZXJzZUFsbENoaWxkcmVuKGNoaWxkcmVuLCBtYXBTaW5nbGVDaGlsZEludG9Db250ZXh0LCB0cmF2ZXJzZUNvbnRleHQpO1xuICBNYXBCb29rS2VlcGluZy5yZWxlYXNlKHRyYXZlcnNlQ29udGV4dCk7XG59XG5cbi8qKlxuICogTWFwcyBjaGlsZHJlbiB0aGF0IGFyZSB0eXBpY2FsbHkgc3BlY2lmaWVkIGFzIGBwcm9wcy5jaGlsZHJlbmAuXG4gKlxuICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvdG9wLWxldmVsLWFwaS5odG1sI3JlYWN0LmNoaWxkcmVuLm1hcFxuICpcbiAqIFRoZSBwcm92aWRlZCBtYXBGdW5jdGlvbihjaGlsZCwga2V5LCBpbmRleCkgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2hcbiAqIGxlYWYgY2hpbGQuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCosIGludCl9IGZ1bmMgVGhlIG1hcCBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBDb250ZXh0IGZvciBtYXBGdW5jdGlvbi5cbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9yZGVyZWQgbWFwIG9mIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIG1hcENoaWxkcmVuKGNoaWxkcmVuLCBmdW5jLCBjb250ZXh0KSB7XG4gIGlmIChjaGlsZHJlbiA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgbWFwSW50b1dpdGhLZXlQcmVmaXhJbnRlcm5hbChjaGlsZHJlbiwgcmVzdWx0LCBudWxsLCBmdW5jLCBjb250ZXh0KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZm9yRWFjaFNpbmdsZUNoaWxkRHVtbXkodHJhdmVyc2VDb250ZXh0LCBjaGlsZCwgbmFtZSkge1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDb3VudCB0aGUgbnVtYmVyIG9mIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXNcbiAqIGBwcm9wcy5jaGlsZHJlbmAuXG4gKlxuICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvdG9wLWxldmVsLWFwaS5odG1sI3JlYWN0LmNoaWxkcmVuLmNvdW50XG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBudW1iZXIgb2YgY2hpbGRyZW4uXG4gKi9cbmZ1bmN0aW9uIGNvdW50Q2hpbGRyZW4oY2hpbGRyZW4sIGNvbnRleHQpIHtcbiAgcmV0dXJuIHRyYXZlcnNlQWxsQ2hpbGRyZW4oY2hpbGRyZW4sIGZvckVhY2hTaW5nbGVDaGlsZER1bW15LCBudWxsKTtcbn1cblxuLyoqXG4gKiBGbGF0dGVuIGEgY2hpbGRyZW4gb2JqZWN0ICh0eXBpY2FsbHkgc3BlY2lmaWVkIGFzIGBwcm9wcy5jaGlsZHJlbmApIGFuZFxuICogcmV0dXJuIGFuIGFycmF5IHdpdGggYXBwcm9wcmlhdGVseSByZS1rZXllZCBjaGlsZHJlbi5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy90b3AtbGV2ZWwtYXBpLmh0bWwjcmVhY3QuY2hpbGRyZW4udG9hcnJheVxuICovXG5mdW5jdGlvbiB0b0FycmF5KGNoaWxkcmVuKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgbWFwSW50b1dpdGhLZXlQcmVmaXhJbnRlcm5hbChjaGlsZHJlbiwgcmVzdWx0LCBudWxsLCBlbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zQXJndW1lbnQpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIgUmVhY3RDaGlsZHJlbiA9IHtcbiAgZm9yRWFjaDogZm9yRWFjaENoaWxkcmVuLFxuICBtYXA6IG1hcENoaWxkcmVuLFxuICBtYXBJbnRvV2l0aEtleVByZWZpeEludGVybmFsOiBtYXBJbnRvV2l0aEtleVByZWZpeEludGVybmFsLFxuICBjb3VudDogY291bnRDaGlsZHJlbixcbiAgdG9BcnJheTogdG9BcnJheVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdENoaWxkcmVuOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE2LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3Byb2RJbnZhcmlhbnQgPSByZXF1aXJlKCcuL3JlYWN0UHJvZEludmFyaWFudCcpO1xuXG52YXIgUmVhY3RDdXJyZW50T3duZXIgPSByZXF1aXJlKCcuL1JlYWN0Q3VycmVudE93bmVyJyk7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcbnZhciB3YXJuaW5nID0gcmVxdWlyZSgnZmJqcy9saWIvd2FybmluZycpO1xuXG5mdW5jdGlvbiBpc05hdGl2ZShmbikge1xuICAvLyBCYXNlZCBvbiBpc05hdGl2ZSgpIGZyb20gTG9kYXNoXG4gIHZhciBmdW5jVG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArIGZ1bmNUb1N0cmluZ1xuICAvLyBUYWtlIGFuIGV4YW1wbGUgbmF0aXZlIGZ1bmN0aW9uIHNvdXJjZSBmb3IgY29tcGFyaXNvblxuICAuY2FsbChoYXNPd25Qcm9wZXJ0eVxuICAvLyBTdHJpcCByZWdleCBjaGFyYWN0ZXJzIHNvIHdlIGNhbiB1c2UgaXQgZm9yIHJlZ2V4XG4gICkucmVwbGFjZSgvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2csICdcXFxcJCYnXG4gIC8vIFJlbW92ZSBoYXNPd25Qcm9wZXJ0eSBmcm9tIHRoZSB0ZW1wbGF0ZSB0byBtYWtlIGl0IGdlbmVyaWNcbiAgKS5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJyk7XG4gIHRyeSB7XG4gICAgdmFyIHNvdXJjZSA9IGZ1bmNUb1N0cmluZy5jYWxsKGZuKTtcbiAgICByZXR1cm4gcmVJc05hdGl2ZS50ZXN0KHNvdXJjZSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG52YXIgY2FuVXNlQ29sbGVjdGlvbnMgPVxuLy8gQXJyYXkuZnJvbVxudHlwZW9mIEFycmF5LmZyb20gPT09ICdmdW5jdGlvbicgJiZcbi8vIE1hcFxudHlwZW9mIE1hcCA9PT0gJ2Z1bmN0aW9uJyAmJiBpc05hdGl2ZShNYXApICYmXG4vLyBNYXAucHJvdG90eXBlLmtleXNcbk1hcC5wcm90b3R5cGUgIT0gbnVsbCAmJiB0eXBlb2YgTWFwLnByb3RvdHlwZS5rZXlzID09PSAnZnVuY3Rpb24nICYmIGlzTmF0aXZlKE1hcC5wcm90b3R5cGUua2V5cykgJiZcbi8vIFNldFxudHlwZW9mIFNldCA9PT0gJ2Z1bmN0aW9uJyAmJiBpc05hdGl2ZShTZXQpICYmXG4vLyBTZXQucHJvdG90eXBlLmtleXNcblNldC5wcm90b3R5cGUgIT0gbnVsbCAmJiB0eXBlb2YgU2V0LnByb3RvdHlwZS5rZXlzID09PSAnZnVuY3Rpb24nICYmIGlzTmF0aXZlKFNldC5wcm90b3R5cGUua2V5cyk7XG5cbnZhciBzZXRJdGVtO1xudmFyIGdldEl0ZW07XG52YXIgcmVtb3ZlSXRlbTtcbnZhciBnZXRJdGVtSURzO1xudmFyIGFkZFJvb3Q7XG52YXIgcmVtb3ZlUm9vdDtcbnZhciBnZXRSb290SURzO1xuXG5pZiAoY2FuVXNlQ29sbGVjdGlvbnMpIHtcbiAgdmFyIGl0ZW1NYXAgPSBuZXcgTWFwKCk7XG4gIHZhciByb290SURTZXQgPSBuZXcgU2V0KCk7XG5cbiAgc2V0SXRlbSA9IGZ1bmN0aW9uIChpZCwgaXRlbSkge1xuICAgIGl0ZW1NYXAuc2V0KGlkLCBpdGVtKTtcbiAgfTtcbiAgZ2V0SXRlbSA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiBpdGVtTWFwLmdldChpZCk7XG4gIH07XG4gIHJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICBpdGVtTWFwWydkZWxldGUnXShpZCk7XG4gIH07XG4gIGdldEl0ZW1JRHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oaXRlbU1hcC5rZXlzKCkpO1xuICB9O1xuXG4gIGFkZFJvb3QgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICByb290SURTZXQuYWRkKGlkKTtcbiAgfTtcbiAgcmVtb3ZlUm9vdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJvb3RJRFNldFsnZGVsZXRlJ10oaWQpO1xuICB9O1xuICBnZXRSb290SURzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHJvb3RJRFNldC5rZXlzKCkpO1xuICB9O1xufSBlbHNlIHtcbiAgdmFyIGl0ZW1CeUtleSA9IHt9O1xuICB2YXIgcm9vdEJ5S2V5ID0ge307XG5cbiAgLy8gVXNlIG5vbi1udW1lcmljIGtleXMgdG8gcHJldmVudCBWOCBwZXJmb3JtYW5jZSBpc3N1ZXM6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9wdWxsLzcyMzJcbiAgdmFyIGdldEtleUZyb21JRCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiAnLicgKyBpZDtcbiAgfTtcbiAgdmFyIGdldElERnJvbUtleSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gcGFyc2VJbnQoa2V5LnN1YnN0cigxKSwgMTApO1xuICB9O1xuXG4gIHNldEl0ZW0gPSBmdW5jdGlvbiAoaWQsIGl0ZW0pIHtcbiAgICB2YXIga2V5ID0gZ2V0S2V5RnJvbUlEKGlkKTtcbiAgICBpdGVtQnlLZXlba2V5XSA9IGl0ZW07XG4gIH07XG4gIGdldEl0ZW0gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIga2V5ID0gZ2V0S2V5RnJvbUlEKGlkKTtcbiAgICByZXR1cm4gaXRlbUJ5S2V5W2tleV07XG4gIH07XG4gIHJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIga2V5ID0gZ2V0S2V5RnJvbUlEKGlkKTtcbiAgICBkZWxldGUgaXRlbUJ5S2V5W2tleV07XG4gIH07XG4gIGdldEl0ZW1JRHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGl0ZW1CeUtleSkubWFwKGdldElERnJvbUtleSk7XG4gIH07XG5cbiAgYWRkUm9vdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBrZXkgPSBnZXRLZXlGcm9tSUQoaWQpO1xuICAgIHJvb3RCeUtleVtrZXldID0gdHJ1ZTtcbiAgfTtcbiAgcmVtb3ZlUm9vdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBrZXkgPSBnZXRLZXlGcm9tSUQoaWQpO1xuICAgIGRlbGV0ZSByb290QnlLZXlba2V5XTtcbiAgfTtcbiAgZ2V0Um9vdElEcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocm9vdEJ5S2V5KS5tYXAoZ2V0SURGcm9tS2V5KTtcbiAgfTtcbn1cblxudmFyIHVubW91bnRlZElEcyA9IFtdO1xuXG5mdW5jdGlvbiBwdXJnZURlZXAoaWQpIHtcbiAgdmFyIGl0ZW0gPSBnZXRJdGVtKGlkKTtcbiAgaWYgKGl0ZW0pIHtcbiAgICB2YXIgY2hpbGRJRHMgPSBpdGVtLmNoaWxkSURzO1xuXG4gICAgcmVtb3ZlSXRlbShpZCk7XG4gICAgY2hpbGRJRHMuZm9yRWFjaChwdXJnZURlZXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlc2NyaWJlQ29tcG9uZW50RnJhbWUobmFtZSwgc291cmNlLCBvd25lck5hbWUpIHtcbiAgcmV0dXJuICdcXG4gICAgaW4gJyArIChuYW1lIHx8ICdVbmtub3duJykgKyAoc291cmNlID8gJyAoYXQgJyArIHNvdXJjZS5maWxlTmFtZS5yZXBsYWNlKC9eLipbXFxcXFxcL10vLCAnJykgKyAnOicgKyBzb3VyY2UubGluZU51bWJlciArICcpJyA6IG93bmVyTmFtZSA/ICcgKGNyZWF0ZWQgYnkgJyArIG93bmVyTmFtZSArICcpJyA6ICcnKTtcbn1cblxuZnVuY3Rpb24gZ2V0RGlzcGxheU5hbWUoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudCA9PSBudWxsKSB7XG4gICAgcmV0dXJuICcjZW1wdHknO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudCA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gJyN0ZXh0JztcbiAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudC50eXBlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBlbGVtZW50LnR5cGU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGVsZW1lbnQudHlwZS5kaXNwbGF5TmFtZSB8fCBlbGVtZW50LnR5cGUubmFtZSB8fCAnVW5rbm93bic7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpYmVJRChpZCkge1xuICB2YXIgbmFtZSA9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0RGlzcGxheU5hbWUoaWQpO1xuICB2YXIgZWxlbWVudCA9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0RWxlbWVudChpZCk7XG4gIHZhciBvd25lcklEID0gUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRPd25lcklEKGlkKTtcbiAgdmFyIG93bmVyTmFtZTtcbiAgaWYgKG93bmVySUQpIHtcbiAgICBvd25lck5hbWUgPSBSZWFjdENvbXBvbmVudFRyZWVIb29rLmdldERpc3BsYXlOYW1lKG93bmVySUQpO1xuICB9XG4gIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyB3YXJuaW5nKGVsZW1lbnQsICdSZWFjdENvbXBvbmVudFRyZWVIb29rOiBNaXNzaW5nIFJlYWN0IGVsZW1lbnQgZm9yIGRlYnVnSUQgJXMgd2hlbiAnICsgJ2J1aWxkaW5nIHN0YWNrJywgaWQpIDogdm9pZCAwO1xuICByZXR1cm4gZGVzY3JpYmVDb21wb25lbnRGcmFtZShuYW1lLCBlbGVtZW50ICYmIGVsZW1lbnQuX3NvdXJjZSwgb3duZXJOYW1lKTtcbn1cblxudmFyIFJlYWN0Q29tcG9uZW50VHJlZUhvb2sgPSB7XG4gIG9uU2V0Q2hpbGRyZW46IGZ1bmN0aW9uIChpZCwgbmV4dENoaWxkSURzKSB7XG4gICAgdmFyIGl0ZW0gPSBnZXRJdGVtKGlkKTtcbiAgICAhaXRlbSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdJdGVtIG11c3QgaGF2ZSBiZWVuIHNldCcpIDogX3Byb2RJbnZhcmlhbnQoJzE0NCcpIDogdm9pZCAwO1xuICAgIGl0ZW0uY2hpbGRJRHMgPSBuZXh0Q2hpbGRJRHM7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5leHRDaGlsZElEcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG5leHRDaGlsZElEID0gbmV4dENoaWxkSURzW2ldO1xuICAgICAgdmFyIG5leHRDaGlsZCA9IGdldEl0ZW0obmV4dENoaWxkSUQpO1xuICAgICAgIW5leHRDaGlsZCA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdFeHBlY3RlZCBob29rIGV2ZW50cyB0byBmaXJlIGZvciB0aGUgY2hpbGQgYmVmb3JlIGl0cyBwYXJlbnQgaW5jbHVkZXMgaXQgaW4gb25TZXRDaGlsZHJlbigpLicpIDogX3Byb2RJbnZhcmlhbnQoJzE0MCcpIDogdm9pZCAwO1xuICAgICAgIShuZXh0Q2hpbGQuY2hpbGRJRHMgIT0gbnVsbCB8fCB0eXBlb2YgbmV4dENoaWxkLmVsZW1lbnQgIT09ICdvYmplY3QnIHx8IG5leHRDaGlsZC5lbGVtZW50ID09IG51bGwpID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0V4cGVjdGVkIG9uU2V0Q2hpbGRyZW4oKSB0byBmaXJlIGZvciBhIGNvbnRhaW5lciBjaGlsZCBiZWZvcmUgaXRzIHBhcmVudCBpbmNsdWRlcyBpdCBpbiBvblNldENoaWxkcmVuKCkuJykgOiBfcHJvZEludmFyaWFudCgnMTQxJykgOiB2b2lkIDA7XG4gICAgICAhbmV4dENoaWxkLmlzTW91bnRlZCA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdFeHBlY3RlZCBvbk1vdW50Q29tcG9uZW50KCkgdG8gZmlyZSBmb3IgdGhlIGNoaWxkIGJlZm9yZSBpdHMgcGFyZW50IGluY2x1ZGVzIGl0IGluIG9uU2V0Q2hpbGRyZW4oKS4nKSA6IF9wcm9kSW52YXJpYW50KCc3MScpIDogdm9pZCAwO1xuICAgICAgaWYgKG5leHRDaGlsZC5wYXJlbnRJRCA9PSBudWxsKSB7XG4gICAgICAgIG5leHRDaGlsZC5wYXJlbnRJRCA9IGlkO1xuICAgICAgICAvLyBUT0RPOiBUaGlzIHNob3VsZG4ndCBiZSBuZWNlc3NhcnkgYnV0IG1vdW50aW5nIGEgbmV3IHJvb3QgZHVyaW5nIGluXG4gICAgICAgIC8vIGNvbXBvbmVudFdpbGxNb3VudCBjdXJyZW50bHkgY2F1c2VzIG5vdC15ZXQtbW91bnRlZCBjb21wb25lbnRzIHRvXG4gICAgICAgIC8vIGJlIHB1cmdlZCBmcm9tIG91ciB0cmVlIGRhdGEgc28gdGhlaXIgcGFyZW50IGlkIGlzIG1pc3NpbmcuXG4gICAgICB9XG4gICAgICAhKG5leHRDaGlsZC5wYXJlbnRJRCA9PT0gaWQpID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0V4cGVjdGVkIG9uQmVmb3JlTW91bnRDb21wb25lbnQoKSBwYXJlbnQgYW5kIG9uU2V0Q2hpbGRyZW4oKSB0byBiZSBjb25zaXN0ZW50ICglcyBoYXMgcGFyZW50cyAlcyBhbmQgJXMpLicsIG5leHRDaGlsZElELCBuZXh0Q2hpbGQucGFyZW50SUQsIGlkKSA6IF9wcm9kSW52YXJpYW50KCcxNDInLCBuZXh0Q2hpbGRJRCwgbmV4dENoaWxkLnBhcmVudElELCBpZCkgOiB2b2lkIDA7XG4gICAgfVxuICB9LFxuICBvbkJlZm9yZU1vdW50Q29tcG9uZW50OiBmdW5jdGlvbiAoaWQsIGVsZW1lbnQsIHBhcmVudElEKSB7XG4gICAgdmFyIGl0ZW0gPSB7XG4gICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgcGFyZW50SUQ6IHBhcmVudElELFxuICAgICAgdGV4dDogbnVsbCxcbiAgICAgIGNoaWxkSURzOiBbXSxcbiAgICAgIGlzTW91bnRlZDogZmFsc2UsXG4gICAgICB1cGRhdGVDb3VudDogMFxuICAgIH07XG4gICAgc2V0SXRlbShpZCwgaXRlbSk7XG4gIH0sXG4gIG9uQmVmb3JlVXBkYXRlQ29tcG9uZW50OiBmdW5jdGlvbiAoaWQsIGVsZW1lbnQpIHtcbiAgICB2YXIgaXRlbSA9IGdldEl0ZW0oaWQpO1xuICAgIGlmICghaXRlbSB8fCAhaXRlbS5pc01vdW50ZWQpIHtcbiAgICAgIC8vIFdlIG1heSBlbmQgdXAgaGVyZSBhcyBhIHJlc3VsdCBvZiBzZXRTdGF0ZSgpIGluIGNvbXBvbmVudFdpbGxVbm1vdW50KCkuXG4gICAgICAvLyBJbiB0aGlzIGNhc2UsIGlnbm9yZSB0aGUgZWxlbWVudC5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaXRlbS5lbGVtZW50ID0gZWxlbWVudDtcbiAgfSxcbiAgb25Nb3VudENvbXBvbmVudDogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIGl0ZW0gPSBnZXRJdGVtKGlkKTtcbiAgICAhaXRlbSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdJdGVtIG11c3QgaGF2ZSBiZWVuIHNldCcpIDogX3Byb2RJbnZhcmlhbnQoJzE0NCcpIDogdm9pZCAwO1xuICAgIGl0ZW0uaXNNb3VudGVkID0gdHJ1ZTtcbiAgICB2YXIgaXNSb290ID0gaXRlbS5wYXJlbnRJRCA9PT0gMDtcbiAgICBpZiAoaXNSb290KSB7XG4gICAgICBhZGRSb290KGlkKTtcbiAgICB9XG4gIH0sXG4gIG9uVXBkYXRlQ29tcG9uZW50OiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgaXRlbSA9IGdldEl0ZW0oaWQpO1xuICAgIGlmICghaXRlbSB8fCAhaXRlbS5pc01vdW50ZWQpIHtcbiAgICAgIC8vIFdlIG1heSBlbmQgdXAgaGVyZSBhcyBhIHJlc3VsdCBvZiBzZXRTdGF0ZSgpIGluIGNvbXBvbmVudFdpbGxVbm1vdW50KCkuXG4gICAgICAvLyBJbiB0aGlzIGNhc2UsIGlnbm9yZSB0aGUgZWxlbWVudC5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaXRlbS51cGRhdGVDb3VudCsrO1xuICB9LFxuICBvblVubW91bnRDb21wb25lbnQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBpdGVtID0gZ2V0SXRlbShpZCk7XG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gY2hlY2sgaWYgaXQgZXhpc3RzLlxuICAgICAgLy8gYGl0ZW1gIG1pZ2h0IG5vdCBleGlzdCBpZiBpdCBpcyBpbnNpZGUgYW4gZXJyb3IgYm91bmRhcnksIGFuZCBhIHNpYmxpbmdcbiAgICAgIC8vIGVycm9yIGJvdW5kYXJ5IGNoaWxkIHRocmV3IHdoaWxlIG1vdW50aW5nLiBUaGVuIHRoaXMgaW5zdGFuY2UgbmV2ZXJcbiAgICAgIC8vIGdvdCBhIGNoYW5jZSB0byBtb3VudCwgYnV0IGl0IHN0aWxsIGdldHMgYW4gdW5tb3VudGluZyBldmVudCBkdXJpbmdcbiAgICAgIC8vIHRoZSBlcnJvciBib3VuZGFyeSBjbGVhbnVwLlxuICAgICAgaXRlbS5pc01vdW50ZWQgPSBmYWxzZTtcbiAgICAgIHZhciBpc1Jvb3QgPSBpdGVtLnBhcmVudElEID09PSAwO1xuICAgICAgaWYgKGlzUm9vdCkge1xuICAgICAgICByZW1vdmVSb290KGlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdW5tb3VudGVkSURzLnB1c2goaWQpO1xuICB9LFxuICBwdXJnZVVubW91bnRlZENvbXBvbmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoUmVhY3RDb21wb25lbnRUcmVlSG9vay5fcHJldmVudFB1cmdpbmcpIHtcbiAgICAgIC8vIFNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHRlc3RpbmcuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1bm1vdW50ZWRJRHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpZCA9IHVubW91bnRlZElEc1tpXTtcbiAgICAgIHB1cmdlRGVlcChpZCk7XG4gICAgfVxuICAgIHVubW91bnRlZElEcy5sZW5ndGggPSAwO1xuICB9LFxuICBpc01vdW50ZWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBpdGVtID0gZ2V0SXRlbShpZCk7XG4gICAgcmV0dXJuIGl0ZW0gPyBpdGVtLmlzTW91bnRlZCA6IGZhbHNlO1xuICB9LFxuICBnZXRDdXJyZW50U3RhY2tBZGRlbmR1bTogZnVuY3Rpb24gKHRvcEVsZW1lbnQpIHtcbiAgICB2YXIgaW5mbyA9ICcnO1xuICAgIGlmICh0b3BFbGVtZW50KSB7XG4gICAgICB2YXIgbmFtZSA9IGdldERpc3BsYXlOYW1lKHRvcEVsZW1lbnQpO1xuICAgICAgdmFyIG93bmVyID0gdG9wRWxlbWVudC5fb3duZXI7XG4gICAgICBpbmZvICs9IGRlc2NyaWJlQ29tcG9uZW50RnJhbWUobmFtZSwgdG9wRWxlbWVudC5fc291cmNlLCBvd25lciAmJiBvd25lci5nZXROYW1lKCkpO1xuICAgIH1cblxuICAgIHZhciBjdXJyZW50T3duZXIgPSBSZWFjdEN1cnJlbnRPd25lci5jdXJyZW50O1xuICAgIHZhciBpZCA9IGN1cnJlbnRPd25lciAmJiBjdXJyZW50T3duZXIuX2RlYnVnSUQ7XG5cbiAgICBpbmZvICs9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0U3RhY2tBZGRlbmR1bUJ5SUQoaWQpO1xuICAgIHJldHVybiBpbmZvO1xuICB9LFxuICBnZXRTdGFja0FkZGVuZHVtQnlJRDogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIGluZm8gPSAnJztcbiAgICB3aGlsZSAoaWQpIHtcbiAgICAgIGluZm8gKz0gZGVzY3JpYmVJRChpZCk7XG4gICAgICBpZCA9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0UGFyZW50SUQoaWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfSxcbiAgZ2V0Q2hpbGRJRHM6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBpdGVtID0gZ2V0SXRlbShpZCk7XG4gICAgcmV0dXJuIGl0ZW0gPyBpdGVtLmNoaWxkSURzIDogW107XG4gIH0sXG4gIGdldERpc3BsYXlOYW1lOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgZWxlbWVudCA9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0RWxlbWVudChpZCk7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGdldERpc3BsYXlOYW1lKGVsZW1lbnQpO1xuICB9LFxuICBnZXRFbGVtZW50OiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgaXRlbSA9IGdldEl0ZW0oaWQpO1xuICAgIHJldHVybiBpdGVtID8gaXRlbS5lbGVtZW50IDogbnVsbDtcbiAgfSxcbiAgZ2V0T3duZXJJRDogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBSZWFjdENvbXBvbmVudFRyZWVIb29rLmdldEVsZW1lbnQoaWQpO1xuICAgIGlmICghZWxlbWVudCB8fCAhZWxlbWVudC5fb3duZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudC5fb3duZXIuX2RlYnVnSUQ7XG4gIH0sXG4gIGdldFBhcmVudElEOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgaXRlbSA9IGdldEl0ZW0oaWQpO1xuICAgIHJldHVybiBpdGVtID8gaXRlbS5wYXJlbnRJRCA6IG51bGw7XG4gIH0sXG4gIGdldFNvdXJjZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIGl0ZW0gPSBnZXRJdGVtKGlkKTtcbiAgICB2YXIgZWxlbWVudCA9IGl0ZW0gPyBpdGVtLmVsZW1lbnQgOiBudWxsO1xuICAgIHZhciBzb3VyY2UgPSBlbGVtZW50ICE9IG51bGwgPyBlbGVtZW50Ll9zb3VyY2UgOiBudWxsO1xuICAgIHJldHVybiBzb3VyY2U7XG4gIH0sXG4gIGdldFRleHQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBlbGVtZW50ID0gUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRFbGVtZW50KGlkKTtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuICcnICsgZWxlbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9LFxuICBnZXRVcGRhdGVDb3VudDogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIGl0ZW0gPSBnZXRJdGVtKGlkKTtcbiAgICByZXR1cm4gaXRlbSA/IGl0ZW0udXBkYXRlQ291bnQgOiAwO1xuICB9LFxuXG5cbiAgZ2V0Um9vdElEczogZ2V0Um9vdElEcyxcbiAgZ2V0UmVnaXN0ZXJlZElEczogZ2V0SXRlbUlEcyxcblxuICBwdXNoTm9uU3RhbmRhcmRXYXJuaW5nU3RhY2s6IGZ1bmN0aW9uIChpc0NyZWF0aW5nRWxlbWVudCwgY3VycmVudFNvdXJjZSkge1xuICAgIGlmICh0eXBlb2YgY29uc29sZS5yZWFjdFN0YWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHN0YWNrID0gW107XG4gICAgdmFyIGN1cnJlbnRPd25lciA9IFJlYWN0Q3VycmVudE93bmVyLmN1cnJlbnQ7XG4gICAgdmFyIGlkID0gY3VycmVudE93bmVyICYmIGN1cnJlbnRPd25lci5fZGVidWdJRDtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoaXNDcmVhdGluZ0VsZW1lbnQpIHtcbiAgICAgICAgc3RhY2sucHVzaCh7XG4gICAgICAgICAgbmFtZTogaWQgPyBSZWFjdENvbXBvbmVudFRyZWVIb29rLmdldERpc3BsYXlOYW1lKGlkKSA6IG51bGwsXG4gICAgICAgICAgZmlsZU5hbWU6IGN1cnJlbnRTb3VyY2UgPyBjdXJyZW50U291cmNlLmZpbGVOYW1lIDogbnVsbCxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBjdXJyZW50U291cmNlID8gY3VycmVudFNvdXJjZS5saW5lTnVtYmVyIDogbnVsbFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKGlkKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRFbGVtZW50KGlkKTtcbiAgICAgICAgdmFyIHBhcmVudElEID0gUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRQYXJlbnRJRChpZCk7XG4gICAgICAgIHZhciBvd25lcklEID0gUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRPd25lcklEKGlkKTtcbiAgICAgICAgdmFyIG93bmVyTmFtZSA9IG93bmVySUQgPyBSZWFjdENvbXBvbmVudFRyZWVIb29rLmdldERpc3BsYXlOYW1lKG93bmVySUQpIDogbnVsbDtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGVsZW1lbnQgJiYgZWxlbWVudC5fc291cmNlO1xuICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBvd25lck5hbWUsXG4gICAgICAgICAgZmlsZU5hbWU6IHNvdXJjZSA/IHNvdXJjZS5maWxlTmFtZSA6IG51bGwsXG4gICAgICAgICAgbGluZU51bWJlcjogc291cmNlID8gc291cmNlLmxpbmVOdW1iZXIgOiBudWxsXG4gICAgICAgIH0pO1xuICAgICAgICBpZCA9IHBhcmVudElEO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gSW50ZXJuYWwgc3RhdGUgaXMgbWVzc2VkIHVwLlxuICAgICAgLy8gU3RvcCBidWlsZGluZyB0aGUgc3RhY2sgKGl0J3MganVzdCBhIG5pY2UgdG8gaGF2ZSkuXG4gICAgfVxuXG4gICAgY29uc29sZS5yZWFjdFN0YWNrKHN0YWNrKTtcbiAgfSxcbiAgcG9wTm9uU3RhbmRhcmRXYXJuaW5nU3RhY2s6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUucmVhY3RTdGFja0VuZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zb2xlLnJlYWN0U3RhY2tFbmQoKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdENvbXBvbmVudFRyZWVIb29rOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50IG93bmVyLlxuICpcbiAqIFRoZSBjdXJyZW50IG93bmVyIGlzIHRoZSBjb21wb25lbnQgd2hvIHNob3VsZCBvd24gYW55IGNvbXBvbmVudHMgdGhhdCBhcmVcbiAqIGN1cnJlbnRseSBiZWluZyBjb25zdHJ1Y3RlZC5cbiAqL1xudmFyIFJlYWN0Q3VycmVudE93bmVyID0ge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEB0eXBlIHtSZWFjdENvbXBvbmVudH1cbiAgICovXG4gIGN1cnJlbnQ6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RDdXJyZW50T3duZXI7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3RFbGVtZW50ID0gcmVxdWlyZSgnLi9SZWFjdEVsZW1lbnQnKTtcblxuLyoqXG4gKiBDcmVhdGUgYSBmYWN0b3J5IHRoYXQgY3JlYXRlcyBIVE1MIHRhZyBlbGVtZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG52YXIgY3JlYXRlRE9NRmFjdG9yeSA9IFJlYWN0RWxlbWVudC5jcmVhdGVGYWN0b3J5O1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFyIFJlYWN0RWxlbWVudFZhbGlkYXRvciA9IHJlcXVpcmUoJy4vUmVhY3RFbGVtZW50VmFsaWRhdG9yJyk7XG4gIGNyZWF0ZURPTUZhY3RvcnkgPSBSZWFjdEVsZW1lbnRWYWxpZGF0b3IuY3JlYXRlRmFjdG9yeTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFwcGluZyBmcm9tIHN1cHBvcnRlZCBIVE1MIHRhZ3MgdG8gYFJlYWN0RE9NQ29tcG9uZW50YCBjbGFzc2VzLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xudmFyIFJlYWN0RE9NRmFjdG9yaWVzID0ge1xuICBhOiBjcmVhdGVET01GYWN0b3J5KCdhJyksXG4gIGFiYnI6IGNyZWF0ZURPTUZhY3RvcnkoJ2FiYnInKSxcbiAgYWRkcmVzczogY3JlYXRlRE9NRmFjdG9yeSgnYWRkcmVzcycpLFxuICBhcmVhOiBjcmVhdGVET01GYWN0b3J5KCdhcmVhJyksXG4gIGFydGljbGU6IGNyZWF0ZURPTUZhY3RvcnkoJ2FydGljbGUnKSxcbiAgYXNpZGU6IGNyZWF0ZURPTUZhY3RvcnkoJ2FzaWRlJyksXG4gIGF1ZGlvOiBjcmVhdGVET01GYWN0b3J5KCdhdWRpbycpLFxuICBiOiBjcmVhdGVET01GYWN0b3J5KCdiJyksXG4gIGJhc2U6IGNyZWF0ZURPTUZhY3RvcnkoJ2Jhc2UnKSxcbiAgYmRpOiBjcmVhdGVET01GYWN0b3J5KCdiZGknKSxcbiAgYmRvOiBjcmVhdGVET01GYWN0b3J5KCdiZG8nKSxcbiAgYmlnOiBjcmVhdGVET01GYWN0b3J5KCdiaWcnKSxcbiAgYmxvY2txdW90ZTogY3JlYXRlRE9NRmFjdG9yeSgnYmxvY2txdW90ZScpLFxuICBib2R5OiBjcmVhdGVET01GYWN0b3J5KCdib2R5JyksXG4gIGJyOiBjcmVhdGVET01GYWN0b3J5KCdicicpLFxuICBidXR0b246IGNyZWF0ZURPTUZhY3RvcnkoJ2J1dHRvbicpLFxuICBjYW52YXM6IGNyZWF0ZURPTUZhY3RvcnkoJ2NhbnZhcycpLFxuICBjYXB0aW9uOiBjcmVhdGVET01GYWN0b3J5KCdjYXB0aW9uJyksXG4gIGNpdGU6IGNyZWF0ZURPTUZhY3RvcnkoJ2NpdGUnKSxcbiAgY29kZTogY3JlYXRlRE9NRmFjdG9yeSgnY29kZScpLFxuICBjb2w6IGNyZWF0ZURPTUZhY3RvcnkoJ2NvbCcpLFxuICBjb2xncm91cDogY3JlYXRlRE9NRmFjdG9yeSgnY29sZ3JvdXAnKSxcbiAgZGF0YTogY3JlYXRlRE9NRmFjdG9yeSgnZGF0YScpLFxuICBkYXRhbGlzdDogY3JlYXRlRE9NRmFjdG9yeSgnZGF0YWxpc3QnKSxcbiAgZGQ6IGNyZWF0ZURPTUZhY3RvcnkoJ2RkJyksXG4gIGRlbDogY3JlYXRlRE9NRmFjdG9yeSgnZGVsJyksXG4gIGRldGFpbHM6IGNyZWF0ZURPTUZhY3RvcnkoJ2RldGFpbHMnKSxcbiAgZGZuOiBjcmVhdGVET01GYWN0b3J5KCdkZm4nKSxcbiAgZGlhbG9nOiBjcmVhdGVET01GYWN0b3J5KCdkaWFsb2cnKSxcbiAgZGl2OiBjcmVhdGVET01GYWN0b3J5KCdkaXYnKSxcbiAgZGw6IGNyZWF0ZURPTUZhY3RvcnkoJ2RsJyksXG4gIGR0OiBjcmVhdGVET01GYWN0b3J5KCdkdCcpLFxuICBlbTogY3JlYXRlRE9NRmFjdG9yeSgnZW0nKSxcbiAgZW1iZWQ6IGNyZWF0ZURPTUZhY3RvcnkoJ2VtYmVkJyksXG4gIGZpZWxkc2V0OiBjcmVhdGVET01GYWN0b3J5KCdmaWVsZHNldCcpLFxuICBmaWdjYXB0aW9uOiBjcmVhdGVET01GYWN0b3J5KCdmaWdjYXB0aW9uJyksXG4gIGZpZ3VyZTogY3JlYXRlRE9NRmFjdG9yeSgnZmlndXJlJyksXG4gIGZvb3RlcjogY3JlYXRlRE9NRmFjdG9yeSgnZm9vdGVyJyksXG4gIGZvcm06IGNyZWF0ZURPTUZhY3RvcnkoJ2Zvcm0nKSxcbiAgaDE6IGNyZWF0ZURPTUZhY3RvcnkoJ2gxJyksXG4gIGgyOiBjcmVhdGVET01GYWN0b3J5KCdoMicpLFxuICBoMzogY3JlYXRlRE9NRmFjdG9yeSgnaDMnKSxcbiAgaDQ6IGNyZWF0ZURPTUZhY3RvcnkoJ2g0JyksXG4gIGg1OiBjcmVhdGVET01GYWN0b3J5KCdoNScpLFxuICBoNjogY3JlYXRlRE9NRmFjdG9yeSgnaDYnKSxcbiAgaGVhZDogY3JlYXRlRE9NRmFjdG9yeSgnaGVhZCcpLFxuICBoZWFkZXI6IGNyZWF0ZURPTUZhY3RvcnkoJ2hlYWRlcicpLFxuICBoZ3JvdXA6IGNyZWF0ZURPTUZhY3RvcnkoJ2hncm91cCcpLFxuICBocjogY3JlYXRlRE9NRmFjdG9yeSgnaHInKSxcbiAgaHRtbDogY3JlYXRlRE9NRmFjdG9yeSgnaHRtbCcpLFxuICBpOiBjcmVhdGVET01GYWN0b3J5KCdpJyksXG4gIGlmcmFtZTogY3JlYXRlRE9NRmFjdG9yeSgnaWZyYW1lJyksXG4gIGltZzogY3JlYXRlRE9NRmFjdG9yeSgnaW1nJyksXG4gIGlucHV0OiBjcmVhdGVET01GYWN0b3J5KCdpbnB1dCcpLFxuICBpbnM6IGNyZWF0ZURPTUZhY3RvcnkoJ2lucycpLFxuICBrYmQ6IGNyZWF0ZURPTUZhY3RvcnkoJ2tiZCcpLFxuICBrZXlnZW46IGNyZWF0ZURPTUZhY3RvcnkoJ2tleWdlbicpLFxuICBsYWJlbDogY3JlYXRlRE9NRmFjdG9yeSgnbGFiZWwnKSxcbiAgbGVnZW5kOiBjcmVhdGVET01GYWN0b3J5KCdsZWdlbmQnKSxcbiAgbGk6IGNyZWF0ZURPTUZhY3RvcnkoJ2xpJyksXG4gIGxpbms6IGNyZWF0ZURPTUZhY3RvcnkoJ2xpbmsnKSxcbiAgbWFpbjogY3JlYXRlRE9NRmFjdG9yeSgnbWFpbicpLFxuICBtYXA6IGNyZWF0ZURPTUZhY3RvcnkoJ21hcCcpLFxuICBtYXJrOiBjcmVhdGVET01GYWN0b3J5KCdtYXJrJyksXG4gIG1lbnU6IGNyZWF0ZURPTUZhY3RvcnkoJ21lbnUnKSxcbiAgbWVudWl0ZW06IGNyZWF0ZURPTUZhY3RvcnkoJ21lbnVpdGVtJyksXG4gIG1ldGE6IGNyZWF0ZURPTUZhY3RvcnkoJ21ldGEnKSxcbiAgbWV0ZXI6IGNyZWF0ZURPTUZhY3RvcnkoJ21ldGVyJyksXG4gIG5hdjogY3JlYXRlRE9NRmFjdG9yeSgnbmF2JyksXG4gIG5vc2NyaXB0OiBjcmVhdGVET01GYWN0b3J5KCdub3NjcmlwdCcpLFxuICBvYmplY3Q6IGNyZWF0ZURPTUZhY3RvcnkoJ29iamVjdCcpLFxuICBvbDogY3JlYXRlRE9NRmFjdG9yeSgnb2wnKSxcbiAgb3B0Z3JvdXA6IGNyZWF0ZURPTUZhY3RvcnkoJ29wdGdyb3VwJyksXG4gIG9wdGlvbjogY3JlYXRlRE9NRmFjdG9yeSgnb3B0aW9uJyksXG4gIG91dHB1dDogY3JlYXRlRE9NRmFjdG9yeSgnb3V0cHV0JyksXG4gIHA6IGNyZWF0ZURPTUZhY3RvcnkoJ3AnKSxcbiAgcGFyYW06IGNyZWF0ZURPTUZhY3RvcnkoJ3BhcmFtJyksXG4gIHBpY3R1cmU6IGNyZWF0ZURPTUZhY3RvcnkoJ3BpY3R1cmUnKSxcbiAgcHJlOiBjcmVhdGVET01GYWN0b3J5KCdwcmUnKSxcbiAgcHJvZ3Jlc3M6IGNyZWF0ZURPTUZhY3RvcnkoJ3Byb2dyZXNzJyksXG4gIHE6IGNyZWF0ZURPTUZhY3RvcnkoJ3EnKSxcbiAgcnA6IGNyZWF0ZURPTUZhY3RvcnkoJ3JwJyksXG4gIHJ0OiBjcmVhdGVET01GYWN0b3J5KCdydCcpLFxuICBydWJ5OiBjcmVhdGVET01GYWN0b3J5KCdydWJ5JyksXG4gIHM6IGNyZWF0ZURPTUZhY3RvcnkoJ3MnKSxcbiAgc2FtcDogY3JlYXRlRE9NRmFjdG9yeSgnc2FtcCcpLFxuICBzY3JpcHQ6IGNyZWF0ZURPTUZhY3RvcnkoJ3NjcmlwdCcpLFxuICBzZWN0aW9uOiBjcmVhdGVET01GYWN0b3J5KCdzZWN0aW9uJyksXG4gIHNlbGVjdDogY3JlYXRlRE9NRmFjdG9yeSgnc2VsZWN0JyksXG4gIHNtYWxsOiBjcmVhdGVET01GYWN0b3J5KCdzbWFsbCcpLFxuICBzb3VyY2U6IGNyZWF0ZURPTUZhY3RvcnkoJ3NvdXJjZScpLFxuICBzcGFuOiBjcmVhdGVET01GYWN0b3J5KCdzcGFuJyksXG4gIHN0cm9uZzogY3JlYXRlRE9NRmFjdG9yeSgnc3Ryb25nJyksXG4gIHN0eWxlOiBjcmVhdGVET01GYWN0b3J5KCdzdHlsZScpLFxuICBzdWI6IGNyZWF0ZURPTUZhY3RvcnkoJ3N1YicpLFxuICBzdW1tYXJ5OiBjcmVhdGVET01GYWN0b3J5KCdzdW1tYXJ5JyksXG4gIHN1cDogY3JlYXRlRE9NRmFjdG9yeSgnc3VwJyksXG4gIHRhYmxlOiBjcmVhdGVET01GYWN0b3J5KCd0YWJsZScpLFxuICB0Ym9keTogY3JlYXRlRE9NRmFjdG9yeSgndGJvZHknKSxcbiAgdGQ6IGNyZWF0ZURPTUZhY3RvcnkoJ3RkJyksXG4gIHRleHRhcmVhOiBjcmVhdGVET01GYWN0b3J5KCd0ZXh0YXJlYScpLFxuICB0Zm9vdDogY3JlYXRlRE9NRmFjdG9yeSgndGZvb3QnKSxcbiAgdGg6IGNyZWF0ZURPTUZhY3RvcnkoJ3RoJyksXG4gIHRoZWFkOiBjcmVhdGVET01GYWN0b3J5KCd0aGVhZCcpLFxuICB0aW1lOiBjcmVhdGVET01GYWN0b3J5KCd0aW1lJyksXG4gIHRpdGxlOiBjcmVhdGVET01GYWN0b3J5KCd0aXRsZScpLFxuICB0cjogY3JlYXRlRE9NRmFjdG9yeSgndHInKSxcbiAgdHJhY2s6IGNyZWF0ZURPTUZhY3RvcnkoJ3RyYWNrJyksXG4gIHU6IGNyZWF0ZURPTUZhY3RvcnkoJ3UnKSxcbiAgdWw6IGNyZWF0ZURPTUZhY3RvcnkoJ3VsJyksXG4gICd2YXInOiBjcmVhdGVET01GYWN0b3J5KCd2YXInKSxcbiAgdmlkZW86IGNyZWF0ZURPTUZhY3RvcnkoJ3ZpZGVvJyksXG4gIHdicjogY3JlYXRlRE9NRmFjdG9yeSgnd2JyJyksXG5cbiAgLy8gU1ZHXG4gIGNpcmNsZTogY3JlYXRlRE9NRmFjdG9yeSgnY2lyY2xlJyksXG4gIGNsaXBQYXRoOiBjcmVhdGVET01GYWN0b3J5KCdjbGlwUGF0aCcpLFxuICBkZWZzOiBjcmVhdGVET01GYWN0b3J5KCdkZWZzJyksXG4gIGVsbGlwc2U6IGNyZWF0ZURPTUZhY3RvcnkoJ2VsbGlwc2UnKSxcbiAgZzogY3JlYXRlRE9NRmFjdG9yeSgnZycpLFxuICBpbWFnZTogY3JlYXRlRE9NRmFjdG9yeSgnaW1hZ2UnKSxcbiAgbGluZTogY3JlYXRlRE9NRmFjdG9yeSgnbGluZScpLFxuICBsaW5lYXJHcmFkaWVudDogY3JlYXRlRE9NRmFjdG9yeSgnbGluZWFyR3JhZGllbnQnKSxcbiAgbWFzazogY3JlYXRlRE9NRmFjdG9yeSgnbWFzaycpLFxuICBwYXRoOiBjcmVhdGVET01GYWN0b3J5KCdwYXRoJyksXG4gIHBhdHRlcm46IGNyZWF0ZURPTUZhY3RvcnkoJ3BhdHRlcm4nKSxcbiAgcG9seWdvbjogY3JlYXRlRE9NRmFjdG9yeSgncG9seWdvbicpLFxuICBwb2x5bGluZTogY3JlYXRlRE9NRmFjdG9yeSgncG9seWxpbmUnKSxcbiAgcmFkaWFsR3JhZGllbnQ6IGNyZWF0ZURPTUZhY3RvcnkoJ3JhZGlhbEdyYWRpZW50JyksXG4gIHJlY3Q6IGNyZWF0ZURPTUZhY3RvcnkoJ3JlY3QnKSxcbiAgc3RvcDogY3JlYXRlRE9NRmFjdG9yeSgnc3RvcCcpLFxuICBzdmc6IGNyZWF0ZURPTUZhY3RvcnkoJ3N2ZycpLFxuICB0ZXh0OiBjcmVhdGVET01GYWN0b3J5KCd0ZXh0JyksXG4gIHRzcGFuOiBjcmVhdGVET01GYWN0b3J5KCd0c3BhbicpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0RE9NRmFjdG9yaWVzOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9hc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBSZWFjdEN1cnJlbnRPd25lciA9IHJlcXVpcmUoJy4vUmVhY3RDdXJyZW50T3duZXInKTtcblxudmFyIHdhcm5pbmcgPSByZXF1aXJlKCdmYmpzL2xpYi93YXJuaW5nJyk7XG52YXIgY2FuRGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKCcuL2NhbkRlZmluZVByb3BlcnR5Jyk7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgUkVBQ1RfRUxFTUVOVF9UWVBFID0gcmVxdWlyZSgnLi9SZWFjdEVsZW1lbnRTeW1ib2wnKTtcblxudmFyIFJFU0VSVkVEX1BST1BTID0ge1xuICBrZXk6IHRydWUsXG4gIHJlZjogdHJ1ZSxcbiAgX19zZWxmOiB0cnVlLFxuICBfX3NvdXJjZTogdHJ1ZVxufTtcblxudmFyIHNwZWNpYWxQcm9wS2V5V2FybmluZ1Nob3duLCBzcGVjaWFsUHJvcFJlZldhcm5pbmdTaG93bjtcblxuZnVuY3Rpb24gaGFzVmFsaWRSZWYoY29uZmlnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoY29uZmlnLCAncmVmJykpIHtcbiAgICAgIHZhciBnZXR0ZXIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNvbmZpZywgJ3JlZicpLmdldDtcbiAgICAgIGlmIChnZXR0ZXIgJiYgZ2V0dGVyLmlzUmVhY3RXYXJuaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbmZpZy5yZWYgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaGFzVmFsaWRLZXkoY29uZmlnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoY29uZmlnLCAna2V5JykpIHtcbiAgICAgIHZhciBnZXR0ZXIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNvbmZpZywgJ2tleScpLmdldDtcbiAgICAgIGlmIChnZXR0ZXIgJiYgZ2V0dGVyLmlzUmVhY3RXYXJuaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbmZpZy5rZXkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZGVmaW5lS2V5UHJvcFdhcm5pbmdHZXR0ZXIocHJvcHMsIGRpc3BsYXlOYW1lKSB7XG4gIHZhciB3YXJuQWJvdXRBY2Nlc3NpbmdLZXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFzcGVjaWFsUHJvcEtleVdhcm5pbmdTaG93bikge1xuICAgICAgc3BlY2lhbFByb3BLZXlXYXJuaW5nU2hvd24gPSB0cnVlO1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IHdhcm5pbmcoZmFsc2UsICclczogYGtleWAgaXMgbm90IGEgcHJvcC4gVHJ5aW5nIHRvIGFjY2VzcyBpdCB3aWxsIHJlc3VsdCAnICsgJ2luIGB1bmRlZmluZWRgIGJlaW5nIHJldHVybmVkLiBJZiB5b3UgbmVlZCB0byBhY2Nlc3MgdGhlIHNhbWUgJyArICd2YWx1ZSB3aXRoaW4gdGhlIGNoaWxkIGNvbXBvbmVudCwgeW91IHNob3VsZCBwYXNzIGl0IGFzIGEgZGlmZmVyZW50ICcgKyAncHJvcC4gKGh0dHBzOi8vZmIubWUvcmVhY3Qtc3BlY2lhbC1wcm9wcyknLCBkaXNwbGF5TmFtZSkgOiB2b2lkIDA7XG4gICAgfVxuICB9O1xuICB3YXJuQWJvdXRBY2Nlc3NpbmdLZXkuaXNSZWFjdFdhcm5pbmcgPSB0cnVlO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvcHMsICdrZXknLCB7XG4gICAgZ2V0OiB3YXJuQWJvdXRBY2Nlc3NpbmdLZXksXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBkZWZpbmVSZWZQcm9wV2FybmluZ0dldHRlcihwcm9wcywgZGlzcGxheU5hbWUpIHtcbiAgdmFyIHdhcm5BYm91dEFjY2Vzc2luZ1JlZiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXNwZWNpYWxQcm9wUmVmV2FybmluZ1Nob3duKSB7XG4gICAgICBzcGVjaWFsUHJvcFJlZldhcm5pbmdTaG93biA9IHRydWU7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gd2FybmluZyhmYWxzZSwgJyVzOiBgcmVmYCBpcyBub3QgYSBwcm9wLiBUcnlpbmcgdG8gYWNjZXNzIGl0IHdpbGwgcmVzdWx0ICcgKyAnaW4gYHVuZGVmaW5lZGAgYmVpbmcgcmV0dXJuZWQuIElmIHlvdSBuZWVkIHRvIGFjY2VzcyB0aGUgc2FtZSAnICsgJ3ZhbHVlIHdpdGhpbiB0aGUgY2hpbGQgY29tcG9uZW50LCB5b3Ugc2hvdWxkIHBhc3MgaXQgYXMgYSBkaWZmZXJlbnQgJyArICdwcm9wLiAoaHR0cHM6Ly9mYi5tZS9yZWFjdC1zcGVjaWFsLXByb3BzKScsIGRpc3BsYXlOYW1lKSA6IHZvaWQgMDtcbiAgICB9XG4gIH07XG4gIHdhcm5BYm91dEFjY2Vzc2luZ1JlZi5pc1JlYWN0V2FybmluZyA9IHRydWU7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm9wcywgJ3JlZicsIHtcbiAgICBnZXQ6IHdhcm5BYm91dEFjY2Vzc2luZ1JlZixcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59XG5cbi8qKlxuICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGEgbmV3IFJlYWN0IGVsZW1lbnQuIFRoaXMgbm8gbG9uZ2VyIGFkaGVyZXMgdG9cbiAqIHRoZSBjbGFzcyBwYXR0ZXJuLCBzbyBkbyBub3QgdXNlIG5ldyB0byBjYWxsIGl0LiBBbHNvLCBubyBpbnN0YW5jZW9mIGNoZWNrXG4gKiB3aWxsIHdvcmsuIEluc3RlYWQgdGVzdCAkJHR5cGVvZiBmaWVsZCBhZ2FpbnN0IFN5bWJvbC5mb3IoJ3JlYWN0LmVsZW1lbnQnKSB0byBjaGVja1xuICogaWYgc29tZXRoaW5nIGlzIGEgUmVhY3QgRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0geyp9IHR5cGVcbiAqIEBwYXJhbSB7Kn0ga2V5XG4gKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHJlZlxuICogQHBhcmFtIHsqfSBzZWxmIEEgKnRlbXBvcmFyeSogaGVscGVyIHRvIGRldGVjdCBwbGFjZXMgd2hlcmUgYHRoaXNgIGlzXG4gKiBkaWZmZXJlbnQgZnJvbSB0aGUgYG93bmVyYCB3aGVuIFJlYWN0LmNyZWF0ZUVsZW1lbnQgaXMgY2FsbGVkLCBzbyB0aGF0IHdlXG4gKiBjYW4gd2Fybi4gV2Ugd2FudCB0byBnZXQgcmlkIG9mIG93bmVyIGFuZCByZXBsYWNlIHN0cmluZyBgcmVmYHMgd2l0aCBhcnJvd1xuICogZnVuY3Rpb25zLCBhbmQgYXMgbG9uZyBhcyBgdGhpc2AgYW5kIG93bmVyIGFyZSB0aGUgc2FtZSwgdGhlcmUgd2lsbCBiZSBub1xuICogY2hhbmdlIGluIGJlaGF2aW9yLlxuICogQHBhcmFtIHsqfSBzb3VyY2UgQW4gYW5ub3RhdGlvbiBvYmplY3QgKGFkZGVkIGJ5IGEgdHJhbnNwaWxlciBvciBvdGhlcndpc2UpXG4gKiBpbmRpY2F0aW5nIGZpbGVuYW1lLCBsaW5lIG51bWJlciwgYW5kL29yIG90aGVyIGluZm9ybWF0aW9uLlxuICogQHBhcmFtIHsqfSBvd25lclxuICogQHBhcmFtIHsqfSBwcm9wc1xuICogQGludGVybmFsXG4gKi9cbnZhciBSZWFjdEVsZW1lbnQgPSBmdW5jdGlvbiAodHlwZSwga2V5LCByZWYsIHNlbGYsIHNvdXJjZSwgb3duZXIsIHByb3BzKSB7XG4gIHZhciBlbGVtZW50ID0ge1xuICAgIC8vIFRoaXMgdGFnIGFsbG93IHVzIHRvIHVuaXF1ZWx5IGlkZW50aWZ5IHRoaXMgYXMgYSBSZWFjdCBFbGVtZW50XG4gICAgJCR0eXBlb2Y6IFJFQUNUX0VMRU1FTlRfVFlQRSxcblxuICAgIC8vIEJ1aWx0LWluIHByb3BlcnRpZXMgdGhhdCBiZWxvbmcgb24gdGhlIGVsZW1lbnRcbiAgICB0eXBlOiB0eXBlLFxuICAgIGtleToga2V5LFxuICAgIHJlZjogcmVmLFxuICAgIHByb3BzOiBwcm9wcyxcblxuICAgIC8vIFJlY29yZCB0aGUgY29tcG9uZW50IHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyB0aGlzIGVsZW1lbnQuXG4gICAgX293bmVyOiBvd25lclxuICB9O1xuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgLy8gVGhlIHZhbGlkYXRpb24gZmxhZyBpcyBjdXJyZW50bHkgbXV0YXRpdmUuIFdlIHB1dCBpdCBvblxuICAgIC8vIGFuIGV4dGVybmFsIGJhY2tpbmcgc3RvcmUgc28gdGhhdCB3ZSBjYW4gZnJlZXplIHRoZSB3aG9sZSBvYmplY3QuXG4gICAgLy8gVGhpcyBjYW4gYmUgcmVwbGFjZWQgd2l0aCBhIFdlYWtNYXAgb25jZSB0aGV5IGFyZSBpbXBsZW1lbnRlZCBpblxuICAgIC8vIGNvbW1vbmx5IHVzZWQgZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnRzLlxuICAgIGVsZW1lbnQuX3N0b3JlID0ge307XG5cbiAgICAvLyBUbyBtYWtlIGNvbXBhcmluZyBSZWFjdEVsZW1lbnRzIGVhc2llciBmb3IgdGVzdGluZyBwdXJwb3Nlcywgd2UgbWFrZVxuICAgIC8vIHRoZSB2YWxpZGF0aW9uIGZsYWcgbm9uLWVudW1lcmFibGUgKHdoZXJlIHBvc3NpYmxlLCB3aGljaCBzaG91bGRcbiAgICAvLyBpbmNsdWRlIGV2ZXJ5IGVudmlyb25tZW50IHdlIHJ1biB0ZXN0cyBpbiksIHNvIHRoZSB0ZXN0IGZyYW1ld29ya1xuICAgIC8vIGlnbm9yZXMgaXQuXG4gICAgaWYgKGNhbkRlZmluZVByb3BlcnR5KSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudC5fc3RvcmUsICd2YWxpZGF0ZWQnLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIC8vIHNlbGYgYW5kIHNvdXJjZSBhcmUgREVWIG9ubHkgcHJvcGVydGllcy5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAnX3NlbGYnLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBzZWxmXG4gICAgICB9KTtcbiAgICAgIC8vIFR3byBlbGVtZW50cyBjcmVhdGVkIGluIHR3byBkaWZmZXJlbnQgcGxhY2VzIHNob3VsZCBiZSBjb25zaWRlcmVkXG4gICAgICAvLyBlcXVhbCBmb3IgdGVzdGluZyBwdXJwb3NlcyBhbmQgdGhlcmVmb3JlIHdlIGhpZGUgaXQgZnJvbSBlbnVtZXJhdGlvbi5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAnX3NvdXJjZScsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IHNvdXJjZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuX3N0b3JlLnZhbGlkYXRlZCA9IGZhbHNlO1xuICAgICAgZWxlbWVudC5fc2VsZiA9IHNlbGY7XG4gICAgICBlbGVtZW50Ll9zb3VyY2UgPSBzb3VyY2U7XG4gICAgfVxuICAgIGlmIChPYmplY3QuZnJlZXplKSB7XG4gICAgICBPYmplY3QuZnJlZXplKGVsZW1lbnQucHJvcHMpO1xuICAgICAgT2JqZWN0LmZyZWV6ZShlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZWxlbWVudDtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGFuZCByZXR1cm4gYSBuZXcgUmVhY3RFbGVtZW50IG9mIHRoZSBnaXZlbiB0eXBlLlxuICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvdG9wLWxldmVsLWFwaS5odG1sI3JlYWN0LmNyZWF0ZWVsZW1lbnRcbiAqL1xuUmVhY3RFbGVtZW50LmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAodHlwZSwgY29uZmlnLCBjaGlsZHJlbikge1xuICB2YXIgcHJvcE5hbWU7XG5cbiAgLy8gUmVzZXJ2ZWQgbmFtZXMgYXJlIGV4dHJhY3RlZFxuICB2YXIgcHJvcHMgPSB7fTtcblxuICB2YXIga2V5ID0gbnVsbDtcbiAgdmFyIHJlZiA9IG51bGw7XG4gIHZhciBzZWxmID0gbnVsbDtcbiAgdmFyIHNvdXJjZSA9IG51bGw7XG5cbiAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgaWYgKGhhc1ZhbGlkUmVmKGNvbmZpZykpIHtcbiAgICAgIHJlZiA9IGNvbmZpZy5yZWY7XG4gICAgfVxuICAgIGlmIChoYXNWYWxpZEtleShjb25maWcpKSB7XG4gICAgICBrZXkgPSAnJyArIGNvbmZpZy5rZXk7XG4gICAgfVxuXG4gICAgc2VsZiA9IGNvbmZpZy5fX3NlbGYgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBjb25maWcuX19zZWxmO1xuICAgIHNvdXJjZSA9IGNvbmZpZy5fX3NvdXJjZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGNvbmZpZy5fX3NvdXJjZTtcbiAgICAvLyBSZW1haW5pbmcgcHJvcGVydGllcyBhcmUgYWRkZWQgdG8gYSBuZXcgcHJvcHMgb2JqZWN0XG4gICAgZm9yIChwcm9wTmFtZSBpbiBjb25maWcpIHtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGNvbmZpZywgcHJvcE5hbWUpICYmICFSRVNFUlZFRF9QUk9QUy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gY29uZmlnW3Byb3BOYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDaGlsZHJlbiBjYW4gYmUgbW9yZSB0aGFuIG9uZSBhcmd1bWVudCwgYW5kIHRob3NlIGFyZSB0cmFuc2ZlcnJlZCBvbnRvXG4gIC8vIHRoZSBuZXdseSBhbGxvY2F0ZWQgcHJvcHMgb2JqZWN0LlxuICB2YXIgY2hpbGRyZW5MZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoIC0gMjtcbiAgaWYgKGNoaWxkcmVuTGVuZ3RoID09PSAxKSB7XG4gICAgcHJvcHMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfSBlbHNlIGlmIChjaGlsZHJlbkxlbmd0aCA+IDEpIHtcbiAgICB2YXIgY2hpbGRBcnJheSA9IEFycmF5KGNoaWxkcmVuTGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuTGVuZ3RoOyBpKyspIHtcbiAgICAgIGNoaWxkQXJyYXlbaV0gPSBhcmd1bWVudHNbaSArIDJdO1xuICAgIH1cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgaWYgKE9iamVjdC5mcmVlemUpIHtcbiAgICAgICAgT2JqZWN0LmZyZWV6ZShjaGlsZEFycmF5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcHJvcHMuY2hpbGRyZW4gPSBjaGlsZEFycmF5O1xuICB9XG5cbiAgLy8gUmVzb2x2ZSBkZWZhdWx0IHByb3BzXG4gIGlmICh0eXBlICYmIHR5cGUuZGVmYXVsdFByb3BzKSB7XG4gICAgdmFyIGRlZmF1bHRQcm9wcyA9IHR5cGUuZGVmYXVsdFByb3BzO1xuICAgIGZvciAocHJvcE5hbWUgaW4gZGVmYXVsdFByb3BzKSB7XG4gICAgICBpZiAocHJvcHNbcHJvcE5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gZGVmYXVsdFByb3BzW3Byb3BOYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpZiAoa2V5IHx8IHJlZikge1xuICAgICAgaWYgKHR5cGVvZiBwcm9wcy4kJHR5cGVvZiA9PT0gJ3VuZGVmaW5lZCcgfHwgcHJvcHMuJCR0eXBlb2YgIT09IFJFQUNUX0VMRU1FTlRfVFlQRSkge1xuICAgICAgICB2YXIgZGlzcGxheU5hbWUgPSB0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJyA/IHR5cGUuZGlzcGxheU5hbWUgfHwgdHlwZS5uYW1lIHx8ICdVbmtub3duJyA6IHR5cGU7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICBkZWZpbmVLZXlQcm9wV2FybmluZ0dldHRlcihwcm9wcywgZGlzcGxheU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgICBkZWZpbmVSZWZQcm9wV2FybmluZ0dldHRlcihwcm9wcywgZGlzcGxheU5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBSZWFjdEVsZW1lbnQodHlwZSwga2V5LCByZWYsIHNlbGYsIHNvdXJjZSwgUmVhY3RDdXJyZW50T3duZXIuY3VycmVudCwgcHJvcHMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHByb2R1Y2VzIFJlYWN0RWxlbWVudHMgb2YgYSBnaXZlbiB0eXBlLlxuICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvdG9wLWxldmVsLWFwaS5odG1sI3JlYWN0LmNyZWF0ZWZhY3RvcnlcbiAqL1xuUmVhY3RFbGVtZW50LmNyZWF0ZUZhY3RvcnkgPSBmdW5jdGlvbiAodHlwZSkge1xuICB2YXIgZmFjdG9yeSA9IFJlYWN0RWxlbWVudC5jcmVhdGVFbGVtZW50LmJpbmQobnVsbCwgdHlwZSk7XG4gIC8vIEV4cG9zZSB0aGUgdHlwZSBvbiB0aGUgZmFjdG9yeSBhbmQgdGhlIHByb3RvdHlwZSBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyBlYXNpbHkgYWNjZXNzZWQgb24gZWxlbWVudHMuIEUuZy4gYDxGb28gLz4udHlwZSA9PT0gRm9vYC5cbiAgLy8gVGhpcyBzaG91bGQgbm90IGJlIG5hbWVkIGBjb25zdHJ1Y3RvcmAgc2luY2UgdGhpcyBtYXkgbm90IGJlIHRoZSBmdW5jdGlvblxuICAvLyB0aGF0IGNyZWF0ZWQgdGhlIGVsZW1lbnQsIGFuZCBpdCBtYXkgbm90IGV2ZW4gYmUgYSBjb25zdHJ1Y3Rvci5cbiAgLy8gTGVnYWN5IGhvb2sgVE9ETzogV2FybiBpZiB0aGlzIGlzIGFjY2Vzc2VkXG4gIGZhY3RvcnkudHlwZSA9IHR5cGU7XG4gIHJldHVybiBmYWN0b3J5O1xufTtcblxuUmVhY3RFbGVtZW50LmNsb25lQW5kUmVwbGFjZUtleSA9IGZ1bmN0aW9uIChvbGRFbGVtZW50LCBuZXdLZXkpIHtcbiAgdmFyIG5ld0VsZW1lbnQgPSBSZWFjdEVsZW1lbnQob2xkRWxlbWVudC50eXBlLCBuZXdLZXksIG9sZEVsZW1lbnQucmVmLCBvbGRFbGVtZW50Ll9zZWxmLCBvbGRFbGVtZW50Ll9zb3VyY2UsIG9sZEVsZW1lbnQuX293bmVyLCBvbGRFbGVtZW50LnByb3BzKTtcblxuICByZXR1cm4gbmV3RWxlbWVudDtcbn07XG5cbi8qKlxuICogQ2xvbmUgYW5kIHJldHVybiBhIG5ldyBSZWFjdEVsZW1lbnQgdXNpbmcgZWxlbWVudCBhcyB0aGUgc3RhcnRpbmcgcG9pbnQuXG4gKiBTZWUgaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy90b3AtbGV2ZWwtYXBpLmh0bWwjcmVhY3QuY2xvbmVlbGVtZW50XG4gKi9cblJlYWN0RWxlbWVudC5jbG9uZUVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCwgY29uZmlnLCBjaGlsZHJlbikge1xuICB2YXIgcHJvcE5hbWU7XG5cbiAgLy8gT3JpZ2luYWwgcHJvcHMgYXJlIGNvcGllZFxuICB2YXIgcHJvcHMgPSBfYXNzaWduKHt9LCBlbGVtZW50LnByb3BzKTtcblxuICAvLyBSZXNlcnZlZCBuYW1lcyBhcmUgZXh0cmFjdGVkXG4gIHZhciBrZXkgPSBlbGVtZW50LmtleTtcbiAgdmFyIHJlZiA9IGVsZW1lbnQucmVmO1xuICAvLyBTZWxmIGlzIHByZXNlcnZlZCBzaW5jZSB0aGUgb3duZXIgaXMgcHJlc2VydmVkLlxuICB2YXIgc2VsZiA9IGVsZW1lbnQuX3NlbGY7XG4gIC8vIFNvdXJjZSBpcyBwcmVzZXJ2ZWQgc2luY2UgY2xvbmVFbGVtZW50IGlzIHVubGlrZWx5IHRvIGJlIHRhcmdldGVkIGJ5IGFcbiAgLy8gdHJhbnNwaWxlciwgYW5kIHRoZSBvcmlnaW5hbCBzb3VyY2UgaXMgcHJvYmFibHkgYSBiZXR0ZXIgaW5kaWNhdG9yIG9mIHRoZVxuICAvLyB0cnVlIG93bmVyLlxuICB2YXIgc291cmNlID0gZWxlbWVudC5fc291cmNlO1xuXG4gIC8vIE93bmVyIHdpbGwgYmUgcHJlc2VydmVkLCB1bmxlc3MgcmVmIGlzIG92ZXJyaWRkZW5cbiAgdmFyIG93bmVyID0gZWxlbWVudC5fb3duZXI7XG5cbiAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgaWYgKGhhc1ZhbGlkUmVmKGNvbmZpZykpIHtcbiAgICAgIC8vIFNpbGVudGx5IHN0ZWFsIHRoZSByZWYgZnJvbSB0aGUgcGFyZW50LlxuICAgICAgcmVmID0gY29uZmlnLnJlZjtcbiAgICAgIG93bmVyID0gUmVhY3RDdXJyZW50T3duZXIuY3VycmVudDtcbiAgICB9XG4gICAgaWYgKGhhc1ZhbGlkS2V5KGNvbmZpZykpIHtcbiAgICAgIGtleSA9ICcnICsgY29uZmlnLmtleTtcbiAgICB9XG5cbiAgICAvLyBSZW1haW5pbmcgcHJvcGVydGllcyBvdmVycmlkZSBleGlzdGluZyBwcm9wc1xuICAgIHZhciBkZWZhdWx0UHJvcHM7XG4gICAgaWYgKGVsZW1lbnQudHlwZSAmJiBlbGVtZW50LnR5cGUuZGVmYXVsdFByb3BzKSB7XG4gICAgICBkZWZhdWx0UHJvcHMgPSBlbGVtZW50LnR5cGUuZGVmYXVsdFByb3BzO1xuICAgIH1cbiAgICBmb3IgKHByb3BOYW1lIGluIGNvbmZpZykge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoY29uZmlnLCBwcm9wTmFtZSkgJiYgIVJFU0VSVkVEX1BST1BTLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICBpZiAoY29uZmlnW3Byb3BOYW1lXSA9PT0gdW5kZWZpbmVkICYmIGRlZmF1bHRQcm9wcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gUmVzb2x2ZSBkZWZhdWx0IHByb3BzXG4gICAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gZGVmYXVsdFByb3BzW3Byb3BOYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9wc1twcm9wTmFtZV0gPSBjb25maWdbcHJvcE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hpbGRyZW4gY2FuIGJlIG1vcmUgdGhhbiBvbmUgYXJndW1lbnQsIGFuZCB0aG9zZSBhcmUgdHJhbnNmZXJyZWQgb250b1xuICAvLyB0aGUgbmV3bHkgYWxsb2NhdGVkIHByb3BzIG9iamVjdC5cbiAgdmFyIGNoaWxkcmVuTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCAtIDI7XG4gIGlmIChjaGlsZHJlbkxlbmd0aCA9PT0gMSkge1xuICAgIHByb3BzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH0gZWxzZSBpZiAoY2hpbGRyZW5MZW5ndGggPiAxKSB7XG4gICAgdmFyIGNoaWxkQXJyYXkgPSBBcnJheShjaGlsZHJlbkxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbkxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGlsZEFycmF5W2ldID0gYXJndW1lbnRzW2kgKyAyXTtcbiAgICB9XG4gICAgcHJvcHMuY2hpbGRyZW4gPSBjaGlsZEFycmF5O1xuICB9XG5cbiAgcmV0dXJuIFJlYWN0RWxlbWVudChlbGVtZW50LnR5cGUsIGtleSwgcmVmLCBzZWxmLCBzb3VyY2UsIG93bmVyLCBwcm9wcyk7XG59O1xuXG4vKipcbiAqIFZlcmlmaWVzIHRoZSBvYmplY3QgaXMgYSBSZWFjdEVsZW1lbnQuXG4gKiBTZWUgaHR0cHM6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy90b3AtbGV2ZWwtYXBpLmh0bWwjcmVhY3QuaXN2YWxpZGVsZW1lbnRcbiAqIEBwYXJhbSB7P29iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGBvYmplY3RgIGlzIGEgdmFsaWQgY29tcG9uZW50LlxuICogQGZpbmFsXG4gKi9cblJlYWN0RWxlbWVudC5pc1ZhbGlkRWxlbWVudCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdCAhPT0gbnVsbCAmJiBvYmplY3QuJCR0eXBlb2YgPT09IFJFQUNUX0VMRU1FTlRfVFlQRTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RFbGVtZW50OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBUaGUgU3ltYm9sIHVzZWQgdG8gdGFnIHRoZSBSZWFjdEVsZW1lbnQgdHlwZS4gSWYgdGhlcmUgaXMgbm8gbmF0aXZlIFN5bWJvbFxuLy8gbm9yIHBvbHlmaWxsLCB0aGVuIGEgcGxhaW4gbnVtYmVyIGlzIHVzZWQgZm9yIHBlcmZvcm1hbmNlLlxuXG52YXIgUkVBQ1RfRUxFTUVOVF9UWVBFID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBTeW1ib2xbJ2ZvciddICYmIFN5bWJvbFsnZm9yJ10oJ3JlYWN0LmVsZW1lbnQnKSB8fCAweGVhYzc7XG5cbm1vZHVsZS5leHBvcnRzID0gUkVBQ1RfRUxFTUVOVF9UWVBFOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbi8qKlxuICogUmVhY3RFbGVtZW50VmFsaWRhdG9yIHByb3ZpZGVzIGEgd3JhcHBlciBhcm91bmQgYSBlbGVtZW50IGZhY3RvcnlcbiAqIHdoaWNoIHZhbGlkYXRlcyB0aGUgcHJvcHMgcGFzc2VkIHRvIHRoZSBlbGVtZW50LiBUaGlzIGlzIGludGVuZGVkIHRvIGJlXG4gKiB1c2VkIG9ubHkgaW4gREVWIGFuZCBjb3VsZCBiZSByZXBsYWNlZCBieSBhIHN0YXRpYyB0eXBlIGNoZWNrZXIgZm9yIGxhbmd1YWdlc1xuICogdGhhdCBzdXBwb3J0IGl0LlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0Q3VycmVudE93bmVyID0gcmVxdWlyZSgnLi9SZWFjdEN1cnJlbnRPd25lcicpO1xudmFyIFJlYWN0Q29tcG9uZW50VHJlZUhvb2sgPSByZXF1aXJlKCcuL1JlYWN0Q29tcG9uZW50VHJlZUhvb2snKTtcbnZhciBSZWFjdEVsZW1lbnQgPSByZXF1aXJlKCcuL1JlYWN0RWxlbWVudCcpO1xuXG52YXIgY2hlY2tSZWFjdFR5cGVTcGVjID0gcmVxdWlyZSgnLi9jaGVja1JlYWN0VHlwZVNwZWMnKTtcblxudmFyIGNhbkRlZmluZVByb3BlcnR5ID0gcmVxdWlyZSgnLi9jYW5EZWZpbmVQcm9wZXJ0eScpO1xudmFyIGdldEl0ZXJhdG9yRm4gPSByZXF1aXJlKCcuL2dldEl0ZXJhdG9yRm4nKTtcbnZhciB3YXJuaW5nID0gcmVxdWlyZSgnZmJqcy9saWIvd2FybmluZycpO1xudmFyIGxvd1ByaW9yaXR5V2FybmluZyA9IHJlcXVpcmUoJy4vbG93UHJpb3JpdHlXYXJuaW5nJyk7XG5cbmZ1bmN0aW9uIGdldERlY2xhcmF0aW9uRXJyb3JBZGRlbmR1bSgpIHtcbiAgaWYgKFJlYWN0Q3VycmVudE93bmVyLmN1cnJlbnQpIHtcbiAgICB2YXIgbmFtZSA9IFJlYWN0Q3VycmVudE93bmVyLmN1cnJlbnQuZ2V0TmFtZSgpO1xuICAgIGlmIChuYW1lKSB7XG4gICAgICByZXR1cm4gJyBDaGVjayB0aGUgcmVuZGVyIG1ldGhvZCBvZiBgJyArIG5hbWUgKyAnYC4nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZUluZm9FcnJvckFkZGVuZHVtKGVsZW1lbnRQcm9wcykge1xuICBpZiAoZWxlbWVudFByb3BzICE9PSBudWxsICYmIGVsZW1lbnRQcm9wcyAhPT0gdW5kZWZpbmVkICYmIGVsZW1lbnRQcm9wcy5fX3NvdXJjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIHNvdXJjZSA9IGVsZW1lbnRQcm9wcy5fX3NvdXJjZTtcbiAgICB2YXIgZmlsZU5hbWUgPSBzb3VyY2UuZmlsZU5hbWUucmVwbGFjZSgvXi4qW1xcXFxcXC9dLywgJycpO1xuICAgIHZhciBsaW5lTnVtYmVyID0gc291cmNlLmxpbmVOdW1iZXI7XG4gICAgcmV0dXJuICcgQ2hlY2sgeW91ciBjb2RlIGF0ICcgKyBmaWxlTmFtZSArICc6JyArIGxpbmVOdW1iZXIgKyAnLic7XG4gIH1cbiAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIFdhcm4gaWYgdGhlcmUncyBubyBrZXkgZXhwbGljaXRseSBzZXQgb24gZHluYW1pYyBhcnJheXMgb2YgY2hpbGRyZW4gb3JcbiAqIG9iamVjdCBrZXlzIGFyZSBub3QgdmFsaWQuIFRoaXMgYWxsb3dzIHVzIHRvIGtlZXAgdHJhY2sgb2YgY2hpbGRyZW4gYmV0d2VlblxuICogdXBkYXRlcy5cbiAqL1xudmFyIG93bmVySGFzS2V5VXNlV2FybmluZyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRDdXJyZW50Q29tcG9uZW50RXJyb3JJbmZvKHBhcmVudFR5cGUpIHtcbiAgdmFyIGluZm8gPSBnZXREZWNsYXJhdGlvbkVycm9yQWRkZW5kdW0oKTtcblxuICBpZiAoIWluZm8pIHtcbiAgICB2YXIgcGFyZW50TmFtZSA9IHR5cGVvZiBwYXJlbnRUeXBlID09PSAnc3RyaW5nJyA/IHBhcmVudFR5cGUgOiBwYXJlbnRUeXBlLmRpc3BsYXlOYW1lIHx8IHBhcmVudFR5cGUubmFtZTtcbiAgICBpZiAocGFyZW50TmFtZSkge1xuICAgICAgaW5mbyA9ICcgQ2hlY2sgdGhlIHRvcC1sZXZlbCByZW5kZXIgY2FsbCB1c2luZyA8JyArIHBhcmVudE5hbWUgKyAnPi4nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaW5mbztcbn1cblxuLyoqXG4gKiBXYXJuIGlmIHRoZSBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhbiBleHBsaWNpdCBrZXkgYXNzaWduZWQgdG8gaXQuXG4gKiBUaGlzIGVsZW1lbnQgaXMgaW4gYW4gYXJyYXkuIFRoZSBhcnJheSBjb3VsZCBncm93IGFuZCBzaHJpbmsgb3IgYmVcbiAqIHJlb3JkZXJlZC4gQWxsIGNoaWxkcmVuIHRoYXQgaGF2ZW4ndCBhbHJlYWR5IGJlZW4gdmFsaWRhdGVkIGFyZSByZXF1aXJlZCB0b1xuICogaGF2ZSBhIFwia2V5XCIgcHJvcGVydHkgYXNzaWduZWQgdG8gaXQuIEVycm9yIHN0YXR1c2VzIGFyZSBjYWNoZWQgc28gYSB3YXJuaW5nXG4gKiB3aWxsIG9ubHkgYmUgc2hvd24gb25jZS5cbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwYXJhbSB7UmVhY3RFbGVtZW50fSBlbGVtZW50IEVsZW1lbnQgdGhhdCByZXF1aXJlcyBhIGtleS5cbiAqIEBwYXJhbSB7Kn0gcGFyZW50VHlwZSBlbGVtZW50J3MgcGFyZW50J3MgdHlwZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVFeHBsaWNpdEtleShlbGVtZW50LCBwYXJlbnRUeXBlKSB7XG4gIGlmICghZWxlbWVudC5fc3RvcmUgfHwgZWxlbWVudC5fc3RvcmUudmFsaWRhdGVkIHx8IGVsZW1lbnQua2V5ICE9IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZWxlbWVudC5fc3RvcmUudmFsaWRhdGVkID0gdHJ1ZTtcblxuICB2YXIgbWVtb2l6ZXIgPSBvd25lckhhc0tleVVzZVdhcm5pbmcudW5pcXVlS2V5IHx8IChvd25lckhhc0tleVVzZVdhcm5pbmcudW5pcXVlS2V5ID0ge30pO1xuXG4gIHZhciBjdXJyZW50Q29tcG9uZW50RXJyb3JJbmZvID0gZ2V0Q3VycmVudENvbXBvbmVudEVycm9ySW5mbyhwYXJlbnRUeXBlKTtcbiAgaWYgKG1lbW9pemVyW2N1cnJlbnRDb21wb25lbnRFcnJvckluZm9dKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIG1lbW9pemVyW2N1cnJlbnRDb21wb25lbnRFcnJvckluZm9dID0gdHJ1ZTtcblxuICAvLyBVc3VhbGx5IHRoZSBjdXJyZW50IG93bmVyIGlzIHRoZSBvZmZlbmRlciwgYnV0IGlmIGl0IGFjY2VwdHMgY2hpbGRyZW4gYXMgYVxuICAvLyBwcm9wZXJ0eSwgaXQgbWF5IGJlIHRoZSBjcmVhdG9yIG9mIHRoZSBjaGlsZCB0aGF0J3MgcmVzcG9uc2libGUgZm9yXG4gIC8vIGFzc2lnbmluZyBpdCBhIGtleS5cbiAgdmFyIGNoaWxkT3duZXIgPSAnJztcbiAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5fb3duZXIgJiYgZWxlbWVudC5fb3duZXIgIT09IFJlYWN0Q3VycmVudE93bmVyLmN1cnJlbnQpIHtcbiAgICAvLyBHaXZlIHRoZSBjb21wb25lbnQgdGhhdCBvcmlnaW5hbGx5IGNyZWF0ZWQgdGhpcyBjaGlsZC5cbiAgICBjaGlsZE93bmVyID0gJyBJdCB3YXMgcGFzc2VkIGEgY2hpbGQgZnJvbSAnICsgZWxlbWVudC5fb3duZXIuZ2V0TmFtZSgpICsgJy4nO1xuICB9XG5cbiAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IHdhcm5pbmcoZmFsc2UsICdFYWNoIGNoaWxkIGluIGFuIGFycmF5IG9yIGl0ZXJhdG9yIHNob3VsZCBoYXZlIGEgdW5pcXVlIFwia2V5XCIgcHJvcC4nICsgJyVzJXMgU2VlIGh0dHBzOi8vZmIubWUvcmVhY3Qtd2FybmluZy1rZXlzIGZvciBtb3JlIGluZm9ybWF0aW9uLiVzJywgY3VycmVudENvbXBvbmVudEVycm9ySW5mbywgY2hpbGRPd25lciwgUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRDdXJyZW50U3RhY2tBZGRlbmR1bShlbGVtZW50KSkgOiB2b2lkIDA7XG59XG5cbi8qKlxuICogRW5zdXJlIHRoYXQgZXZlcnkgZWxlbWVudCBlaXRoZXIgaXMgcGFzc2VkIGluIGEgc3RhdGljIGxvY2F0aW9uLCBpbiBhblxuICogYXJyYXkgd2l0aCBhbiBleHBsaWNpdCBrZXlzIHByb3BlcnR5IGRlZmluZWQsIG9yIGluIGFuIG9iamVjdCBsaXRlcmFsXG4gKiB3aXRoIHZhbGlkIGtleSBwcm9wZXJ0eS5cbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwYXJhbSB7UmVhY3ROb2RlfSBub2RlIFN0YXRpY2FsbHkgcGFzc2VkIGNoaWxkIG9mIGFueSB0eXBlLlxuICogQHBhcmFtIHsqfSBwYXJlbnRUeXBlIG5vZGUncyBwYXJlbnQncyB0eXBlLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUNoaWxkS2V5cyhub2RlLCBwYXJlbnRUeXBlKSB7XG4gIGlmICh0eXBlb2Ygbm9kZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IG5vZGVbaV07XG4gICAgICBpZiAoUmVhY3RFbGVtZW50LmlzVmFsaWRFbGVtZW50KGNoaWxkKSkge1xuICAgICAgICB2YWxpZGF0ZUV4cGxpY2l0S2V5KGNoaWxkLCBwYXJlbnRUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoUmVhY3RFbGVtZW50LmlzVmFsaWRFbGVtZW50KG5vZGUpKSB7XG4gICAgLy8gVGhpcyBlbGVtZW50IHdhcyBwYXNzZWQgaW4gYSB2YWxpZCBsb2NhdGlvbi5cbiAgICBpZiAobm9kZS5fc3RvcmUpIHtcbiAgICAgIG5vZGUuX3N0b3JlLnZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKG5vZGUpIHtcbiAgICB2YXIgaXRlcmF0b3JGbiA9IGdldEl0ZXJhdG9yRm4obm9kZSk7XG4gICAgLy8gRW50cnkgaXRlcmF0b3JzIHByb3ZpZGUgaW1wbGljaXQga2V5cy5cbiAgICBpZiAoaXRlcmF0b3JGbikge1xuICAgICAgaWYgKGl0ZXJhdG9yRm4gIT09IG5vZGUuZW50cmllcykge1xuICAgICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYXRvckZuLmNhbGwobm9kZSk7XG4gICAgICAgIHZhciBzdGVwO1xuICAgICAgICB3aGlsZSAoIShzdGVwID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSB7XG4gICAgICAgICAgaWYgKFJlYWN0RWxlbWVudC5pc1ZhbGlkRWxlbWVudChzdGVwLnZhbHVlKSkge1xuICAgICAgICAgICAgdmFsaWRhdGVFeHBsaWNpdEtleShzdGVwLnZhbHVlLCBwYXJlbnRUeXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhbiBlbGVtZW50LCB2YWxpZGF0ZSB0aGF0IGl0cyBwcm9wcyBmb2xsb3cgdGhlIHByb3BUeXBlcyBkZWZpbml0aW9uLFxuICogcHJvdmlkZWQgYnkgdGhlIHR5cGUuXG4gKlxuICogQHBhcmFtIHtSZWFjdEVsZW1lbnR9IGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVQcm9wVHlwZXMoZWxlbWVudCkge1xuICB2YXIgY29tcG9uZW50Q2xhc3MgPSBlbGVtZW50LnR5cGU7XG4gIGlmICh0eXBlb2YgY29tcG9uZW50Q2xhc3MgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG5hbWUgPSBjb21wb25lbnRDbGFzcy5kaXNwbGF5TmFtZSB8fCBjb21wb25lbnRDbGFzcy5uYW1lO1xuICBpZiAoY29tcG9uZW50Q2xhc3MucHJvcFR5cGVzKSB7XG4gICAgY2hlY2tSZWFjdFR5cGVTcGVjKGNvbXBvbmVudENsYXNzLnByb3BUeXBlcywgZWxlbWVudC5wcm9wcywgJ3Byb3AnLCBuYW1lLCBlbGVtZW50LCBudWxsKTtcbiAgfVxuICBpZiAodHlwZW9mIGNvbXBvbmVudENsYXNzLmdldERlZmF1bHRQcm9wcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyB3YXJuaW5nKGNvbXBvbmVudENsYXNzLmdldERlZmF1bHRQcm9wcy5pc1JlYWN0Q2xhc3NBcHByb3ZlZCwgJ2dldERlZmF1bHRQcm9wcyBpcyBvbmx5IHVzZWQgb24gY2xhc3NpYyBSZWFjdC5jcmVhdGVDbGFzcyAnICsgJ2RlZmluaXRpb25zLiBVc2UgYSBzdGF0aWMgcHJvcGVydHkgbmFtZWQgYGRlZmF1bHRQcm9wc2AgaW5zdGVhZC4nKSA6IHZvaWQgMDtcbiAgfVxufVxuXG52YXIgUmVhY3RFbGVtZW50VmFsaWRhdG9yID0ge1xuICBjcmVhdGVFbGVtZW50OiBmdW5jdGlvbiAodHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgdmFyIHZhbGlkVHlwZSA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJztcbiAgICAvLyBXZSB3YXJuIGluIHRoaXMgY2FzZSBidXQgZG9uJ3QgdGhyb3cuIFdlIGV4cGVjdCB0aGUgZWxlbWVudCBjcmVhdGlvbiB0b1xuICAgIC8vIHN1Y2NlZWQgYW5kIHRoZXJlIHdpbGwgbGlrZWx5IGJlIGVycm9ycyBpbiByZW5kZXIuXG4gICAgaWYgKCF2YWxpZFR5cGUpIHtcbiAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIGluZm8gPSAnJztcbiAgICAgICAgaWYgKHR5cGUgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcgJiYgdHlwZSAhPT0gbnVsbCAmJiBPYmplY3Qua2V5cyh0eXBlKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpbmZvICs9ICcgWW91IGxpa2VseSBmb3Jnb3QgdG8gZXhwb3J0IHlvdXIgY29tcG9uZW50IGZyb20gdGhlIGZpbGUgJyArIFwiaXQncyBkZWZpbmVkIGluLlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNvdXJjZUluZm8gPSBnZXRTb3VyY2VJbmZvRXJyb3JBZGRlbmR1bShwcm9wcyk7XG4gICAgICAgIGlmIChzb3VyY2VJbmZvKSB7XG4gICAgICAgICAgaW5mbyArPSBzb3VyY2VJbmZvO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZm8gKz0gZ2V0RGVjbGFyYXRpb25FcnJvckFkZGVuZHVtKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmZvICs9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0Q3VycmVudFN0YWNrQWRkZW5kdW0oKTtcblxuICAgICAgICB2YXIgY3VycmVudFNvdXJjZSA9IHByb3BzICE9PSBudWxsICYmIHByb3BzICE9PSB1bmRlZmluZWQgJiYgcHJvcHMuX19zb3VyY2UgIT09IHVuZGVmaW5lZCA/IHByb3BzLl9fc291cmNlIDogbnVsbDtcbiAgICAgICAgUmVhY3RDb21wb25lbnRUcmVlSG9vay5wdXNoTm9uU3RhbmRhcmRXYXJuaW5nU3RhY2sodHJ1ZSwgY3VycmVudFNvdXJjZSk7XG4gICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyB3YXJuaW5nKGZhbHNlLCAnUmVhY3QuY3JlYXRlRWxlbWVudDogdHlwZSBpcyBpbnZhbGlkIC0tIGV4cGVjdGVkIGEgc3RyaW5nIChmb3IgJyArICdidWlsdC1pbiBjb21wb25lbnRzKSBvciBhIGNsYXNzL2Z1bmN0aW9uIChmb3IgY29tcG9zaXRlICcgKyAnY29tcG9uZW50cykgYnV0IGdvdDogJXMuJXMnLCB0eXBlID09IG51bGwgPyB0eXBlIDogdHlwZW9mIHR5cGUsIGluZm8pIDogdm9pZCAwO1xuICAgICAgICBSZWFjdENvbXBvbmVudFRyZWVIb29rLnBvcE5vblN0YW5kYXJkV2FybmluZ1N0YWNrKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGVsZW1lbnQgPSBSZWFjdEVsZW1lbnQuY3JlYXRlRWxlbWVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgLy8gVGhlIHJlc3VsdCBjYW4gYmUgbnVsbGlzaCBpZiBhIG1vY2sgb3IgYSBjdXN0b20gZnVuY3Rpb24gaXMgdXNlZC5cbiAgICAvLyBUT0RPOiBEcm9wIHRoaXMgd2hlbiB0aGVzZSBhcmUgbm8gbG9uZ2VyIGFsbG93ZWQgYXMgdGhlIHR5cGUgYXJndW1lbnQuXG4gICAgaWYgKGVsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLy8gU2tpcCBrZXkgd2FybmluZyBpZiB0aGUgdHlwZSBpc24ndCB2YWxpZCBzaW5jZSBvdXIga2V5IHZhbGlkYXRpb24gbG9naWNcbiAgICAvLyBkb2Vzbid0IGV4cGVjdCBhIG5vbi1zdHJpbmcvZnVuY3Rpb24gdHlwZSBhbmQgY2FuIHRocm93IGNvbmZ1c2luZyBlcnJvcnMuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCBleGNlcHRpb24gYmVoYXZpb3IgdG8gZGlmZmVyIGJldHdlZW4gZGV2IGFuZCBwcm9kLlxuICAgIC8vIChSZW5kZXJpbmcgd2lsbCB0aHJvdyB3aXRoIGEgaGVscGZ1bCBtZXNzYWdlIGFuZCBhcyBzb29uIGFzIHRoZSB0eXBlIGlzXG4gICAgLy8gZml4ZWQsIHRoZSBrZXkgd2FybmluZ3Mgd2lsbCBhcHBlYXIuKVxuICAgIGlmICh2YWxpZFR5cGUpIHtcbiAgICAgIGZvciAodmFyIGkgPSAyOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbGlkYXRlQ2hpbGRLZXlzKGFyZ3VtZW50c1tpXSwgdHlwZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFsaWRhdGVQcm9wVHlwZXMoZWxlbWVudCk7XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfSxcblxuICBjcmVhdGVGYWN0b3J5OiBmdW5jdGlvbiAodHlwZSkge1xuICAgIHZhciB2YWxpZGF0ZWRGYWN0b3J5ID0gUmVhY3RFbGVtZW50VmFsaWRhdG9yLmNyZWF0ZUVsZW1lbnQuYmluZChudWxsLCB0eXBlKTtcbiAgICAvLyBMZWdhY3kgaG9vayBUT0RPOiBXYXJuIGlmIHRoaXMgaXMgYWNjZXNzZWRcbiAgICB2YWxpZGF0ZWRGYWN0b3J5LnR5cGUgPSB0eXBlO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGlmIChjYW5EZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodmFsaWRhdGVkRmFjdG9yeSwgJ3R5cGUnLCB7XG4gICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb3dQcmlvcml0eVdhcm5pbmcoZmFsc2UsICdGYWN0b3J5LnR5cGUgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHRoZSBjbGFzcyBkaXJlY3RseSAnICsgJ2JlZm9yZSBwYXNzaW5nIGl0IHRvIGNyZWF0ZUZhY3RvcnkuJyk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3R5cGUnLCB7XG4gICAgICAgICAgICAgIHZhbHVlOiB0eXBlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkYXRlZEZhY3Rvcnk7XG4gIH0sXG5cbiAgY2xvbmVFbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgdmFyIG5ld0VsZW1lbnQgPSBSZWFjdEVsZW1lbnQuY2xvbmVFbGVtZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgZm9yICh2YXIgaSA9IDI7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbGlkYXRlQ2hpbGRLZXlzKGFyZ3VtZW50c1tpXSwgbmV3RWxlbWVudC50eXBlKTtcbiAgICB9XG4gICAgdmFsaWRhdGVQcm9wVHlwZXMobmV3RWxlbWVudCk7XG4gICAgcmV0dXJuIG5ld0VsZW1lbnQ7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RFbGVtZW50VmFsaWRhdG9yOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHdhcm5pbmcgPSByZXF1aXJlKCdmYmpzL2xpYi93YXJuaW5nJyk7XG5cbmZ1bmN0aW9uIHdhcm5Ob29wKHB1YmxpY0luc3RhbmNlLCBjYWxsZXJOYW1lKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgdmFyIGNvbnN0cnVjdG9yID0gcHVibGljSW5zdGFuY2UuY29uc3RydWN0b3I7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IHdhcm5pbmcoZmFsc2UsICclcyguLi4pOiBDYW4gb25seSB1cGRhdGUgYSBtb3VudGVkIG9yIG1vdW50aW5nIGNvbXBvbmVudC4gJyArICdUaGlzIHVzdWFsbHkgbWVhbnMgeW91IGNhbGxlZCAlcygpIG9uIGFuIHVubW91bnRlZCBjb21wb25lbnQuICcgKyAnVGhpcyBpcyBhIG5vLW9wLiBQbGVhc2UgY2hlY2sgdGhlIGNvZGUgZm9yIHRoZSAlcyBjb21wb25lbnQuJywgY2FsbGVyTmFtZSwgY2FsbGVyTmFtZSwgY29uc3RydWN0b3IgJiYgKGNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lIHx8IGNvbnN0cnVjdG9yLm5hbWUpIHx8ICdSZWFjdENsYXNzJykgOiB2b2lkIDA7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBhYnN0cmFjdCBBUEkgZm9yIGFuIHVwZGF0ZSBxdWV1ZS5cbiAqL1xudmFyIFJlYWN0Tm9vcFVwZGF0ZVF1ZXVlID0ge1xuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoaXMgY29tcG9zaXRlIGNvbXBvbmVudCBpcyBtb3VudGVkLlxuICAgKiBAcGFyYW0ge1JlYWN0Q2xhc3N9IHB1YmxpY0luc3RhbmNlIFRoZSBpbnN0YW5jZSB3ZSB3YW50IHRvIHRlc3QuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgbW91bnRlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKiBAcHJvdGVjdGVkXG4gICAqIEBmaW5hbFxuICAgKi9cbiAgaXNNb3VudGVkOiBmdW5jdGlvbiAocHVibGljSW5zdGFuY2UpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEVucXVldWUgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYWZ0ZXIgYWxsIHRoZSBwZW5kaW5nIHVwZGF0ZXNcbiAgICogaGF2ZSBwcm9jZXNzZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7UmVhY3RDbGFzc30gcHVibGljSW5zdGFuY2UgVGhlIGluc3RhbmNlIHRvIHVzZSBhcyBgdGhpc2AgY29udGV4dC5cbiAgICogQHBhcmFtIHs/ZnVuY3Rpb259IGNhbGxiYWNrIENhbGxlZCBhZnRlciBzdGF0ZSBpcyB1cGRhdGVkLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGVucXVldWVDYWxsYmFjazogZnVuY3Rpb24gKHB1YmxpY0luc3RhbmNlLCBjYWxsYmFjaykge30sXG5cbiAgLyoqXG4gICAqIEZvcmNlcyBhbiB1cGRhdGUuIFRoaXMgc2hvdWxkIG9ubHkgYmUgaW52b2tlZCB3aGVuIGl0IGlzIGtub3duIHdpdGhcbiAgICogY2VydGFpbnR5IHRoYXQgd2UgYXJlICoqbm90KiogaW4gYSBET00gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIFlvdSBtYXkgd2FudCB0byBjYWxsIHRoaXMgd2hlbiB5b3Uga25vdyB0aGF0IHNvbWUgZGVlcGVyIGFzcGVjdCBvZiB0aGVcbiAgICogY29tcG9uZW50J3Mgc3RhdGUgaGFzIGNoYW5nZWQgYnV0IGBzZXRTdGF0ZWAgd2FzIG5vdCBjYWxsZWQuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBub3QgaW52b2tlIGBzaG91bGRDb21wb25lbnRVcGRhdGVgLCBidXQgaXQgd2lsbCBpbnZva2VcbiAgICogYGNvbXBvbmVudFdpbGxVcGRhdGVgIGFuZCBgY29tcG9uZW50RGlkVXBkYXRlYC5cbiAgICpcbiAgICogQHBhcmFtIHtSZWFjdENsYXNzfSBwdWJsaWNJbnN0YW5jZSBUaGUgaW5zdGFuY2UgdGhhdCBzaG91bGQgcmVyZW5kZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZW5xdWV1ZUZvcmNlVXBkYXRlOiBmdW5jdGlvbiAocHVibGljSW5zdGFuY2UpIHtcbiAgICB3YXJuTm9vcChwdWJsaWNJbnN0YW5jZSwgJ2ZvcmNlVXBkYXRlJyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIGFsbCBvZiB0aGUgc3RhdGUuIEFsd2F5cyB1c2UgdGhpcyBvciBgc2V0U3RhdGVgIHRvIG11dGF0ZSBzdGF0ZS5cbiAgICogWW91IHNob3VsZCB0cmVhdCBgdGhpcy5zdGF0ZWAgYXMgaW1tdXRhYmxlLlxuICAgKlxuICAgKiBUaGVyZSBpcyBubyBndWFyYW50ZWUgdGhhdCBgdGhpcy5zdGF0ZWAgd2lsbCBiZSBpbW1lZGlhdGVseSB1cGRhdGVkLCBzb1xuICAgKiBhY2Nlc3NpbmcgYHRoaXMuc3RhdGVgIGFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QgbWF5IHJldHVybiB0aGUgb2xkIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0ge1JlYWN0Q2xhc3N9IHB1YmxpY0luc3RhbmNlIFRoZSBpbnN0YW5jZSB0aGF0IHNob3VsZCByZXJlbmRlci5cbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbXBsZXRlU3RhdGUgTmV4dCBzdGF0ZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBlbnF1ZXVlUmVwbGFjZVN0YXRlOiBmdW5jdGlvbiAocHVibGljSW5zdGFuY2UsIGNvbXBsZXRlU3RhdGUpIHtcbiAgICB3YXJuTm9vcChwdWJsaWNJbnN0YW5jZSwgJ3JlcGxhY2VTdGF0ZScpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZXRzIGEgc3Vic2V0IG9mIHRoZSBzdGF0ZS4gVGhpcyBvbmx5IGV4aXN0cyBiZWNhdXNlIF9wZW5kaW5nU3RhdGUgaXNcbiAgICogaW50ZXJuYWwuIFRoaXMgcHJvdmlkZXMgYSBtZXJnaW5nIHN0cmF0ZWd5IHRoYXQgaXMgbm90IGF2YWlsYWJsZSB0byBkZWVwXG4gICAqIHByb3BlcnRpZXMgd2hpY2ggaXMgY29uZnVzaW5nLiBUT0RPOiBFeHBvc2UgcGVuZGluZ1N0YXRlIG9yIGRvbid0IHVzZSBpdFxuICAgKiBkdXJpbmcgdGhlIG1lcmdlLlxuICAgKlxuICAgKiBAcGFyYW0ge1JlYWN0Q2xhc3N9IHB1YmxpY0luc3RhbmNlIFRoZSBpbnN0YW5jZSB0aGF0IHNob3VsZCByZXJlbmRlci5cbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcnRpYWxTdGF0ZSBOZXh0IHBhcnRpYWwgc3RhdGUgdG8gYmUgbWVyZ2VkIHdpdGggc3RhdGUuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZW5xdWV1ZVNldFN0YXRlOiBmdW5jdGlvbiAocHVibGljSW5zdGFuY2UsIHBhcnRpYWxTdGF0ZSkge1xuICAgIHdhcm5Ob29wKHB1YmxpY0luc3RhbmNlLCAnc2V0U3RhdGUnKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdE5vb3BVcGRhdGVRdWV1ZTsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0UHJvcFR5cGVMb2NhdGlvbk5hbWVzID0ge307XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIFJlYWN0UHJvcFR5cGVMb2NhdGlvbk5hbWVzID0ge1xuICAgIHByb3A6ICdwcm9wJyxcbiAgICBjb250ZXh0OiAnY29udGV4dCcsXG4gICAgY2hpbGRDb250ZXh0OiAnY2hpbGQgY29udGV4dCdcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFByb3BUeXBlTG9jYXRpb25OYW1lczsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfcmVxdWlyZSA9IHJlcXVpcmUoJy4vUmVhY3RFbGVtZW50JyksXG4gICAgaXNWYWxpZEVsZW1lbnQgPSBfcmVxdWlyZS5pc1ZhbGlkRWxlbWVudDtcblxudmFyIGZhY3RvcnkgPSByZXF1aXJlKCdwcm9wLXR5cGVzL2ZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KGlzVmFsaWRFbGVtZW50KTsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0UHJvcFR5cGVzU2VjcmV0ID0gJ1NFQ1JFVF9ET19OT1RfUEFTU19USElTX09SX1lPVV9XSUxMX0JFX0ZJUkVEJztcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFByb3BUeXBlc1NlY3JldDsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gJzE1LjYuMic7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjYW5EZWZpbmVQcm9wZXJ0eSA9IGZhbHNlO1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdHJ5IHtcbiAgICAvLyAkRmxvd0ZpeE1lIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9mbG93L2lzc3Vlcy8yODVcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICd4JywgeyBnZXQ6IGZ1bmN0aW9uICgpIHt9IH0pO1xuICAgIGNhbkRlZmluZVByb3BlcnR5ID0gdHJ1ZTtcbiAgfSBjYXRjaCAoeCkge1xuICAgIC8vIElFIHdpbGwgZmFpbCBvbiBkZWZpbmVQcm9wZXJ0eVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FuRGVmaW5lUHJvcGVydHk7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3Byb2RJbnZhcmlhbnQgPSByZXF1aXJlKCcuL3JlYWN0UHJvZEludmFyaWFudCcpO1xuXG52YXIgUmVhY3RQcm9wVHlwZUxvY2F0aW9uTmFtZXMgPSByZXF1aXJlKCcuL1JlYWN0UHJvcFR5cGVMb2NhdGlvbk5hbWVzJyk7XG52YXIgUmVhY3RQcm9wVHlwZXNTZWNyZXQgPSByZXF1aXJlKCcuL1JlYWN0UHJvcFR5cGVzU2VjcmV0Jyk7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcbnZhciB3YXJuaW5nID0gcmVxdWlyZSgnZmJqcy9saWIvd2FybmluZycpO1xuXG52YXIgUmVhY3RDb21wb25lbnRUcmVlSG9vaztcblxuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Rlc3QnKSB7XG4gIC8vIFRlbXBvcmFyeSBoYWNrLlxuICAvLyBJbmxpbmUgcmVxdWlyZXMgZG9uJ3Qgd29yayB3ZWxsIHdpdGggSmVzdDpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2lzc3Vlcy83MjQwXG4gIC8vIFJlbW92ZSB0aGUgaW5saW5lIHJlcXVpcmVzIHdoZW4gd2UgZG9uJ3QgbmVlZCB0aGVtIGFueW1vcmU6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9wdWxsLzcxNzhcbiAgUmVhY3RDb21wb25lbnRUcmVlSG9vayA9IHJlcXVpcmUoJy4vUmVhY3RDb21wb25lbnRUcmVlSG9vaycpO1xufVxuXG52YXIgbG9nZ2VkVHlwZUZhaWx1cmVzID0ge307XG5cbi8qKlxuICogQXNzZXJ0IHRoYXQgdGhlIHZhbHVlcyBtYXRjaCB3aXRoIHRoZSB0eXBlIHNwZWNzLlxuICogRXJyb3IgbWVzc2FnZXMgYXJlIG1lbW9yaXplZCBhbmQgd2lsbCBvbmx5IGJlIHNob3duIG9uY2UuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHR5cGVTcGVjcyBNYXAgb2YgbmFtZSB0byBhIFJlYWN0UHJvcFR5cGVcbiAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgUnVudGltZSB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHR5cGUtY2hlY2tlZFxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2F0aW9uIGUuZy4gXCJwcm9wXCIsIFwiY29udGV4dFwiLCBcImNoaWxkIGNvbnRleHRcIlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudE5hbWUgTmFtZSBvZiB0aGUgY29tcG9uZW50IGZvciBlcnJvciBtZXNzYWdlcy5cbiAqIEBwYXJhbSB7P29iamVjdH0gZWxlbWVudCBUaGUgUmVhY3QgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHR5cGUtY2hlY2tlZFxuICogQHBhcmFtIHs/bnVtYmVyfSBkZWJ1Z0lEIFRoZSBSZWFjdCBjb21wb25lbnQgaW5zdGFuY2UgdGhhdCBpcyBiZWluZyB0eXBlLWNoZWNrZWRcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNoZWNrUmVhY3RUeXBlU3BlYyh0eXBlU3BlY3MsIHZhbHVlcywgbG9jYXRpb24sIGNvbXBvbmVudE5hbWUsIGVsZW1lbnQsIGRlYnVnSUQpIHtcbiAgZm9yICh2YXIgdHlwZVNwZWNOYW1lIGluIHR5cGVTcGVjcykge1xuICAgIGlmICh0eXBlU3BlY3MuaGFzT3duUHJvcGVydHkodHlwZVNwZWNOYW1lKSkge1xuICAgICAgdmFyIGVycm9yO1xuICAgICAgLy8gUHJvcCB0eXBlIHZhbGlkYXRpb24gbWF5IHRocm93LiBJbiBjYXNlIHRoZXkgZG8sIHdlIGRvbid0IHdhbnQgdG9cbiAgICAgIC8vIGZhaWwgdGhlIHJlbmRlciBwaGFzZSB3aGVyZSBpdCBkaWRuJ3QgZmFpbCBiZWZvcmUuIFNvIHdlIGxvZyBpdC5cbiAgICAgIC8vIEFmdGVyIHRoZXNlIGhhdmUgYmVlbiBjbGVhbmVkIHVwLCB3ZSdsbCBsZXQgdGhlbSB0aHJvdy5cbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFRoaXMgaXMgaW50ZW50aW9uYWxseSBhbiBpbnZhcmlhbnQgdGhhdCBnZXRzIGNhdWdodC4gSXQncyB0aGUgc2FtZVxuICAgICAgICAvLyBiZWhhdmlvciBhcyB3aXRob3V0IHRoaXMgc3RhdGVtZW50IGV4Y2VwdCB3aXRoIGEgYmV0dGVyIG1lc3NhZ2UuXG4gICAgICAgICEodHlwZW9mIHR5cGVTcGVjc1t0eXBlU3BlY05hbWVdID09PSAnZnVuY3Rpb24nKSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICclczogJXMgdHlwZSBgJXNgIGlzIGludmFsaWQ7IGl0IG11c3QgYmUgYSBmdW5jdGlvbiwgdXN1YWxseSBmcm9tIFJlYWN0LlByb3BUeXBlcy4nLCBjb21wb25lbnROYW1lIHx8ICdSZWFjdCBjbGFzcycsIFJlYWN0UHJvcFR5cGVMb2NhdGlvbk5hbWVzW2xvY2F0aW9uXSwgdHlwZVNwZWNOYW1lKSA6IF9wcm9kSW52YXJpYW50KCc4NCcsIGNvbXBvbmVudE5hbWUgfHwgJ1JlYWN0IGNsYXNzJywgUmVhY3RQcm9wVHlwZUxvY2F0aW9uTmFtZXNbbG9jYXRpb25dLCB0eXBlU3BlY05hbWUpIDogdm9pZCAwO1xuICAgICAgICBlcnJvciA9IHR5cGVTcGVjc1t0eXBlU3BlY05hbWVdKHZhbHVlcywgdHlwZVNwZWNOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgbnVsbCwgUmVhY3RQcm9wVHlwZXNTZWNyZXQpO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgZXJyb3IgPSBleDtcbiAgICAgIH1cbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyB3YXJuaW5nKCFlcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIEVycm9yLCAnJXM6IHR5cGUgc3BlY2lmaWNhdGlvbiBvZiAlcyBgJXNgIGlzIGludmFsaWQ7IHRoZSB0eXBlIGNoZWNrZXIgJyArICdmdW5jdGlvbiBtdXN0IHJldHVybiBgbnVsbGAgb3IgYW4gYEVycm9yYCBidXQgcmV0dXJuZWQgYSAlcy4gJyArICdZb3UgbWF5IGhhdmUgZm9yZ290dGVuIHRvIHBhc3MgYW4gYXJndW1lbnQgdG8gdGhlIHR5cGUgY2hlY2tlciAnICsgJ2NyZWF0b3IgKGFycmF5T2YsIGluc3RhbmNlT2YsIG9iamVjdE9mLCBvbmVPZiwgb25lT2ZUeXBlLCBhbmQgJyArICdzaGFwZSBhbGwgcmVxdWlyZSBhbiBhcmd1bWVudCkuJywgY29tcG9uZW50TmFtZSB8fCAnUmVhY3QgY2xhc3MnLCBSZWFjdFByb3BUeXBlTG9jYXRpb25OYW1lc1tsb2NhdGlvbl0sIHR5cGVTcGVjTmFtZSwgdHlwZW9mIGVycm9yKSA6IHZvaWQgMDtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmICEoZXJyb3IubWVzc2FnZSBpbiBsb2dnZWRUeXBlRmFpbHVyZXMpKSB7XG4gICAgICAgIC8vIE9ubHkgbW9uaXRvciB0aGlzIGZhaWx1cmUgb25jZSBiZWNhdXNlIHRoZXJlIHRlbmRzIHRvIGJlIGEgbG90IG9mIHRoZVxuICAgICAgICAvLyBzYW1lIGVycm9yLlxuICAgICAgICBsb2dnZWRUeXBlRmFpbHVyZXNbZXJyb3IubWVzc2FnZV0gPSB0cnVlO1xuXG4gICAgICAgIHZhciBjb21wb25lbnRTdGFja0luZm8gPSAnJztcblxuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIGlmICghUmVhY3RDb21wb25lbnRUcmVlSG9vaykge1xuICAgICAgICAgICAgUmVhY3RDb21wb25lbnRUcmVlSG9vayA9IHJlcXVpcmUoJy4vUmVhY3RDb21wb25lbnRUcmVlSG9vaycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZGVidWdJRCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29tcG9uZW50U3RhY2tJbmZvID0gUmVhY3RDb21wb25lbnRUcmVlSG9vay5nZXRTdGFja0FkZGVuZHVtQnlJRChkZWJ1Z0lEKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudFN0YWNrSW5mbyA9IFJlYWN0Q29tcG9uZW50VHJlZUhvb2suZ2V0Q3VycmVudFN0YWNrQWRkZW5kdW0oZWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IHdhcm5pbmcoZmFsc2UsICdGYWlsZWQgJXMgdHlwZTogJXMlcycsIGxvY2F0aW9uLCBlcnJvci5tZXNzYWdlLCBjb21wb25lbnRTdGFja0luZm8pIDogdm9pZCAwO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNoZWNrUmVhY3RUeXBlU3BlYzsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfcmVxdWlyZSA9IHJlcXVpcmUoJy4vUmVhY3RCYXNlQ2xhc3NlcycpLFxuICAgIENvbXBvbmVudCA9IF9yZXF1aXJlLkNvbXBvbmVudDtcblxudmFyIF9yZXF1aXJlMiA9IHJlcXVpcmUoJy4vUmVhY3RFbGVtZW50JyksXG4gICAgaXNWYWxpZEVsZW1lbnQgPSBfcmVxdWlyZTIuaXNWYWxpZEVsZW1lbnQ7XG5cbnZhciBSZWFjdE5vb3BVcGRhdGVRdWV1ZSA9IHJlcXVpcmUoJy4vUmVhY3ROb29wVXBkYXRlUXVldWUnKTtcbnZhciBmYWN0b3J5ID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzL2ZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KENvbXBvbmVudCwgaXNWYWxpZEVsZW1lbnQsIFJlYWN0Tm9vcFVwZGF0ZVF1ZXVlKTsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyogZ2xvYmFsIFN5bWJvbCAqL1xuXG52YXIgSVRFUkFUT1JfU1lNQk9MID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBTeW1ib2wuaXRlcmF0b3I7XG52YXIgRkFVWF9JVEVSQVRPUl9TWU1CT0wgPSAnQEBpdGVyYXRvcic7IC8vIEJlZm9yZSBTeW1ib2wgc3BlYy5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpdGVyYXRvciBtZXRob2QgZnVuY3Rpb24gY29udGFpbmVkIG9uIHRoZSBpdGVyYWJsZSBvYmplY3QuXG4gKlxuICogQmUgc3VyZSB0byBpbnZva2UgdGhlIGZ1bmN0aW9uIHdpdGggdGhlIGl0ZXJhYmxlIGFzIGNvbnRleHQ6XG4gKlxuICogICAgIHZhciBpdGVyYXRvckZuID0gZ2V0SXRlcmF0b3JGbihteUl0ZXJhYmxlKTtcbiAqICAgICBpZiAoaXRlcmF0b3JGbikge1xuICogICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmF0b3JGbi5jYWxsKG15SXRlcmFibGUpO1xuICogICAgICAgLi4uXG4gKiAgICAgfVxuICpcbiAqIEBwYXJhbSB7P29iamVjdH0gbWF5YmVJdGVyYWJsZVxuICogQHJldHVybiB7P2Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBnZXRJdGVyYXRvckZuKG1heWJlSXRlcmFibGUpIHtcbiAgdmFyIGl0ZXJhdG9yRm4gPSBtYXliZUl0ZXJhYmxlICYmIChJVEVSQVRPUl9TWU1CT0wgJiYgbWF5YmVJdGVyYWJsZVtJVEVSQVRPUl9TWU1CT0xdIHx8IG1heWJlSXRlcmFibGVbRkFVWF9JVEVSQVRPUl9TWU1CT0xdKTtcbiAgaWYgKHR5cGVvZiBpdGVyYXRvckZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGl0ZXJhdG9yRm47XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRJdGVyYXRvckZuOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBGb3JrZWQgZnJvbSBmYmpzL3dhcm5pbmc6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svZmJqcy9ibG9iL2U2NmJhMjBhZDViZTQzM2ViNTQ0MjNmMmIwOTdkODI5MzI0ZDlkZTYvcGFja2FnZXMvZmJqcy9zcmMvX19mb3Jrc19fL3dhcm5pbmcuanNcbiAqXG4gKiBPbmx5IGNoYW5nZSBpcyB3ZSB1c2UgY29uc29sZS53YXJuIGluc3RlYWQgb2YgY29uc29sZS5lcnJvcixcbiAqIGFuZCBkbyBub3RoaW5nIHdoZW4gJ2NvbnNvbGUnIGlzIG5vdCBzdXBwb3J0ZWQuXG4gKiBUaGlzIHJlYWxseSBzaW1wbGlmaWVzIHRoZSBjb2RlLlxuICogLS0tXG4gKiBTaW1pbGFyIHRvIGludmFyaWFudCBidXQgb25seSBsb2dzIGEgd2FybmluZyBpZiB0aGUgY29uZGl0aW9uIGlzIG5vdCBtZXQuXG4gKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGxvZyBpc3N1ZXMgaW4gZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnRzIGluIGNyaXRpY2FsXG4gKiBwYXRocy4gUmVtb3ZpbmcgdGhlIGxvZ2dpbmcgY29kZSBmb3IgcHJvZHVjdGlvbiBlbnZpcm9ubWVudHMgd2lsbCBrZWVwIHRoZVxuICogc2FtZSBsb2dpYyBhbmQgZm9sbG93IHRoZSBzYW1lIGNvZGUgcGF0aHMuXG4gKi9cblxudmFyIGxvd1ByaW9yaXR5V2FybmluZyA9IGZ1bmN0aW9uICgpIHt9O1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YXIgcHJpbnRXYXJuaW5nID0gZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICB2YXIgbWVzc2FnZSA9ICdXYXJuaW5nOiAnICsgZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBhcmdzW2FyZ0luZGV4KytdO1xuICAgIH0pO1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIC8vIC0tLSBXZWxjb21lIHRvIGRlYnVnZ2luZyBSZWFjdCAtLS1cbiAgICAgIC8vIFRoaXMgZXJyb3Igd2FzIHRocm93biBhcyBhIGNvbnZlbmllbmNlIHNvIHRoYXQgeW91IGNhbiB1c2UgdGhpcyBzdGFja1xuICAgICAgLy8gdG8gZmluZCB0aGUgY2FsbHNpdGUgdGhhdCBjYXVzZWQgdGhpcyB3YXJuaW5nIHRvIGZpcmUuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfSBjYXRjaCAoeCkge31cbiAgfTtcblxuICBsb3dQcmlvcml0eVdhcm5pbmcgPSBmdW5jdGlvbiAoY29uZGl0aW9uLCBmb3JtYXQpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYHdhcm5pbmcoY29uZGl0aW9uLCBmb3JtYXQsIC4uLmFyZ3MpYCByZXF1aXJlcyBhIHdhcm5pbmcgJyArICdtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuMiA+IDIgPyBfbGVuMiAtIDIgOiAwKSwgX2tleTIgPSAyOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgIGFyZ3NbX2tleTIgLSAyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICB9XG5cbiAgICAgIHByaW50V2FybmluZy5hcHBseSh1bmRlZmluZWQsIFtmb3JtYXRdLmNvbmNhdChhcmdzKSk7XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvd1ByaW9yaXR5V2FybmluZzsiLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3Byb2RJbnZhcmlhbnQgPSByZXF1aXJlKCcuL3JlYWN0UHJvZEludmFyaWFudCcpO1xuXG52YXIgUmVhY3RFbGVtZW50ID0gcmVxdWlyZSgnLi9SZWFjdEVsZW1lbnQnKTtcblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IGNoaWxkIGluIGEgY29sbGVjdGlvbiBvZiBjaGlsZHJlbiBhbmQgdmVyaWZpZXMgdGhhdCB0aGVyZVxuICogaXMgb25seSBvbmUgY2hpbGQgaW4gdGhlIGNvbGxlY3Rpb24uXG4gKlxuICogU2VlIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvdG9wLWxldmVsLWFwaS5odG1sI3JlYWN0LmNoaWxkcmVuLm9ubHlcbiAqXG4gKiBUaGUgY3VycmVudCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIGZ1bmN0aW9uIGFzc3VtZXMgdGhhdCBhIHNpbmdsZSBjaGlsZCBnZXRzXG4gKiBwYXNzZWQgd2l0aG91dCBhIHdyYXBwZXIsIGJ1dCB0aGUgcHVycG9zZSBvZiB0aGlzIGhlbHBlciBmdW5jdGlvbiBpcyB0b1xuICogYWJzdHJhY3QgYXdheSB0aGUgcGFydGljdWxhciBzdHJ1Y3R1cmUgb2YgY2hpbGRyZW4uXG4gKlxuICogQHBhcmFtIHs/b2JqZWN0fSBjaGlsZHJlbiBDaGlsZCBjb2xsZWN0aW9uIHN0cnVjdHVyZS5cbiAqIEByZXR1cm4ge1JlYWN0RWxlbWVudH0gVGhlIGZpcnN0IGFuZCBvbmx5IGBSZWFjdEVsZW1lbnRgIGNvbnRhaW5lZCBpbiB0aGVcbiAqIHN0cnVjdHVyZS5cbiAqL1xuZnVuY3Rpb24gb25seUNoaWxkKGNoaWxkcmVuKSB7XG4gICFSZWFjdEVsZW1lbnQuaXNWYWxpZEVsZW1lbnQoY2hpbGRyZW4pID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ1JlYWN0LkNoaWxkcmVuLm9ubHkgZXhwZWN0ZWQgdG8gcmVjZWl2ZSBhIHNpbmdsZSBSZWFjdCBlbGVtZW50IGNoaWxkLicpIDogX3Byb2RJbnZhcmlhbnQoJzE0MycpIDogdm9pZCAwO1xuICByZXR1cm4gY2hpbGRyZW47XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb25seUNoaWxkOyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBXQVJOSU5HOiBETyBOT1QgbWFudWFsbHkgcmVxdWlyZSB0aGlzIG1vZHVsZS5cbiAqIFRoaXMgaXMgYSByZXBsYWNlbWVudCBmb3IgYGludmFyaWFudCguLi4pYCB1c2VkIGJ5IHRoZSBlcnJvciBjb2RlIHN5c3RlbVxuICogYW5kIHdpbGwgX29ubHlfIGJlIHJlcXVpcmVkIGJ5IHRoZSBjb3JyZXNwb25kaW5nIGJhYmVsIHBhc3MuXG4gKiBJdCBhbHdheXMgdGhyb3dzLlxuICovXG5cbmZ1bmN0aW9uIHJlYWN0UHJvZEludmFyaWFudChjb2RlKSB7XG4gIHZhciBhcmdDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGggLSAxO1xuXG4gIHZhciBtZXNzYWdlID0gJ01pbmlmaWVkIFJlYWN0IGVycm9yICMnICsgY29kZSArICc7IHZpc2l0ICcgKyAnaHR0cDovL2ZhY2Vib29rLmdpdGh1Yi5pby9yZWFjdC9kb2NzL2Vycm9yLWRlY29kZXIuaHRtbD9pbnZhcmlhbnQ9JyArIGNvZGU7XG5cbiAgZm9yICh2YXIgYXJnSWR4ID0gMDsgYXJnSWR4IDwgYXJnQ291bnQ7IGFyZ0lkeCsrKSB7XG4gICAgbWVzc2FnZSArPSAnJmFyZ3NbXT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGFyZ3VtZW50c1thcmdJZHggKyAxXSk7XG4gIH1cblxuICBtZXNzYWdlICs9ICcgZm9yIHRoZSBmdWxsIG1lc3NhZ2Ugb3IgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50JyArICcgZm9yIGZ1bGwgZXJyb3JzIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJztcblxuICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIGVycm9yLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCByZWFjdFByb2RJbnZhcmlhbnQncyBvd24gZnJhbWVcblxuICB0aHJvdyBlcnJvcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZWFjdFByb2RJbnZhcmlhbnQ7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3Byb2RJbnZhcmlhbnQgPSByZXF1aXJlKCcuL3JlYWN0UHJvZEludmFyaWFudCcpO1xuXG52YXIgUmVhY3RDdXJyZW50T3duZXIgPSByZXF1aXJlKCcuL1JlYWN0Q3VycmVudE93bmVyJyk7XG52YXIgUkVBQ1RfRUxFTUVOVF9UWVBFID0gcmVxdWlyZSgnLi9SZWFjdEVsZW1lbnRTeW1ib2wnKTtcblxudmFyIGdldEl0ZXJhdG9yRm4gPSByZXF1aXJlKCcuL2dldEl0ZXJhdG9yRm4nKTtcbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcbnZhciBLZXlFc2NhcGVVdGlscyA9IHJlcXVpcmUoJy4vS2V5RXNjYXBlVXRpbHMnKTtcbnZhciB3YXJuaW5nID0gcmVxdWlyZSgnZmJqcy9saWIvd2FybmluZycpO1xuXG52YXIgU0VQQVJBVE9SID0gJy4nO1xudmFyIFNVQlNFUEFSQVRPUiA9ICc6JztcblxuLyoqXG4gKiBUaGlzIGlzIGlubGluZWQgZnJvbSBSZWFjdEVsZW1lbnQgc2luY2UgdGhpcyBmaWxlIGlzIHNoYXJlZCBiZXR3ZWVuXG4gKiBpc29tb3JwaGljIGFuZCByZW5kZXJlcnMuIFdlIGNvdWxkIGV4dHJhY3QgdGhpcyB0byBhXG4gKlxuICovXG5cbi8qKlxuICogVE9ETzogVGVzdCB0aGF0IGEgc2luZ2xlIGNoaWxkIGFuZCBhbiBhcnJheSB3aXRoIG9uZSBpdGVtIGhhdmUgdGhlIHNhbWUga2V5XG4gKiBwYXR0ZXJuLlxuICovXG5cbnZhciBkaWRXYXJuQWJvdXRNYXBzID0gZmFsc2U7XG5cbi8qKlxuICogR2VuZXJhdGUgYSBrZXkgc3RyaW5nIHRoYXQgaWRlbnRpZmllcyBhIGNvbXBvbmVudCB3aXRoaW4gYSBzZXQuXG4gKlxuICogQHBhcmFtIHsqfSBjb21wb25lbnQgQSBjb21wb25lbnQgdGhhdCBjb3VsZCBjb250YWluIGEgbWFudWFsIGtleS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBJbmRleCB0aGF0IGlzIHVzZWQgaWYgYSBtYW51YWwga2V5IGlzIG5vdCBwcm92aWRlZC5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0Q29tcG9uZW50S2V5KGNvbXBvbmVudCwgaW5kZXgpIHtcbiAgLy8gRG8gc29tZSB0eXBlY2hlY2tpbmcgaGVyZSBzaW5jZSB3ZSBjYWxsIHRoaXMgYmxpbmRseS4gV2Ugd2FudCB0byBlbnN1cmVcbiAgLy8gdGhhdCB3ZSBkb24ndCBibG9jayBwb3RlbnRpYWwgZnV0dXJlIEVTIEFQSXMuXG4gIGlmIChjb21wb25lbnQgJiYgdHlwZW9mIGNvbXBvbmVudCA9PT0gJ29iamVjdCcgJiYgY29tcG9uZW50LmtleSAhPSBudWxsKSB7XG4gICAgLy8gRXhwbGljaXQga2V5XG4gICAgcmV0dXJuIEtleUVzY2FwZVV0aWxzLmVzY2FwZShjb21wb25lbnQua2V5KTtcbiAgfVxuICAvLyBJbXBsaWNpdCBrZXkgZGV0ZXJtaW5lZCBieSB0aGUgaW5kZXggaW4gdGhlIHNldFxuICByZXR1cm4gaW5kZXgudG9TdHJpbmcoMzYpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHBhcmFtIHshc3RyaW5nfSBuYW1lU29GYXIgTmFtZSBvZiB0aGUga2V5IHBhdGggc28gZmFyLlxuICogQHBhcmFtIHshZnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIHRvIGludm9rZSB3aXRoIGVhY2ggY2hpbGQgZm91bmQuXG4gKiBAcGFyYW0gez8qfSB0cmF2ZXJzZUNvbnRleHQgVXNlZCB0byBwYXNzIGluZm9ybWF0aW9uIHRocm91Z2hvdXQgdGhlIHRyYXZlcnNhbFxuICogcHJvY2Vzcy5cbiAqIEByZXR1cm4geyFudW1iZXJ9IFRoZSBudW1iZXIgb2YgY2hpbGRyZW4gaW4gdGhpcyBzdWJ0cmVlLlxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZUFsbENoaWxkcmVuSW1wbChjaGlsZHJlbiwgbmFtZVNvRmFyLCBjYWxsYmFjaywgdHJhdmVyc2VDb250ZXh0KSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGNoaWxkcmVuO1xuXG4gIGlmICh0eXBlID09PSAndW5kZWZpbmVkJyB8fCB0eXBlID09PSAnYm9vbGVhbicpIHtcbiAgICAvLyBBbGwgb2YgdGhlIGFib3ZlIGFyZSBwZXJjZWl2ZWQgYXMgbnVsbC5cbiAgICBjaGlsZHJlbiA9IG51bGw7XG4gIH1cblxuICBpZiAoY2hpbGRyZW4gPT09IG51bGwgfHwgdHlwZSA9PT0gJ3N0cmluZycgfHwgdHlwZSA9PT0gJ251bWJlcicgfHxcbiAgLy8gVGhlIGZvbGxvd2luZyBpcyBpbmxpbmVkIGZyb20gUmVhY3RFbGVtZW50LiBUaGlzIG1lYW5zIHdlIGNhbiBvcHRpbWl6ZVxuICAvLyBzb21lIGNoZWNrcy4gUmVhY3QgRmliZXIgYWxzbyBpbmxpbmVzIHRoaXMgbG9naWMgZm9yIHNpbWlsYXIgcHVycG9zZXMuXG4gIHR5cGUgPT09ICdvYmplY3QnICYmIGNoaWxkcmVuLiQkdHlwZW9mID09PSBSRUFDVF9FTEVNRU5UX1RZUEUpIHtcbiAgICBjYWxsYmFjayh0cmF2ZXJzZUNvbnRleHQsIGNoaWxkcmVuLFxuICAgIC8vIElmIGl0J3MgdGhlIG9ubHkgY2hpbGQsIHRyZWF0IHRoZSBuYW1lIGFzIGlmIGl0IHdhcyB3cmFwcGVkIGluIGFuIGFycmF5XG4gICAgLy8gc28gdGhhdCBpdCdzIGNvbnNpc3RlbnQgaWYgdGhlIG51bWJlciBvZiBjaGlsZHJlbiBncm93cy5cbiAgICBuYW1lU29GYXIgPT09ICcnID8gU0VQQVJBVE9SICsgZ2V0Q29tcG9uZW50S2V5KGNoaWxkcmVuLCAwKSA6IG5hbWVTb0Zhcik7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICB2YXIgY2hpbGQ7XG4gIHZhciBuZXh0TmFtZTtcbiAgdmFyIHN1YnRyZWVDb3VudCA9IDA7IC8vIENvdW50IG9mIGNoaWxkcmVuIGZvdW5kIGluIHRoZSBjdXJyZW50IHN1YnRyZWUuXG4gIHZhciBuZXh0TmFtZVByZWZpeCA9IG5hbWVTb0ZhciA9PT0gJycgPyBTRVBBUkFUT1IgOiBuYW1lU29GYXIgKyBTVUJTRVBBUkFUT1I7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgIG5leHROYW1lID0gbmV4dE5hbWVQcmVmaXggKyBnZXRDb21wb25lbnRLZXkoY2hpbGQsIGkpO1xuICAgICAgc3VidHJlZUNvdW50ICs9IHRyYXZlcnNlQWxsQ2hpbGRyZW5JbXBsKGNoaWxkLCBuZXh0TmFtZSwgY2FsbGJhY2ssIHRyYXZlcnNlQ29udGV4dCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBpdGVyYXRvckZuID0gZ2V0SXRlcmF0b3JGbihjaGlsZHJlbik7XG4gICAgaWYgKGl0ZXJhdG9yRm4pIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhdG9yRm4uY2FsbChjaGlsZHJlbik7XG4gICAgICB2YXIgc3RlcDtcbiAgICAgIGlmIChpdGVyYXRvckZuICE9PSBjaGlsZHJlbi5lbnRyaWVzKSB7XG4gICAgICAgIHZhciBpaSA9IDA7XG4gICAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgICBjaGlsZCA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgbmV4dE5hbWUgPSBuZXh0TmFtZVByZWZpeCArIGdldENvbXBvbmVudEtleShjaGlsZCwgaWkrKyk7XG4gICAgICAgICAgc3VidHJlZUNvdW50ICs9IHRyYXZlcnNlQWxsQ2hpbGRyZW5JbXBsKGNoaWxkLCBuZXh0TmFtZSwgY2FsbGJhY2ssIHRyYXZlcnNlQ29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgdmFyIG1hcHNBc0NoaWxkcmVuQWRkZW5kdW0gPSAnJztcbiAgICAgICAgICBpZiAoUmVhY3RDdXJyZW50T3duZXIuY3VycmVudCkge1xuICAgICAgICAgICAgdmFyIG1hcHNBc0NoaWxkcmVuT3duZXJOYW1lID0gUmVhY3RDdXJyZW50T3duZXIuY3VycmVudC5nZXROYW1lKCk7XG4gICAgICAgICAgICBpZiAobWFwc0FzQ2hpbGRyZW5Pd25lck5hbWUpIHtcbiAgICAgICAgICAgICAgbWFwc0FzQ2hpbGRyZW5BZGRlbmR1bSA9ICcgQ2hlY2sgdGhlIHJlbmRlciBtZXRob2Qgb2YgYCcgKyBtYXBzQXNDaGlsZHJlbk93bmVyTmFtZSArICdgLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyB3YXJuaW5nKGRpZFdhcm5BYm91dE1hcHMsICdVc2luZyBNYXBzIGFzIGNoaWxkcmVuIGlzIG5vdCB5ZXQgZnVsbHkgc3VwcG9ydGVkLiBJdCBpcyBhbiAnICsgJ2V4cGVyaW1lbnRhbCBmZWF0dXJlIHRoYXQgbWlnaHQgYmUgcmVtb3ZlZC4gQ29udmVydCBpdCB0byBhICcgKyAnc2VxdWVuY2UgLyBpdGVyYWJsZSBvZiBrZXllZCBSZWFjdEVsZW1lbnRzIGluc3RlYWQuJXMnLCBtYXBzQXNDaGlsZHJlbkFkZGVuZHVtKSA6IHZvaWQgMDtcbiAgICAgICAgICBkaWRXYXJuQWJvdXRNYXBzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJdGVyYXRvciB3aWxsIHByb3ZpZGUgZW50cnkgW2ssdl0gdHVwbGVzIHJhdGhlciB0aGFuIHZhbHVlcy5cbiAgICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICBjaGlsZCA9IGVudHJ5WzFdO1xuICAgICAgICAgICAgbmV4dE5hbWUgPSBuZXh0TmFtZVByZWZpeCArIEtleUVzY2FwZVV0aWxzLmVzY2FwZShlbnRyeVswXSkgKyBTVUJTRVBBUkFUT1IgKyBnZXRDb21wb25lbnRLZXkoY2hpbGQsIDApO1xuICAgICAgICAgICAgc3VidHJlZUNvdW50ICs9IHRyYXZlcnNlQWxsQ2hpbGRyZW5JbXBsKGNoaWxkLCBuZXh0TmFtZSwgY2FsbGJhY2ssIHRyYXZlcnNlQ29udGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGFkZGVuZHVtID0gJyc7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBhZGRlbmR1bSA9ICcgSWYgeW91IG1lYW50IHRvIHJlbmRlciBhIGNvbGxlY3Rpb24gb2YgY2hpbGRyZW4sIHVzZSBhbiBhcnJheSAnICsgJ2luc3RlYWQgb3Igd3JhcCB0aGUgb2JqZWN0IHVzaW5nIGNyZWF0ZUZyYWdtZW50KG9iamVjdCkgZnJvbSB0aGUgJyArICdSZWFjdCBhZGQtb25zLic7XG4gICAgICAgIGlmIChjaGlsZHJlbi5faXNSZWFjdEVsZW1lbnQpIHtcbiAgICAgICAgICBhZGRlbmR1bSA9IFwiIEl0IGxvb2tzIGxpa2UgeW91J3JlIHVzaW5nIGFuIGVsZW1lbnQgY3JlYXRlZCBieSBhIGRpZmZlcmVudCBcIiArICd2ZXJzaW9uIG9mIFJlYWN0LiBNYWtlIHN1cmUgdG8gdXNlIG9ubHkgb25lIGNvcHkgb2YgUmVhY3QuJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoUmVhY3RDdXJyZW50T3duZXIuY3VycmVudCkge1xuICAgICAgICAgIHZhciBuYW1lID0gUmVhY3RDdXJyZW50T3duZXIuY3VycmVudC5nZXROYW1lKCk7XG4gICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgIGFkZGVuZHVtICs9ICcgQ2hlY2sgdGhlIHJlbmRlciBtZXRob2Qgb2YgYCcgKyBuYW1lICsgJ2AuJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBjaGlsZHJlblN0cmluZyA9IFN0cmluZyhjaGlsZHJlbik7XG4gICAgICAhZmFsc2UgPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnT2JqZWN0cyBhcmUgbm90IHZhbGlkIGFzIGEgUmVhY3QgY2hpbGQgKGZvdW5kOiAlcykuJXMnLCBjaGlsZHJlblN0cmluZyA9PT0gJ1tvYmplY3QgT2JqZWN0XScgPyAnb2JqZWN0IHdpdGgga2V5cyB7JyArIE9iamVjdC5rZXlzKGNoaWxkcmVuKS5qb2luKCcsICcpICsgJ30nIDogY2hpbGRyZW5TdHJpbmcsIGFkZGVuZHVtKSA6IF9wcm9kSW52YXJpYW50KCczMScsIGNoaWxkcmVuU3RyaW5nID09PSAnW29iamVjdCBPYmplY3RdJyA/ICdvYmplY3Qgd2l0aCBrZXlzIHsnICsgT2JqZWN0LmtleXMoY2hpbGRyZW4pLmpvaW4oJywgJykgKyAnfScgOiBjaGlsZHJlblN0cmluZywgYWRkZW5kdW0pIDogdm9pZCAwO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdWJ0cmVlQ291bnQ7XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXMgYHByb3BzLmNoaWxkcmVuYCwgYnV0XG4gKiBtaWdodCBhbHNvIGJlIHNwZWNpZmllZCB0aHJvdWdoIGF0dHJpYnV0ZXM6XG4gKlxuICogLSBgdHJhdmVyc2VBbGxDaGlsZHJlbih0aGlzLnByb3BzLmNoaWxkcmVuLCAuLi4pYFxuICogLSBgdHJhdmVyc2VBbGxDaGlsZHJlbih0aGlzLnByb3BzLmxlZnRQYW5lbENoaWxkcmVuLCAuLi4pYFxuICpcbiAqIFRoZSBgdHJhdmVyc2VDb250ZXh0YCBpcyBhbiBvcHRpb25hbCBhcmd1bWVudCB0aGF0IGlzIHBhc3NlZCB0aHJvdWdoIHRoZVxuICogZW50aXJlIHRyYXZlcnNhbC4gSXQgY2FuIGJlIHVzZWQgdG8gc3RvcmUgYWNjdW11bGF0aW9ucyBvciBhbnl0aGluZyBlbHNlIHRoYXRcbiAqIHRoZSBjYWxsYmFjayBtaWdodCBmaW5kIHJlbGV2YW50LlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgb2JqZWN0LlxuICogQHBhcmFtIHshZnVuY3Rpb259IGNhbGxiYWNrIFRvIGludm9rZSB1cG9uIHRyYXZlcnNpbmcgZWFjaCBjaGlsZC5cbiAqIEBwYXJhbSB7Pyp9IHRyYXZlcnNlQ29udGV4dCBDb250ZXh0IGZvciB0cmF2ZXJzYWwuXG4gKiBAcmV0dXJuIHshbnVtYmVyfSBUaGUgbnVtYmVyIG9mIGNoaWxkcmVuIGluIHRoaXMgc3VidHJlZS5cbiAqL1xuZnVuY3Rpb24gdHJhdmVyc2VBbGxDaGlsZHJlbihjaGlsZHJlbiwgY2FsbGJhY2ssIHRyYXZlcnNlQ29udGV4dCkge1xuICBpZiAoY2hpbGRyZW4gPT0gbnVsbCkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgcmV0dXJuIHRyYXZlcnNlQWxsQ2hpbGRyZW5JbXBsKGNoaWxkcmVuLCAnJywgY2FsbGJhY2ssIHRyYXZlcnNlQ29udGV4dCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHJhdmVyc2VBbGxDaGlsZHJlbjsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvUmVhY3QnKTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XHJcblxyXG52YXIgQXB0TGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICBoYW5kbGVEZWxldGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5wcm9wcy5vbkRlbGV0ZSh0aGlzLnByb3BzLndoaWNoSXRlbSk7XHJcbiAgfSxcclxuICBoYW5kbGVFZGl0OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucHJvcHMub25FZGl0KHRoaXMucHJvcHMud2hpY2hJdGVtKTtcclxuICB9LFxyXG4gIGhhbmRsZVJ1bjogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnByb3BzLm9uUnVuKHRoaXMucHJvcHMud2hpY2hJdGVtKTtcclxuICB9LFxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgcGFyYW1zID0gJyc7XHJcbiAgICBpZiAodGhpcy5wcm9wcy5zaW5nbGVJdGVtLmFsbG93UGFyYW1zID09ICd0cnVlJykge1xyXG4gICAgICBwYXJhbXMgPSAnIFtwYXJhbXNdJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmFtcyA9ICcnXHJcbiAgICB9XHJcbiAgICByZXR1cm4oXHJcbiAgICAgIDxsaSBjbGFzc05hbWU9XCJwZXQtaXRlbSBtZWRpYVwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWVkaWEtbGVmdFwiPlxyXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJwZXQtZGVsZXRlIGJ0biBidG4teHMgYnRuLWRhbmdlclwiIG9uQ2xpY2s9e3RoaXMuaGFuZGxlRGVsZXRlfT5cclxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlXCI+PC9zcGFuPjwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWVkaWEtbGVmdFwiPlxyXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJwZXQtZWRpdCBidG4gYnRuLXhzIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17dGhpcy5oYW5kbGVFZGl0fT5cclxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tcGVuY2lsXCI+PC9zcGFuPjwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWVkaWEtbGVmdFwiPlxyXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJwZXQtZWRpdCBidG4gYnRuLXhzIGJ0bi1zdWNjZXNzXCIgb25DbGljaz17dGhpcy5oYW5kbGVSdW59PlxyXG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbGF5XCI+PC9zcGFuPjwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGV0LWluZm8gbWVkaWEtYm9keVwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwZXQtaGVhZFwiPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwZXQtbmFtZVwiPnt0aGlzLnByb3BzLnNpbmdsZUl0ZW0udHJpZ2dlcn08L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFwdC1kYXRlIHB1bGwtcmlnaHRcIj57dGhpcy5wcm9wcy5zaW5nbGVJdGVtLnZvaWNlfTwvc3Bhbj5cclxuICAgICAgICAgICAgPHA+PC9wPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhcHQtZGF0ZSBwdWxsLXJpZ2h0XCI+e3RoaXMucHJvcHMuc2luZ2xlSXRlbS5ncm91bmR9PC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm93bmVyLW5hbWVcIj48c3BhbiBjbGFzc05hbWU9XCJsYWJlbC1pdGVtXCI+Q29tbWFuZDo8L3NwYW4+XHJcbiAgICAgICAgICAgIHt0aGlzLnByb3BzLnNpbmdsZUl0ZW0uY29tbWFuZH17cGFyYW1zfTwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhcHQtbm90ZXNcIj57dGhpcy5wcm9wcy5zaW5nbGVJdGVtLmFwdE5vdGVzfTwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2xpPlxyXG4gICAgKVxyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwdExpc3Q7XHJcbiJdfQ==
