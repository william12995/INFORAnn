
/**
 * Module dependencies.
 */
require('./db');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var path = require('path');
var engine = require('ejs-locals');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var debug = require('debug')('inforann:server');
var colors = require('colors');

var index = require('./routes');
var admin = require('./routes/admin');
var Admin = mongoose.model('Admin');

var app = express();

// all environments
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
  secret: 'S4gznk%^MdGfxAEXT?N*WcD5tD!w@BC+' ,
  resave:true,
  saveUninitialized: true
  //!!!!!IMPORTANT!!!!! *DO NOT* CHANGE THE STRING ABOVE!!!!! 
}));

Admin.findOne({name : "root"}).exec(function(err,result)
{
	if(!result)
    {
        console.log("[WARN]".yellow+"can't find admin account \"root\"!");
        console.log("[WARN]".yellow+"will auto create a passwordless root account.");
		new Admin(
		{
                name : "root",
                nick: "System Admin",
                LastLogin : Date.now(),
                enable : true,
                system : true,
        		password : "",
        		level : 4
		}).save(function(err, r)
		{
			if(err)console.log(err);
        });
		console.log('[INFO]'.blue+'root initialized!');
	}
});

app.use('/', index);
app.use('/index', index);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

module.exports = app;

debug('app.js initialized.');
