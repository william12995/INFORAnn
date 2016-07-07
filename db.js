var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Ann = new Schema(
    {
        ann_id : Schema.Types.ObjectId,
        author : String,
        title : String,
        content : String,
        create : Date,
        update : Date,
        visible : Boolean,
        view : Number
    }
)

mongoose.model('Ann', Ann);
mongoose.connect('mongodb://localhost/infor-ann');
