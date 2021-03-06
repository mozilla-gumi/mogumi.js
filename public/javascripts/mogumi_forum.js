"use strict";

if (Mogumi === undefined) {
    var Mogumi = {};
}
Mogumi.forum = function() {
    var mdConverter = Markdown.getSanitizingConverter();
    var mdEditor = new Markdown.Editor(mdConverter);
    var messageWriter;
    var threadListView;
    var threadView;
    var settingsView;
    var menulistView;
    var urlForumRoot = '/forum';
    var urlForumThread = '/forum/thread';
    var vent = _.extend({}, Backbone.Events);

    var PostModel = Backbone.Model.extend({
        url: '/forum/thread/post'
        
    });
    var PostListCollection = Backbone.Collection.extend({
        model: PostModel,
        initialize: function() {
            window.socket.on('forum:create:' + this.model.url, this.serverChange);
        },
        serverChange: function (data) {
            console.log('ThreadChange:' + JSON.stringify(data));
//            this.collection.add(data);
        }
    });
    var ThreadModel = Backbone.Model.extend({
        url: urlForumThread,
        collection: PostListCollection,
    });
    
    var ThreadListCollection = Backbone.Collection.extend({
        idAttribute: "_id",
        model: ThreadModel,
        url: urlForumRoot,

        initialize: function() {
            _.bindAll(this, "onAdded");
            window.socket.on('forum:create:' + urlForumThread, this.onAdded);
        },
        onAdded: function(data) {
            console.log('ThreadListCollection.onModelAdded: ' + JSON.stringify(data));
            this.add(data);
        },
        executeFetch: function (param) {
            this.fetch({
                reset: true,
                param: param
            });
        }

    });
    
    var ThreadListView = Backbone.View.extend({
        collection: ThreadListCollection,
        currentElement: 'div#latest',
        
        events: {
            "click a.threadLink": "onClickLink",
            "click a#latest-link": "onClickLatest",
            "click a#hot-link": "onClickHot",
            "click a#unanswered-link": "onClickUnanswered",
            "click a#searchresult-link": "onClickSearchResult",
            "keypress #search": "search"
        },
        onClickLink: function (e) {
            e.preventDefault();
            var dataId = $(e.target).attr('data-id');
            vent.trigger("threadview:open", dataId);
        },
        
        executeFetch: function (type) {
            this.currentElement = $('div#' + type);
            this.collection.executeFetch(
                {
                    type: type
                }
            );
        },
        executeSearch: function () {
            this.currentElement = $('div#searchresult');
            this.collection.executeFetch(
                {
                    type: 'search',
                    key: $('#search').val()
                }
            );
        },
        search: function (e) {
            if (e.which !== 13) {
                return;
            }
            e.preventDefault();
            $('#searchresult-item').show();
            this.executeSearch();
        },
        onClickSearchResult: function (e) {
            this.executeSearch();
        },
        onClickLatest: function (e) {
            this.executeFetch('latest');
        },
        onClickHot: function (e) {
            this.executeFetch('hot');
        },
        onClickUnanswered: function (e) {
            this.executeFetch('unanswered');
        },
        
        initialize: function() {
            this.currentElement = this.options.currentElement;
            
            _.bindAll(this, "render");
            this.collection.bind("change", this.render);
            this.collection.bind("reset", this.render);
            this.collection.bind("add", this.render);
            this.collection.bind('all', function(data) {
                console.log(JSON.stringify(data));
            });
            
            $('#searchresult-item').hide();

            this.template = _.template($('#threadListTemplate').html());
            window.history.pushState(null, null, this.collection.url);
        },
        
        render: function() {
            $('div#latest').hide();
            $('div#hot').hide();
            $('div#unanswered').hide();
            $('div#searchresult').hide();
            this.currentElement.show();

            var threadList = this.collection.toJSON();
            for (var i = 0; i < threadList.length; i++) {
                threadList[i].text =
                    mdConverter.makeHtml(threadList[i].text);

                var threadDate = new Date(threadList[i].updateDate);
                threadList[i].updateDate =
                    threadDate.toLocaleDateString() ;
            }
            var threads = this.template({
                threads: threadList
            });
            this.currentElement.find('.threadList').html( threads );
            return this;
        }
    
    });
    var openThreadListView = function () {
        ViewSwitcher.open('#threadListView');        

        if ($( "#threadListTabs" ).length) {
            $( "#threadListTabs" ).tabs();
        }
        var threadList = new ThreadListCollection();
        
        threadList.executeFetch({
            param: {
                type: 'latest'
            }
        });
        threadListView = new ThreadListView({
            el: '#threadListView',
            currentElement: $('#threadListView').find('div#latest'),
            collection: threadList
        });
        
    };
    
    var ThreadView = Backbone.View.extend({
        model: ThreadModel,
        
        events: {
            "click .btnEdit": "onClickEdit",
            "click .btnReply": "onClickReply"
        },
        
        onClickEdit: function (e) {
            var dataId = $(e.target).attr('data-id');
            console.log('Edit: ' + dataId);
        },
        onClickReply: function (e) {
            var dataId = $(e.target).attr('data-id');
            console.log('Reply: ' + dataId);
            vent.trigger("messagewriterview:open", dataId)
        },

        initialize: function() {
            _.bindAll(this, "render");
            this.model.bind("change", this.render);
            this.model.bind("reset", this.render);

            this.template = _.template($('#threadTemplate').html());
            var url = this.model.url + '?id=' + this.model.id;
            window.history.pushState(null, null, url);
        },
        render: function() {
            var threadInfo = this.model.toJSON();
            
            for (var i = 0; i < threadInfo.comments.length; i++) {
                if (threadInfo.comments[i].text !== undefined) {
                    threadInfo.comments[i].text =
                        mdConverter.makeHtml(threadInfo.comments[i].text);
                }
            }
            var htmlStr = this.template({
                comments: threadInfo.comments
            });
            this.$el.html( htmlStr );
            return this;

        }
    
    });
    var MessageWriter = Backbone.View.extend({
        events: {
            "submit form": "onSubmit",
            "change input" :"onChanged",
            "change textarea" :"onTextChanged",
        },
        initialize: function() {
            _.bindAll(this, 'onModelSaved');
            this.model.bind('sync', this.onModelSaved);
        },
        onModelSaved: function(model, response, options) {
            vent.trigger("threadview:open", this.model.id);
        },
        onChanged: function(e) {
            var target = $(e.currentTarget);
            var data = {};
            data[target.attr('name')] = target.val();
            this.model.set(data);
        },
        onTextChanged: function(e) {
            var target = $(e.currentTarget);
            var data = {};
            data['text'] = target.val();
            this.model.set(data);            
        },
        onSubmit: function (e) {
            e.preventDefault();
            console.log("submit:" + JSON.stringify(this.model.attributes));
            this.model.save();
        },
        
        render: function() {
            var txt = $('#msgTemplate').html();
            var template = _.template( $("#msgTemplate").html(), {} );
            this.$el.html( template );
        }
    
    });
    var SettingsView = Backbone.View.extend({
    });
    var MenulistView = Backbone.View.extend({
        events: {
            "click a#newthread": "onClickNewThread",
            "click a#settings": "onClickSettings",
            "click a#help": "onClickHelp"
        },        
        onClickNewThread: function (e) {
            e.preventDefault();
            openNewThreadEditor();
        },
        onClickSettings: function (e) {
            e.preventDefault();
            openSettingsView();
        },
        onClickHelp: function (e) {
            e.preventDefault();
            alert('help');
        }
    });
    var ForumRouter = Backbone.Router.extend({
        routes: {
        },
        index: function () {
            console.log('index');    
        },
        newthread: function () {
            openNewThreadEditor();
        },
        settings: function () {
            openSettingsView();
        },
        help: function () {
            alert('help');
            
        }
    });
    
    var ViewSwitcher = {
        currentView: null,
        open: function (newView) {
            if (this.currentView !== null) {
                $(this.currentView).hide();
            }
            this.currentView = newView;
            $(newView).show();
        }
    };
    
    var openThreadView = function (threadId) {
        ViewSwitcher.open('#threadView');
        $('#messageWriter').hide();

        var thread = new ThreadModel({ id: threadId });
        thread.fetch({reset: true});
        threadView = new ThreadView({
            el: $('#thread'),
            model: thread
        });
        
        initMessageWriter();
        window.scrollTo( 0, 0 );
        
    };
    var openSettingsView = function () {
        ViewSwitcher.open('#settingsView');
        settingsView = new SettingsView();
    };
    var openNewThreadEditor = function () {
        ViewSwitcher.open('#threadView');
        
        initMessageWriter();
        
    };
    
    var openMessageWriter = function(id) {
        if (id !== undefined) {
            messageWriter.model.set({
                replyTo: id
            });
        }
        ViewSwitcher.open('#threadView');
        $('#messageWriter').show();

        if ($( "#editTextTabs" ).length) {
            $( "#editTextTabs" ).tabs();
        }
    };
    
    var initMessageWriter = function () {
        messageWriter = new MessageWriter({
            el: $('#messageWriter'),
            model: new ThreadModel()
        });
        messageWriter.render();
        
        if ($( "#editTextTabs" ).length) {
            $( "#editTextTabs" ).tabs();
            mdEditor.run();
        }
    };
    var init = function () {
        window.socket = io.connect('http://localhost:3000');
        
        vent.on("threadview:open", openThreadView);
        vent.on("messagewriterview:open", openMessageWriter);
        
        /*
        var router = new ForumRouter();
        
        Backbone.history.start({
            pushState: true,
            root: '/forum/'
        });
        */

        $('#settingsView').hide();
        menulistView = new MenulistView({
            el: '#menulist'
        });
    };

    var publicObj = {};
    publicObj.threadlist = function() {
        init();
        
        openThreadListView();
    
    };
    publicObj.thread = function() {
        init();
        
        var threadId = $('#threadView').attr('data-id');
        openThreadView(threadId);
        
    };
    publicObj.newthread = function() {
        init();
        
        openNewThreadEditor();
    
    };
    publicObj.test = function() {
        var openCallback = function () {
            
            var readCallback = function (data) {
                console.log('readCallback:' + JSON.stringify(data));    
            };
            var addCallback = function (data) {
                console.log('addCallback:' + JSON.stringify(data));    
            };
            
            Mogumi.db.readAll('forum', readCallback);
            
            var data3 = {
                threadId: 'abc1022',
                seq: 17,
                value: 'Goodbye, earth.'
            };
            Mogumi.db.add('forum', data3, addCallback);
            var data2 = {
                threadId: 'abc1023',
                seq: 18,
                value: 'Hello, world.'
            };
            Mogumi.db.add('forum', data2, addCallback);
        };
        Mogumi.db.open('mogumi', 'forum', 'threadId', openCallback);
    };
    
    return publicObj;
}();
