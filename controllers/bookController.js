const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");

const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  // Because the queries for document counts are independent of each other
  // we use Promise.all() to run them in parallel.
  // The method returns a new promise that we await for completion
  const [
    numBooks, numBookInstances, numAvailableBookInstances, numAuthors, numGenres
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec()
  ]);
  res.render('index', {
    title: 'Local Library Home',
    book_count: numBooks,
    book_instance_count: numBookInstances,
    available_book_instance_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres
  })
  // If any of the database operations fail, the exception that is thrown will be caught by asyncHandler()
  // and passed to the next middleware handler in the chain.
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  // Get books information from DB
  // Get title and author only. It will also return the _id and virtual fields
  const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    // Populate only first_name and family_namr from author. We Don't need data of birth or death
    .populate("author", "first_name family_name")
    .exec();
  res.render('book_list', { title: 'Book List', book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  try {
    const [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id)
        .populate('author', 'first_name family_name')
        .populate('genre', 'name')
        .exec(),
      BookInstance.find({ book: req.params.id }, 'imprint due_back status').exec()
    ])
    if (book === null) {
      const err = new Error("Book not found")
      err.status = 404;
      throw err;
    }
    res.render('book_detail', { title: 'book_detail', book: book, book_instances: bookInstances })
  }
  catch (err) {
    next(err);
  }
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  // We need to fetch all authors and geners to display them in the form
  // To let the admin pick the names form the provided names.
  const [allAuthors, allGenres] = await Promise.all([
    // We used await Promise.all() to make the two operations in paralle.
    // If we didn;t use Promise.all and use instade await process1 and await process2
    // they will done in sequence.
    Author.find({}, 'first_name family_name').sort({ first_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec()
  ]);
  res.render('book_form', {
    title: 'Create Book',
    authors: allAuthors,
    genres: allGenres
  });
});

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      // We need to make genre to an array because the validation process assumes that
      // genre is an array. So, we need to make it an array even if it was only one string
      // If the admin chosed only one genre for the book, it will be a string not array
      req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
    }
    // Do not forget next()
    next();
  },
  body('title', 'Title must be not empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must be nit empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must be nit empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('genre.*')
    .trim()
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find({}, 'first_name family_name').sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      for (const genre of allGenres) {
        if (book.genre.includes(genre.id)) {
          genre.checked = 'true';
        }
      }

      res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    }
    else {

      await book.save();
      res.redirect(book.url);
    }
  }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id, 'title author').populate('author').exec(),
    BookInstance.find({ book: req.params.id }, 'imprint').exec()
  ]);
  res.render('book_delete', {
    title: 'Delete Book',
    book: book,
    book_instances: allBookInstances
  })
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id, 'title author').populate('author').exec(),
    BookInstance.find({ book: req.params.id }, 'book imprint').populate('book', 'title').exec()
  ]);
  if (allBookInstances.length > 0) {
    res.render('book_delete', {
      title: 'Delete Book',
      book: book,
      book_instances: allBookInstances
    });
  }
  else {
    await Book.findByIdAndDelete(req.body.bookid);
    res.redirect('/catalog/books');
  }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  // Mark our selected genres as checked.
  allGenres.forEach((genre) => {
    if (book.genre.includes(genre._id)) genre.checked = "true";
  });

  res.render("book_form", {
    title: "Update Book",
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});


// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty")
    .trim().
    isLength({ min: 1 })
    .escape(),
  body("genre.*")
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find({}, 'first_name family_name').sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      for (const genre of allGenres) {
        if (book.genre.includes(genre.id)) {
          genre.checked = 'true';
        }
      }

      res.render('book_form', {
        title: 'Update Book',
        book: book,
        authors: allAuthors,
        genres: allGenres,
        errors: errors.array()
      })
    }
    else {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
      res.redirect(updatedBook.url);
    }
  })
]
