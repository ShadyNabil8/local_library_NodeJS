const Genre = require("../models/genre");
const Book = require('../models/book')
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");


// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find({}).exec();
  res.render('genre_list', { title: "Genre List", genre_list: allGenres });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  try {
    const [genre, booksInGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }, 'title summary').exec()
    ]);
    if (!genre) {
      const err = new Error("Genre not found")
      err.status = 404;
      throw err;
    }
    res.render('genre_detail', {
      title: "Genre Detail",
      genre: genre,
      genre_books: booksInGenre,
    })
  }
  catch (err) {
    res.next(err)
  }
});

// Display Genre create form on GET.
exports.genre_create_get = ((req, res, next) => {
  // We don't need the asyncHandler() wrapper for this route,
  // because it doesn't contain any code that can throw an exception.
  res.render("genre_form", { title: "Create Genre" });
});

// Handle Genre create on POST.
exports.genre_create_post = [
  body('name', 'Genre name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(), // to remove any dangerous HTML characters).

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req); console.log(errors); console.log("===="); console.log(errors.array());
    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });
    // There are errors
    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array()
      });
      return;
    }
    else {
      const genreExist = await Genre.findOne({ name: req.body.name })
        .collation({ locale: 'en', strength: 2 })
        .exec();
      // The genre alrady exist
      if (genreExist) {
        res.redirect(genreExist.url)
      }
      else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get the genre by id and the books associated with it if exists.
  const [genre, allBooksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, 'title summary').exec()
  ]);
  if (genre) {
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre: genre,
      genre_books: allBooksInGenre
    });
  }
  else {
    res.redirect('/catalog/genres')
  }
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of genre and all their books (in parallel)
  const [genre, allBooksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, 'title summary').exec()
  ]);
  if (allBooksInGenre.length > 0) {
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre: genre,
      genre_books: allBooksInGenre
    })
  }
  else {
    await Genre.findByIdAndDelete(req.body.genreid);
    res.redirect('/catalog/genres')
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  res.render('genre_form', {
    title: 'Updata Genre',
    genre: genre,
  })
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name', 'Genre name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Updata Genre',
        genre: genre,
        errors: errors.array()
      })
    }
    else {
      const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
      res.redirect(updatedGenre.url);
    }
  })
]