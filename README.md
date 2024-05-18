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

## Making two independent requests

If the two requests do not depend on each other, we use Promise.all() to run the database queries in parallel

uses Promise.all to fetch the genre and its books in parallel, which is more efficient as it reduces the total wait time by running both queries concurrently.

***Not*** efficient code
```js
const selectedGenre = await Genre.findById(req.params.id);
const allbooks = await Book.find({ genre: selectedGenre }, 'title summary').populate('genre')
```

efficient code
```js
const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, 'title summary').exec()
]);
```
## cross-site scripting VS Cross-site request forgery
Cross-Site Request Forgery (CSRF) attacks occur when an attacker tricks a user's browser into making an unintended request to a different website where the user is authenticated.

Unlike cross-site scripting (XSS), which exploits the trust a user has for a particular site, CSRF exploits the trust that a site has in a user's browser.

## How can POST request prevent CSRF?
* **Token Generation:** When a user visits a website, the server generates a unique token and includes it in the user's session in the server.
* **Token Validation:** For every state-changing request (usually POST requests), the server includes this token in the generated form (often as a hidden field). When the form is submitted, the token is sent back to the server.
```html
<form action="/update-profile" method="post">
    <!-- Other form fields -->
    <input type="hidden" name="csrf_token" value="generated_csrf_token_here">
    <button type="submit">Update Profile</button>
</form>
```
* **Server-Side Check:** The server verifies the token against the one stored in the user's session. If the token is missing or invalid, the request is rejected.

## Can't we send the form (state-changing request) using GET?

Technically, you can send form data using a GET request, but it's not recommended, especially for state-changing actions. Here's why:

1. **Security Concerns**: Using GET requests for state-changing actions can expose sensitive data as the form fields are appended to the URL. This makes the data visible in browser history, server logs, and potentially to malicious actors.

2. **Limitation on Data Size**: GET requests have limitations on the amount of data that can be sent, typically around 2,048 characters. This restricts the amount of form data you can include.

3. **Security Best Practices**: For security reasons and to adhere to RESTful principles, it's a best practice to use POST requests for actions that modify data on the server. This helps differentiate between safe (GET) and unsafe (POST, PUT, DELETE, etc.) operations.

4. **CSRF Vulnerabilities**: Using GET requests for state-changing actions does not inherently mitigate Cross-Site Request Forgery (CSRF) vulnerabilities. CSRF attacks can still be executed against GET requests, making them less secure for sensitive actions. Why?
    * GET requests typically include parameters in the URL itself. For example, when you submit a form using a GET request, the form data is appended to the URL as query parameters.
    * GET requests are more likely to be cached by browsers or pre-fetched by web browsers or proxy servers. This behavior can lead to unintended execution of actions without the user's explicit interaction.
    * GET requests are often bookmarked by users or saved in their browsing history. If a user bookmarks a page containing a state-changing GET request (e.g., deleting a record), they might unintentionally trigger that action when revisiting the bookmark.
    * GET requests are meant to be idempotent, meaning they should not have any side effects on the server's state. However, this isn't always enforced, and developers might inadvertently design APIs or endpoints that perform state-changing actions with GET requests.

When a form is submitted via POST request, the CSRF token is sent along with the request data in ```the body``` of the HTTP request. However, with GET requests, form data is included in the ```URL```, not in the request body. 

## Node.JS Middlewares

The entire idea of middleware is to execute some code before the controller action that sends the response and after the server gets the request from the client.

[How To Use And Write Express Middleware
](https://blog.webdevsimplified.com/2019-12/express-middleware-in-depth/)

