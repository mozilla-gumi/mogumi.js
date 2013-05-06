"use strict";

if (Mogumi === undefined) {
    var Mogumi = {};
}
Mogumi.db = function() {
    /* ERROR: 'setting a property that has only a getter'
    window.indexedDB =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB;
    */
    window.IDBTransaction =
        window.IDBTransaction ||
        window.webkitIDBTransaction ||
        window.msIDBTransaction;
    window.IDBKeyRange =
        window.IDBKeyRange ||
        window.webkitIDBKeyRange ||
        window.msIDBKeyRange;
    
    var db;
    var publicObj = {};

    publicObj.open = function (dbname, osname, keypath, openCallback) {
        var onError = function (e) {
            console.log('Failed to open database: ' + request.errorCode);
        };
        var onSuccess = function (e) {
            console.log('Database opened');
            db = request.result;
            openCallback();
        };
        var onUpgradeNeeded = function (e) {
            console.log('onUpgradeNeeded');
            var db = e.target.result;
            db.deleteObjectStore(osname);
            db.createObjectStore(osname, {keyPath: keypath});            
        };
        var request = window.indexedDB.open(dbname, 7);
        request.onerror = onError;
        request.onsuccess = onSuccess;
        request.onupgradeneeded = onUpgradeNeeded;

    };

    publicObj.add = function (osname, data, addCallback) {
        var onSuccess = function (e) {
            console.log('event.target.result = ' + e.target.result);
            addCallback();
        };
        var request = db.transaction([osname], "readwrite")
            .objectStore(osname)
            .add(data);
        request.onsuccess = onSuccess;       
    };
    publicObj.put = function (osname, data, putCallback) {
        var onSuccess = function (e) {
            console.log('event.target.result = ' + e.target.result);
            putCallback();
        };
        var request = db.transaction([osname], "readwrite")
            .objectStore(osname)
            .put(data);
        request.onsuccess = onSuccess;       
    };
    publicObj.remove = function (osname, param, removeCallback) {
        var onSuccess = function (e) {
            removeCallback();
        };
        var request = db.transaction(osname)
            .objectStore(osname)
            .delete(param);
            
        request.onsuccess = onSuccess;
        
    };
    publicObj.get = function (osname, key, getCallback) {
        var onError = function (e) {
            console.log('Failed to get: ' + request.errorCode);
        };
        var onSuccess = function (e) {
            getCallback(request.result);
        };
        var request = db.transaction(osname)
            .objectStore(osname)
            .get(key);

        request.onerror = onError;
        request.onsuccess = onSuccess;       
    };
    publicObj.readAll = function (osname, callback) {
        var threads = [];
        
        var onSuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                threads.push(cursor.value);
                cursor.continue();
            } else {
                callback(threads);
            }
        };
        
        var request = db.transaction(osname)
            .objectStore(osname)
            .openCursor();
        request.onsuccess = onSuccess;
        
    };
    publicObj.clear = function (osname) {
        var request = db.transaction(osname)
            .objectStore(osname)
            .clear();
        request.onsuccess = onSuccess;
    };

    return publicObj;
}();
