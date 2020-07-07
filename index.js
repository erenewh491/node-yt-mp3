require("dotenv/config");

const path = require("path");
const express = require("express");
const exphbs = require("express-handlebars");
const app = express();

//listening connection
const Port = process.env.PORT || 3000;
app.listen(Port, '0.0.0.0', () => {
  console.log(`Env Port: ${process.env.PORT}`);
  console.log(`Working with port ${Port}`)
});

// body parser
const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());


//cookie parser
var cookieParser = require('cookie-parser')
app.use(cookieParser());

// routes
const DashboardRoute = require('./dashboard/login');
app.use('/', DashboardRoute);

const ApiRoute = require("./api/index");
app.use("/api", ApiRoute);

const AdminRoute = require("./admin/admin");
app.use("/adminpanel", AdminRoute);

// downloadable get
app.get('/api/path/output/:folder/:name', (req, res) => {
  const file = `${__dirname}/api/path/output/${req.params.folder}/${req.params.name}`
  res.download(file);
});



// handlebars

app.engine("handlebars", exphbs({
  helpers: {
    bool: function (value) {
      return value !== false;
    }
  }
}));
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "handlebars");


// 404 page
app.use(express.static('./views/layouts/img'));

app.get("*", (req, res) => {
  if (req.url !== '/404') return res.redirect('/404');
  return res
    .render('Error');
});