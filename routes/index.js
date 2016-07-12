var mongoose = require('mongoose');
var Ann = mongoose.model('Ann');
/*
 * GET home page.
 */

exports.index = function (req, res) {
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