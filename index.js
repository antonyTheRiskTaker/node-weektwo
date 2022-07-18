// Require all of the libraries needed

// In-built Node Modules
const fs = require("fs");
const path = require("path");

// NPM installed modules
const basicAuth = require("express-basic-auth");
const { create } = require("express-handlebars");

const express = require("express");
const app = express();

// Get all user generated modules into the application

// (Line below) the stores directory serves as an in-server database (not the best practice)
// (Line below) the config is used to access some data that is not supposed to be accessed directly
const config = require("./stores/config.json")["development"]; // We use all the development paths
const AuthChallenger = require("./AuthChallenger");
const NoteService = require("./Service/NoteService");
const NoteRouter = require("./Router/NoteRouter");

//The code below returns the current year
const hbs = create({
  helpers: {
    year() {
      return new Date().getFullYear();
    },
  },
});

// Set up handlebars as our view engine - handlebars will responsible for rendering our HTML
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Serves the public directory to the root of our server
app.use(express.static("public"));

// Set up middleware
// (Two lines below) these middlewares are used to process data sent via POST requests
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set up basic auth
app.use(
  basicAuth({
    authorizer: AuthChallenger(
      JSON.parse(fs.readFileSync(path.join(__dirname, config.users)))
    ), // we are defining the file where our users exist with this code: JSON.parse(fs.readFileSync(path.join(__dirname, config.users))), we also parse the data so that we can iterate over each user like a JavaScript variable/ object.
    challenge: true,
    realm: "Note Taking Application",
  })
);

// Create a new instance of noteService and pass the file path/to/the/file where you want the service to read from and write to.
const noteService = new NoteService(path.join(__dirname, config.notes), fs);

// Responsible for sending our index page back to our user.
app.get("/", (req, res) => {
  console.log(req.auth.user, req.auth.password);
  noteService.list(req.auth.user).then((data) => {
    res.render("index", {
      user: req.auth.user,
      notes: data,
    });
  });
});

// Set up the NoteRouter - handle the requests and responses in the note, read from a file and return the actual data, get the note from your JSON file and return to the clients browser.
app.use("/api/notes", new NoteRouter(noteService, express).router()); //sending our data

// Set up the port that we are going to run the application on, therefore the port that we can view the application from our browser.
app.listen(config.port, () =>
  console.log(`Note Taking application listening to port ${config.port}`)
);
