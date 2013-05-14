var http = require('http');
var socketIO = require('socket.io');
var forum = require('./forum.js');

var forumRoot = forum.getRoot();

var routeStaticFiles = function (app) {
    var routeStaticFile = function (reqPath, realFile) {
        var routeCallback = function (req, res) {
            res.sendfile(__dirname + realFile);
        };
        app.get(reqPath, routeCallback);
    };
    routeStaticFile('/backbone/backbone.js',
        '/node_modules/backbone/backbone.js');

    routeStaticFile('/pagedown/Markdown.Converter.js',
        '/node_modules/pagedown/Markdown.Converter.js');
    routeStaticFile('/pagedown/Markdown.Sanitizer.js',
        '/node_modules/pagedown/Markdown.Sanitizer.js');
};

var socket;
var onSocketConnect = function (sok) {

    // creates the event to push to listening clients
    var event = function (operation, sig) {
        var e = operation + ':';
        e += sig.endPoint;
        if (sig.ctx) {
            e += (':' + sig.ctx);
        }

        return e;
    };
    
    var onForumRead = function (data) {
        var readCallback = function (collection) {
            socket.emit(e, collection);
        };
        var e = event('forum:read', data.signature);
        forum.onRead(data, readCallback);
    };
    var onForumCreate = function (data) {
        var createCallback = function (id) {
            var sendData = {
                id: id
            };
            socket.emit(e, sendData);
            console.log('broadcast: ' + JSON.stringify(e));
            
            var broadcastData = data.item;
            broadcastData.id = id;
            socket.broadcast.emit(e, broadcastData);
        };
        var e = event('forum:create', data.signature);
        forum.onCreate(data, createCallback);
    };
    var onForumUpdate = function (data) {
    };
    var onForumDelete = function (data) {
    };
    
    socket = sok;
    
    socket.on('forum:read', onForumRead);
    socket.on('forum:create', onForumCreate);
    socket.on('forum:update', onForumUpdate);
    socket.on('forum:delete', onForumDelete);

};

module.exports.sendMessage = function (data) {
    
};
module.exports = function (app) {
    var onListen = function () {
        var io = socketIO.listen(httpServer);
        io.sockets.on('connection', onSocketConnect);
        
        io.configure(function(){
            io.set('log level', 2);
        });
    };

    forum.openDatabase(app.get('db'));
    
    app.get(forum.getRoot(), forum.onRequestThreadList);
    app.get(forum.getRoot() + '/thread', forum.onRequestThread);
    app.get(forum.getRoot() + '/newthread', forum.onRequestNewThread);
    app.get(forum.getRoot() + '/test', forum.test);
    
    routeStaticFiles(app);
    
    var httpPort = app.get('port');
    var httpServer = http.createServer(app);

    console.log("Express server listening on port " + httpPort);
    httpServer.listen(httpPort, onListen);
    
};