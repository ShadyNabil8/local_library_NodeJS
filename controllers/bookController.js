const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

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
  res.render('books', { title: 'book_list', book_list: allBooks });
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
  res.send("NOT IMPLEMENTED: Book create GET");
});

// Handle book create on POST.
exports.book_create_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book create POST");
});

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book delete GET");
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book delete POST");
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book update GET");
});

// Handle book update on POST.
exports.book_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book update POST");
});
