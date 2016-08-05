var mongoose = require('mongoose');
var querystring = require('querystring');
var Ann = mongoose.model('Ann');
var admin = require('./admin');
var moment = require('moment');

/*
 * GET home page.
 */

exports.index = function (req, res, next) 
{
    var qudata = querystring.parse(req.url.query);
    Ann.find({ visible: true }).sort('-ontop').sort('-update').populate('author').exec(function (err, anns) {
        admin.levelfind(req, res, function (err, tologin, name) {
            if (err) console.log('[ERROR]' + err);
            res.render('index', {
                moment: moment,
                title: 'INFOR Ann System',
                session: req.session,
                data: anns,
                menu: tologin
            });
        });
    });
    //res.render('index', { title: 'INFOR Ann System' ,data: {}});
};

exports.content = function (req, res) {
    Ann.findById(req.params.id).populate('author').exec(function (err, ann) {
        admin.levelfind(req, res, function (err, tologin, name) {
            if (err) console.log('[ERROR]' + err);
            ann.views++;
            ann.save(function (err, ann, count) {
                if (err) console.log('[ERROR]' + err);
            });
            res.render('content', {moment: moment, title: ann.title +' - INFOR Ann System', session: req.session, ann: ann, menu: tologin});
        });
    });
}
