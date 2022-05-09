const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server");
const layouts = require("express-ejs-layouts");
const axios = require("axios")

// *********************************************************** //
//  Loading models
// *********************************************************** //
const Order = require("./models/Order");
const MenuItem = require("./models/MenuItem");


// *********************************************************** //
//  Connecting to the database
// *********************************************************** //

const mongoose = require( 'mongoose' );
//const mongodb_URI = 'mongodb://localhost:27017/cs103a_todo'
const mongodb_URI = 'mongodb://lulululu:lululemon666!@cluster0-shard-00-00.tasij.mongodb.net:27017,cluster0-shard-00-01.tasij.mongodb.net:27017,cluster0-shard-00-02.tasij.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-kharvs-shard-0&authSource=admin&retryWrites=true&w=majority'

dbConnect().catch(err => console.log(err));

async function dbConnect() {
  await mongoose.connect(mongodb_URI);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});

// *********************************************************** //
// Initializing the Express server
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// this allows us to use page layout for the views
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //
// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
const { deflateSync } = require("zlib");
app.use(auth)

// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  }
  else res.redirect('/login')
}

// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.redirect('/orderList')
});

app.get("/orderList", async (req, res, next) => {
  //FIXME: TEMPORARY SET USER NAME, REMOVE BEFORE SUBMIT,.
  const currentAdminUsername = res.locals.username || "lulu123";
  console.log(req.session, 'current name is ', currentAdminUsername, res.locals);
  const allList = await Order.find({});
  const userOrderList  = await Order.find({userName: currentAdminUsername}).exec();
  console.log(allList, 'this is the list ', userOrderList);
  res.locals.orderList = userOrderList;
  res.render("orderList")
})

app.get("/add-order",  (req, res, next)=>{

  res.render("addOrder")

})

app.post("/orderList/finish", async (req, res, next) =>{
  const {order } = req.body;
  const orderToUpdate = await Order.findByIdAndUpdate( order,  { $set: { completed: true }});


  console.log('successfully marked completed', req.body);
  res.redirect('/orderList')
})

app.post("/add-order", async(req, res, next)=>{
  const { phoneNumber } = req.body;
  if (!phoneNumber) return next(createError("customer phone number is required"));
  let subTotal = 0;
  let orderContentArr = [];


  for (let a = 1 ; a < 100; a++){
    const newItemID = req.body['dishID'+a];
    const newDishQuantity = req.body['dishQuantity'+a];

    console.log(newItemID, 'is the id');

    if (!newItemID && !newDishQuantity) break;
    if ( !newItemID || !newDishQuantity )  return  next(createError('required params missing from your form. '));
    const itemDetails = await MenuItem.find({itemId: newItemID});
    if (itemDetails.length === 0) return  next(createError('item not available in current menu '));
    console.log('this is item deatila', itemDetails);
    subTotal += itemDetails[0].price * newDishQuantity;
    orderContentArr.push({itemId: itemDetails[0].itemId, quantity: newDishQuantity, itemName: itemDetails[0].name });
  }
  console.log('I am here', subTotal);
  res.locals.subTotal = subTotal;
  //FIXME: TEMPORARY SET USER NAME, REMOVE BEFORE SUBMIT,.
  const currentAdminUsername = res.locals.username || "lulu123";
  const newOrder = new Order({
    userName:  currentAdminUsername,
    timeStamp: new Date(),
    customerPhone: phoneNumber,
    completed: false,
    orderContent: orderContentArr,
    orderTotal: subTotal,
  });
  newOrder.save((err)=>{
    if (err) return next (createError('error when saving new order'));
    res.render('addOrderResult');
  })
})

app.get("/menu",async(req, res, next)=>{

  const currentMenuList  = await MenuItem.find({}).exec();
  res.locals.menuList = currentMenuList;

  res.render("menu");


})

app.get("/add-menu",  (req, res, next)=>{

  res.render("addMenu")

})

app.post("/add-menu", async(req, res, next)=>{
  for (let a = 1 ; a < 100; a++){
      const newItemID = req.body['dishID'+a];
      const newDishName = req.body['dishName'+a];
      const newDishIngredients = req.body['dishIngredients'+a];
      const newDishPrice = req.body['dishPrice'+a];
      console.log(newItemID, 'is the id');

      if (!newItemID && !newDishName && !newDishIngredients) break;
      if (!newItemID || !newDishName || !newDishIngredients)  return  next(createError('required params missing from your form. '));
      const newMenuItem = new MenuItem({
        itemId: newItemID,
        name: newDishName,
        price: newDishPrice,
        ingredients: newDishIngredients,
      });

      newMenuItem.save((err)=>{
        if (err) console.error(err);
        else{
          res.redirect('/menu')
        }
      })
  }
  console.log('I am here')


})

app.get("/about", (req, res, next) => {
  res.render("about");
});



/* ************************
  Loading (or reloading) the data into a collection
   ************************ */
// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection

app.get('/upsertDB',
  async (req,res,next) => {
    //await Course.deleteMany({})
    for (course of courses){
      const {subject,coursenum,section,term}=course;
      const num = getNum(coursenum);
      course.num=num
      course.suffix = coursenum.slice(num.length)
      await Course.findOneAndUpdate({subject,coursenum,section,term},course,{upsert:true})
    }
    const num = await Course.find({}).count();
    res.send("data uploaded: "+num)
  }
)

app.use(isLoggedIn);


// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = "8890";
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
