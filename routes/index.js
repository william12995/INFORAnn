var mongoose = require('mongoose');
var querystring = require('querystring');
var Ann = mongoose.model('Ann');
/*
 * GET home page.
 */

exports.index = function (req, res) {
    var reqdata = querystring.parse(req.url.query);
	Ann.
    find({ visible : true }).
    sort( '-update' ).
    exec( function ( err, anns ){
      if( err ) return next( err );

      res.render( 'index', {
          title : 'INFOR Ann System',
          data : anns
      });
    });
    //res.render('index', { title: 'INFOR Ann System' ,data: {}});
};