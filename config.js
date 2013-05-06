var path = require('path');
var i18n = require('i18n');

module.exports = function(app, express) {
    app.configure(function(){
        app.set('port', process.env.PORT || 3000);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.set('db', 'mongodb://localhost/mogumi');
        app.set('pagesize', 10);
        
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        
        app.use(i18n.init);
        app.use(function(req, res, next) {
          res.locals.__ = res.__ = function() {
            return i18n.__.apply(req, arguments);
          };
          res.locals.__n = res.__n = function() {
            return i18n.__n.apply(req, arguments);
          };
          // do not forget this, otherwise your app will hang
          next();
        });

        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });
    
    app.configure('development', function(){
        app.use(express.errorHandler());
    });

    i18n.configure({
        locales:['ja', 'en'],
        defaultLocale: 'ja'
    });    
};