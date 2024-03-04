const express = require("express");
const methodOverride = require("method-override");
require('dotenv').config();
const database = require("./config/database");

const routeAdmin = require("./routes/admin/index.route");
const route = require("./routes/client/index.route");

const systemConfig = require("./config/system");

database.connect();

const app = express();
const port = process.env.PORT;

app.use(methodOverride(`_method`));

app.set("views", "./views");
app.set("view engine", "pug");

// App locals variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.use(express.static('public'));

//Routes
routeAdmin(app);
route(app);

app.listen(port,()=>{
    console.log(`App listening on port ${port}`);
});