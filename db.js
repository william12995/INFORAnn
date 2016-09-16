﻿var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var utils = require('./utils');
var debug = require('debug')('inforann:server');
var colors = require('colors');
var config = require('./config.json');

var Ann = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'Admin' },
        authorcache : String,
        title : String,
        istextcontent : Boolean,
        content : String,
        create : Date,
        update : Date,
        visible : Boolean,
        views : Number,
        ontop : Boolean
    }
);

var Admin = new Schema(
    {
        name: String,
        nick: String,
        LastLogin : Date,
        enable : Boolean,
        system : Boolean,
        password : String,
        level : Number
    }
);

var Session = new Schema(
    {
        cookie_id : String,
        admin_id : String,
        expire : Date,
        keep : Boolean
    }
);

mongoose.model('Ann', Ann);
mongoose.model('Admin', Admin);
mongoose.model('Session', Session);
mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb, function (err) {
    if (err) {
        console.log("[ERROR]".red+"Couldn't connect to mongodb: " + config.mongodb + " .");
        console.log("[ERROR]".red+"Please check if your setting in 'config.json' is right.");
        console.log("[ERROR]".red+"Or, if the mongod is running.");
        throw err;
    } else {
        debug('Connected to MongoDB server.');
    }
});
