![Build Status](https://github.com/jwalton/node-promise-breaker/workflows/GitHub%20CI/badge.svg)

## What is it?

`promise-breaker` is intended for library authors and makes it easy to write functions that will accept an optional callback, or return a Promise if a callback is not provided. You can use callbacks or Promises in your implementation, and callers can call with either a callback or expect a Promise. It's a library that makes it easy to write libraries for others.

`promise-breaker` is also often handy when refactoring a legacy codebase that uses callbacks into something promise based. You can rewrite a callback based function into a promise based function, and then `callbackify` it, which means existing callers can still call into it, and you don't have to refactor the whole codebase in one go.

## Installation

```sh
npm install --save promise-breaker
```

## Summary

If you're a library author, it's nice to be able to provide your clients with a library that will take an optional callback, and if the callback isn't provided, return a Promise. If you've ever tried to do this, you know that there's a lot of finicky boilerplate involved in every function you write.

'promise-breaker' makes this really easy. If you prefer writing in callback style:

```js
export const myFunc = pb.promisify((done = null) => {
  doThing((err, thing) => {
    if (err) {
      return done(err);
    }
    doOtherThing(thing, (err, otherThing) => {
      if (err) {
        return done(err);
      }
      done(null, otherThing);
    });
  });
});
```

or if you prefer Promise style:

```js
export const myFunc = pb.callbackify(() => {
  doThing().then((result) => doOtherThing(result));
});
```

The other thing you often want to do when writing a library is call into a function without knowing whether
it returns a promise or expects a callback. Again, promise-breaker makes this easy:

```js
export async function doStuff(fn) {
  // This works just like `fn.call` except it will add a `done` callback to the
  // parameters passed to `fn`, and then automatically work out whether `fn`
  // returns a promise or calls the callback.
  await pb.call(fn, null, 'hello world');
}
```

## API

<a name="promisify"></a>

### promisify(fn)
Given a function that expects a callback, return a new function that accepts a
callback or returns a promise depending on how it is called.

This is similar to node.js's `util.promisify` but this will generate a function
that can be called with or without a callback, and will return a Promise either way.
Unlike the node version of `promisify`, this version will automatically
correctly handle the case where the function is being defined on an class.
Also, this version is typescript compatible with any function, where the the
`@types/node` definition only works with function with up to five parameters.

`promisify` works by always adding a callback onto the list of arguments
passed down to your function.  If the caller doesn't pass a callback, this
added callback will be passed to your function, and will be used to resolve
or reject the returned `Promise`.  If the caller provides a callback, then
your function will get (and ignore) the extra callback that `promisify` adds
at the end.

Technically the function will always return a Promise, regardless of whether or
not a callback is passed in, but if a callback is passed in the return Promise
will never resolve (instead we call into the callback).

**Kind**: global function  

| Param | Description |
| --- | --- |
| fn | The function to promisify. |

<a name="callbackify"></a>

### callbackify([opts], fn)
`callbackify` is the opposite of `promisify`; it takes a function that returns
a promise, and makes it so it can be called with either a promise or a callback.

Callbackify works by calling the underlying function and then returning the
promise directly, or calling into the provided callback.

In order for this to work, `callbackify` needs to detect if a callback was
included in the parameter list and remove it for the promise case. By default,
`callbackify` will always assume that if the last parameter passed in is a
function, then that function is a callback function. In most cases then you can do:

```js
const newFunc = callbackify(async function (foo, bar) => ...);
```

But, sometimes you might want to `callbackify` a function that takes a
non-callback function as it's final parameter.  In this case, you need to
specify the number of arguments the function you're trying to `callbackify`
expects:

```js
const newFunc = callbackify({ args: 2 }, async function(fn1, fn2) => ...);
```

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>args</code> | An `` object specifying how many arguments your function   expects. |
| fn |  | The async function to call. |

<a name="apply"></a>

### apply(fn, thisArg, args, [cb]) ⇒
`apply` is analagous to `Function.prototype.apply`, but you can use it to
call a function when you don't know in advance whether the function expects
a callback or will return a Promise. This is useful when writing a library
and you want to call into functions provided by your end user.

**Kind**: global function  
**Returns**: - If the underlying `fn` returns a Promise, this will return that
  Promise.  Otherwise returns a Promise which will resolve or reject when the
  callback is called.  

| Param | Description |
| --- | --- |
| fn | The function to call. |
| thisArg | The `this` parameter to provide to the function. |
| args | The parameters to pass to the function.  A callback function   will automatically be added to this list of parameters. |
| [cb] | The callback function to call. |

<a name="call"></a>

### call(fn, thisArg, args) ⇒
`call` is analagous to `Function.prototype.call`.  See `apply` for details.

**Kind**: global function  
**Returns**: - If the underlying `fn` returns a Promise, this will return that
  Promise.  Otherwise returns a Promise which will resolve or reject when the
  callback is called.  

| Param | Description |
| --- | --- |
| fn | The function to call. |
| thisArg | The `this` parameter to provide to the function. |
| args | The parameters to pass to the function.  A callback function   will automatically be added to this list of parameters. |

<a name="addPromise"></a>

### addPromise(done, fn) ⇒
Add a promise to a function that returns a callback.

**Kind**: global function  
**Returns**: If a callback is provided, returns undefined. Otherwise returns a Promise.  

| Param | Description |
| --- | --- |
| done | The callback provided by your function's caller, or undefined if   no callback was provided. |
| fn | A callback function to call as the implementation for your function. |

**Example**  
```js
export function addNumbers(a: number, b: number): Promise<number>;
    export function addNumbers(a: number, b: number, done: Callback<number>): void;
    export function addNumbers(
        a: number,
        b: number,
        done?: Callback<number>
    ): Promise<number> | undefined {
        return addPromise(done, (done) => done(null, a + b));
    }

    addNumbers(1, 2, (err, result) => console.log(result));
    addNumbers(1, 2).then((result) => console.log(result));
```
<a name="addCallback"></a>

### addCallback(done, fn) ⇒
Add a callback to a function that returns a promise.

**Kind**: global function  
**Returns**: If a callback is provided, returns undefined. Otherwise returns a Promise.  

| Param | Description |
| --- | --- |
| done | The callback provided by your function's caller, or undefined if   no callback was provided. |
| fn | An async function to call as the implementation for your function. |

**Example**  
```js
export function addNumbers(a: number, b: number): Promise<number>;
    export function addNumbers(a: number, b: number, done: Callback<number>): void;
    export function addNumbers(
        a: number,
        b: number,
        done?: Callback<number>
    ): Promise<number> | undefined {
        return addCallback(done, async () => return a + b);
    }

    addNumbers(1, 2, (err, result) => console.log(result));
    addNumbers(1, 2).then((result) => console.log(result));
```
