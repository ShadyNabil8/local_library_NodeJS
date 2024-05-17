const Author = require("../models/author");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");


// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "Author List",
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  try {
    const [author, authorBooks] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id }, 'title summary').exec()
    ]);
    if (author === null) {
      const err = new Error("Author not found");
      throw err;
    }
    res.render('author_detail', {
      title: 'Author datail',
      author: author,
      author_books_list: authorBooks
    })
  }
  catch (err) {
    next(err);
  }
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
});

// Handle Author create on POST.
exports.author_create_post = [
  body("first_name", 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("family_name", 'Family name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" }) // means that we'll accept either an empty string or null as an empty value)
    .isISO8601()
    .toDate(), // to cast these to the proper JavaScript types
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });
    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Author form',
        author: author,
        errors: errors.array()
      })
    }
    else {
      const autherExist = await Author.findOne({
        first_name: author.first_name,
        family_name: author.family_name
      }).collation({ locale: 'en', strength: 2 })
        .exec();
      if (autherExist) {
        res.redirect(autherExist.url)
      }
      else {
        await author.save()
        res.redirect(author.url);
      }
    }
  })
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Author delete GET");
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Author delete POST");
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Author update GET");
});

// Handle Author update on POST.
exports.author_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Author update POST");
});
