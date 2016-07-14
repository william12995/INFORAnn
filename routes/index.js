var mongoose = require('mongoose');
var querystring = require('querystring');
var Ann = mongoose.model('Ann');
var admin = require('./admin');
/*
 * GET home page.
 */

exports.index = function (req, res, next) 
{
    var qudata = querystring.parse(req.url.query);
	Ann.
    find({ visible : true }).
    sort( '-update' ).
    exec(function (err, anns) {
        admin.levelfind(req, function (err, tologin) {
            if (err) return next(err);

            res.render('index', {
                title: 'INFOR Ann System',
                data: anns,
                menu: tologin
            });
        });
    });
    //res.render('index', { title: 'INFOR Ann System' ,data: {}});
};
