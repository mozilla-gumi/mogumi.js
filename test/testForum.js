var nodeunit = require('nodeunit');
var forum = require ('../forum.js');
var forumModel = require('../forum_model.js');

exports['Thread router'] = nodeunit.testCase({
    'Create thread' : function(test) {
        var createCallback = function (id) {
            var readCallback = function (readData) {
                test.ok(readData.title === testData.item.title, 'thread title');
                test.ok(readData.text === testData.item.text, 'thread text');
                test.ok(readData.comments[0].title === testData.item.title, 'post title');
                test.ok(readData.comments[0].text === testData.item.text, 'post text');
                test.ok(readData.comments[0].author.name === testData.item.author.name, 'author.name');
                test.ok(readData.comments[0].author.email === testData.item.author.email, 'author.email');
                test.done();
            };
            
            var data = {
                signature: {
                    endPoint: '/forum/thread/' + id
                },
            };
            console.log('createCallback');
            forum.onReceiveRead(data, readCallback);
        };
        test.expect(6);
        
        forum.openDatabase('mongodb://localhost/mogumi');
        
        var testData = {
            signature: {
                endPoint: '/forum/thread'
            },
            item: {
                title: 'post title',
                text: 'post text',
                author: {
                    name: 'author name',
                    email: 'author email'
                }
            }
        };
        forum.onReceiveCreate(testData, createCallback);
    },
                   
});