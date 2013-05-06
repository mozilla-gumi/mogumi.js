"use strict";

if (Mogumi === undefined) {
    var Mogumi = {};
}
Mogumi.db = function() {
    var db;
    var objectStore;
    var publicObj = {};
    
    publicObj.add = function (data, addCallback) {
        var getCallback = function (getdata) {
            var saveCallback = function(obj) {
                console.log("add/saveCallback:" + JSON.stringify(obj));
                addCallback(obj);
            };
            if (getdata === undefined || getdata.value === undefined) {
                getdata = {
                    key: objectStore,
                    value: []
                }
            }
            getdata.value.push(data);
            db.save(getdata, saveCallback);
        };
        db.get(objectStore, getCallback);
        
    };
    publicObj.remove = function (key, removeCallback) {
        var getCallback = function (getdata) {
            var saveCallback = function(obj) {
                console.log("remove/saveCallback:" + JSON.stringify(obj));
                removeCallback(obj);
            };
            for (var i = 0; i < getdata.length; i++) {
                if (getdata[i].key === key) {
                    getdata.splice(i, 1);
                    break;
                }
            }
            db.save(getdata, saveCallback);
        };
        db.get(objectStore, getCallback);
    };
    publicObj.get = function (key, callback) {
        var getCallback = function (data) {
            var obj = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i].key === key) {
                    obj = data[i];
                    break;
                }
            }
            callback(obj);
        };
        db.get(objectStore, getCallback);
    };
    publicObj.readAll = function (callback) {
        db.all(callback);
        
    };
    publicObj.clear = function () {
        db.nuke();
    };
    publicObj.open = function (os, openCallback) {
        var createCallback = function(db) {
            openCallback();
        };
        objectStore = os;
        db = new Lawnchair(createCallback);
    };

    publicObj.test = function() {
        var openCallback = function () {
            var readCallback = function (data) {
                console.log('readCallback:' + JSON.stringify(data));    
            };
            var addCallback = function (data) {
                console.log('addCallback:' + JSON.stringify(data));    
            };
            
            
            publicObj.readAll(readCallback);
            
            var data3 = {
                seq: 17,
                value: 'Goodbye, earth.'
            };
            publicObj.add(data3, addCallback);
            var data2 = {
                seq: 18,
                value: 'Hello, world.'
            };
            publicObj.add(data2, addCallback);
        };
        publicObj.open('forum', openCallback);
    };
    
    return publicObj;
}();
