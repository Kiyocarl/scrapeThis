var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/mongoHeadlines", { useNewUrlParser: true });
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);
// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.ebony.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every List-item within an article tag, and do the following:
    $(".list-item").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("h3")
        .text();
      result.link = $(this)
        .find("a")
        .attr("href");

      // Create a new list-item using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbListItem) {
          // View the added result in the console
          console.log(dbListItem);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all list-item from the db
app.get("/list-item", function(req, res) {
  // TODO: Finish the route so it grabs all of the list-item
  db.Article.find({})
    .then(ListItem => res.json(ListItem))
    .catch(err => {
      console.log(err);
      res.json(err);
    });
});

// Route for grabbing a specific List-item by id, populate it with it's note
app.get("/list-item/:id", function(req, res) {
  // TODO
  // ====

  // Finish the route so it finds one list-item using the req.params.id,
  // and run the populate method with "note",
  // then responds with the list-item with the note included
  db.Article.findById(req.params.id)
    .populate("note")
    .then(ListItem => res.json(ListItem))
    .catch(err => {
      console.log(err);
      res.json(err);
    });
});

// Route for saving/updating an list-item associated Note
app.post("/list-item/:id", function(req, res) {
  // TODO
  // ====

  db.Note.create(req.body)
    .then(dbNoteInfo => {
      return db.Article.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            note: dbNoteInfo._id
          }
        },
        { new: true }
      );
    })
    .then(dbListItem => res.json(dbListItem))
    .catch(err => {
      console.log(err);
      res.json(err);
    });
});
app.post("/savenote", function(req, res) {
  // TODO
  // ====

  db.Note.create(req.body)
    .then(dbListItem => res.json(dbListItem))
    .catch(err => {
      console.log(err);
      res.json(err);
    });

  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  // db.Note.find({})
  // .populate("notes")
  // .then(dbNoteInfo => res.json(dbNoteInfo))
  // .catch(err => {
  //   console.log(err);
  // })
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
