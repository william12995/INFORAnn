var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Ann = new Schema(
    {
        ann_id : Schema.Types.ObjectId,
        admin_id : Schema.Types.ObjectId,
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
        admin_id : Schema.Types.ObjectId,
        name : String,
        password : String,
        level : Number
    }
)

var Session = new Schema(
    {
        cookie_id : String,
        admin_id : Schema.Types.ObjectId,
        expire : Date
    }
)

mongoose.model('Ann', Ann);
mongoose.model('Admin', Admin);
mongoose.model('Session', Session);
mongoose.connect('mongodb://localhost/infor-ann');
