var mongoose = require('mongoose');
var Todo = mongoose.model('Todo');
/*
 * GET home page.
 */

exports.index = function (req, res) {
    res.render('index', { title: 'INFOR Ann System' });
};