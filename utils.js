module.exports = {
    ran_no: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    uid: function(len) {
        var str = '';
        var src = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var src_len = src.length;
        var i = len;
        for (; i--;) {
            str += src.charAt(this.ran_no(0, src_len - 1));
        }
        return str;
    },
    run_cmd: function(cmd, args, cb, end) {
        var spawn = require('child_process').spawn,
            child = spawn(cmd, args),
            me = this;
        child.stdout.on('data', function(buffer) {
            cb(me, buffer);
        });
        child.stdout.on('end', end);
    }
};
