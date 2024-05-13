# I have learned these:

These will be some notes that I faced while developing this project

## difference between module.exports & exports

exports: This is a shorthand for ```module.exports```. It's initially set to reference the same object as ```module.exports```, but if you assign a value directly to ```exports```, it will break the reference between ```exports``` and ```module.exports```.

For example:

```js
// module.js
exports.foo = 'bar';
```

In this case, exports is still referencing the same object as module.exports, so when you require this module, you'll get an object with a foo property set to 'bar'.

However, if you were to do something like this:

```js
// module.js
exports = {
    foo: 'bar'
};
```

In this case, you're reassigning ```exports``` to a new object, breaking the reference with ```module.exports```. So when you require this module, you won't get the object with the foo property; instead, you'll get an empty object. This is because require returns ```module.exports```, not ```exports```.

## The order of the routes in the code

If we have routes like these

```js
// GET request for creating a Book. NOTE This must come before routes that display Book (uses id).
router.get("/book/create", book_controller.book_create_get);

// GET request for one Book.
router.get("/book/:id", book_controller.book_detail);
```

The route ```/book/create``` must come before ```/book/:id``` because if the ```/book/:id``` comes first, it will matches the ```/book/create"```. But not vice versa
