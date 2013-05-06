// http://developer.teradata.com/blog/jasonstrimpel/2011/11/backbone-js-and-socket-io
Backbone.sync = function (method, model, options) {
    // grab active socket from global namespace; io.connect() was used to create socket
    var socket = window.socket;
 
    /*
     * Create signature object that will emitted to server with every request.
     * This is used on the server to push an event back to the client listener.
     */
    var signature = function () {
        var sig = {};   
         
        sig.endPoint = model.url + (model.id ? ('/' + model.id) : '');
        if (model.ctx) sig.ctx = model.ctx;
 
        return sig;
    };
     
    /*
     * Create an event listener for server push. The server notifies
     * the client upon success of CRUD operation.
     */
    var event = function (operation, sig) {
        var e = operation + ':';
        e += sig.endPoint;
        if (sig.ctx) e += (':' + sig.ctx);
 
        return e;
    };
     
    // Save a new model to the server.
    var create = function (namespace) {
        var eventName = namespace + ':create';
        var sign = signature(model);
        var e = event(eventName, sign);
        socket.emit(eventName, {'signature' : sign, item : model.attributes });
        socket.once(e, onCreate);                          
    };
 
    // Get a collection or model from the server.
    var read = function (namespace) {
        var eventName = namespace + ':read';
        var sign = signature(model);
        var e = event(eventName, sign);
        socket.emit(eventName, {'signature' : sign, param: options.param}); 
        socket.once(e, onRead);
    };
    // Save an existing model to the server.
    var update = function (namespace) {
        var eventName = namespace + ':update';
        var sign = signature(model);
        var e = event(eventName, sign);
        socket.emit(eventName, {'signature' : sign, item : model.attributes }); // model.attribues is the model data
        socket.once(e, onUpdate);                          
    }; 
    // Delete a model on the server.
    var destroy = function (namespace) {
        var eventName = namespace + ':delete';
        var sign = signature(model);
        var e = event(eventName, sign);
        socket.emit(eventName, {'signature' : sign, item : model.attributes }); // model.attribues is the model data
        socket.once(e, onDestroy);                          
    };
    
    var onNewThread = function () {
        
    };
    var onNewPost = function () {
        
    };
    var onCreate = function (data) {
        model.id = data.id; 
        console.log(model);                    
        options.success(data);
    };
    var onRead = function (data) {
        options.success(data); // updates collection, model; fetch                     
    };
    var onUpdate = function (data) {
        console.log(data);                    
    };
    var onDestroy = function (data) {
        console.log(data);                    
    };

    var params = _.extend({}, options)
  
    if (params.url) {
        params.url = _.result(params, 'url');
    } else {
        params.url = _.result(model, 'url') || urlError();
    }
  
    var cmd = params.url.split('/');
    var namespace = (cmd[0] !== '') ? cmd[0] : cmd[1]; // if leading slash, ignore

    // entry point for method
    switch (method) {
        case 'create':
            create(namespace);
            break;       
        case 'read': 
            read(namespace);
            break; 
        case 'update':
            update(namespace);
            break;
        case 'delete':
            destroy(namespace);
            break;
    }       

};

