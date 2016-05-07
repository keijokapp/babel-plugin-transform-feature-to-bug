# babel-plugin-transform-feature-to-bug

Add bugs to the your *hopefully* working javascript. This is my first real NPM package (still unpublished though).

# Transforms

Transforms are applied pseudorandomly. Use `probability` plugin option to change probability. Default is `0.2`. I'm looking for way to cache locations of transformed and untransformed code/AST nodes to keep result similar across multiple compilations.

## Expressions

 * Transform `==` to `===` and vice versa.
 * Transform `>=` and `<=` to `>` and `<` respectively and vice versa.
 * Transform `++a` to `a++` and vice versa.
 * Remove unary `+` operator.
 * Transform `>>>` and `>>>=` to `>>` and `>>=` and vice versa.
 * Transform `typeof` expression to `"object"` literal.
 * Transform `instanceof` expression to `true` literal.
 * Transform `new a(...)` to `a.call({ }, ...)`.
 * Transform `delete a.b` expression to `a.b = undefined`.
 * Transform `a.length` to `a.length + 1` (except when lvalue is detected).
 * Wrap resolve and reject functions with `setTimeout` in `new Promise(a)`.
 * Transform `Promise.resolve(...)` and `Promise.reject(...)` to `new Promise((resolve, reject) => { resolve(...); })` and `new Promise((resolve, reject) => { resolve(...); })` so it will be retransformed by `new Promise` transformation.

### Unimplemented

 * Replace some arguments with `{}` (empty object) on function call.
 * Replace function callback with `() => { }`
 * Transform `new *Error` calls to object with gibberish properties.

## Declarations

### Unimplemented

 * Transform variable declaration to `global.var` definition.
 * `bind` `this` variable to arbitrary variable on function creation.

# Contribution

Any ideas and code are welcome.

# Installation

```sh
$ npm install babel-plugin-transform-feature-to-bug@https://github.com/keijokapp/babel-plugin-transform-feature-to-bug
```

# Usage

```javascript
require("babel-core").transform("code", {
	plugins: [
		[ "transform-feature-to-bug", { probability: 0.2 } ]
	]
});
```

# Testing

Seriously?

This is few hours project (including reading babel docs) which didn't leave me much time to set up automatic testing.
