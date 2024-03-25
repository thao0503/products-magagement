const express = require("express");
const methodOverride = require("method-override");
const bodyParser= require("body-parser");
require('dotenv').config();
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require('express-flash');

const routeAdmin = require("./routes/admin/index.route");
const route = require("./routes/client/index.route");

const systemConfig = require("./config/system");

database.connect();

const app = express();
const port = process.env.PORT;

app.use(methodOverride(`_method`));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))


app.set("views", "./views");
app.set("view engine", "pug");

// Flash
app.use(cookieParser('DJKFJDKFIRHDD'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
// End Flash

// App locals variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.use(express.static('public'));

//Routes
routeAdmin(app);
route(app);

app.listen(port,()=>{
    console.log(`App listening on port ${port}`);
});