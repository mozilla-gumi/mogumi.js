
exports.is_mobile = function(req) {
    var ua = req.header('user-agent');
    if (/mobile/i.test(ua)) {
      return true;
    } else {
      return false;
    }
};