
/**
 * Module dependencies.
 */
require('./db');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var routes = require('./routes');
var admin = require('./routes/admin');
var http = require('http');
var path = require('path');
var engine = require('ejs-locals');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Admin = mongoose.model('Admin');

var app = express();

// all environments
app.set('port', process.env.PORT || 3030);
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.cookieParser());
app.use(express.session({ secret: 'S4gznk%^MdGfxAEXT?N*WcD5tD!w@BC+' }));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


Admin.findOne({name : "root"}).exec(function(err,result)
{
	if(!result)
    {
        console.log("[WARN]can't find admin account \"root\"!");
        console.log("[WARN]will auto create a passwordless root account.");
		new Admin(
		{
        		name : "root",
        		password : "",
        		level : 4
		}).save(function(err, r)
		{
			if(err)console.log(err);
        });
		console.log('[INFO]root initialized!');
	}
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/index', routes.index);
app.get('/admin', admin.admin);
app.get('/annnew', admin.annnew);
app.post('/annnew', admin.annnew_proc);
app.get('/annedit/:id', admin.annedit);
app.post('/annedit/:id', admin.annedit_proc);
app.get('/anndelete/:id', admin.anndelete);
app.get('/login', admin.login);
app.post('/login', admin.login_proc);
app.get('/chpwd', admin.chpwd);
app.post('/chpwd', admin.chpwd_proc);
app.get('/logout', admin.logout);

http.createServer(app).listen(app.get('port'), function () {
    console.log('[INFO]Express server listening on port ' + app.get('port'));
});
