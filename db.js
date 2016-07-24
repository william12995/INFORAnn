var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var utils = require('./utils');

var Ann = new Schema(
    {
        author : String,
        title : String,
        istextcontent : Boolean,
        content : String,
        create : Date,
        update : Date,
        visible : Boolean,
        views : Number,
        ontop : Boolean
    }
)

var Admin = new Schema(
    {
        name: String,
        nick: String,
        //TODO:AddLastLogin
        //TODO:AddEnable
        //TODO:AddDeleteable
        password : String,
        level : Number
    }
)

var Session = new Schema(
    {
        cookie_id : String,
        admin_id : String,
        expire : Date,
        keep : Boolean
    }
)

mongoose.model('Ann', Ann);
mongoose.model('Admin', Admin);
mongoose.model('Session', Session);
mongoose.connect('mongodb://localhost/infor-ann', function (err) {
    if (!err) return;
    var start = new utils.run_cmd('net', ['start','mongodb'], function (me, buffer) {
        me.stdout += buffer.toString();
    }, function () {
        console.log(start.stdout);
        mongoose.connect('mongodb://localhost/infor-ann');
    });
});
