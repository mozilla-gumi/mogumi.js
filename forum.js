var mgutil = require('./mgutil.js');
var forumModel = require('./forum_model.js');

var forumRoot = '/forum';
var forumThread = forumRoot + '/thread';
var pageSize = 10;

var makeRenderParams = function(res) {
	return {
		"forum_root": forumRoot,
		"forum_name": res.__('forum_name'),
		"search": res.__('search'),
		"newthread": res.__('newthread'),
		"help": res.__('help'),
		"settings": res.__('settings'),
		"title": res.__('title'),
		"text": res.__('text'),
		"name": res.__('name'),
		"email": res.__('email'),
		"send": res.__('send'),
		"draft": res.__('draft'),
		"reset": res.__('reset'),
		"write": res.__('write'),
		"edit": res.__('edit'),
		"reply": res.__('reply'),
		"preview": res.__('preview'),
		"latest": res.__('latest'),
		"hot": res.__('hot'),
		"unanswered": res.__('unanswered'),
		"searchresult": res.__('searchresult'),
		"defaultThreadList": res.__('defaultThreadList'),
	};
};


var getThreadList = function (recvData, getCallback) {
	var findThreadCallback = function (err, collection) {
		if (err) {
			console.log(err);
			return;
		}
		var threadList = [];
		for (var i = 0; i < collection.length; i++) {
			var threadInfo = collection[i];
			var thread = {
				id: threadInfo["_id"],
				title: threadInfo["title"],
				text: threadInfo["text"],
				updateDate: threadInfo["updateDate"]
			};
			
			threadList.push(thread);
		}
		getCallback(threadList);
	};

	var cond = {};
	console.log("getThreadList:" + JSON.stringify(recvData));	
	if (recvData.param.type === 'latest') {
	} else if (recvData.param.type === 'unanswered') {
		console.log('unanswered');
		forumModel.Thread
			.find(cond)
			.where('comments').size(0)
			.limit(pageSize)
			.select('_id title text updateDate')
			.exec(findThreadCallback);
		return;
	} else if (recvData.param.type === 'hot') {
	} else if (recvData.param.type === 'search') {
		cond = {
			text: new RegExp(recvData.param.key, 'i')
		};
	}
	
	forumModel.Thread
		.find(cond)
		.limit(pageSize)
		.select('_id title text updateDate')
		.exec(findThreadCallback);	
};
var getThread = function(recvData, getCallback) {
	var findPostCallback = function (err, postList) {
		var findThreadCallback = function (err, threadInfo) {
			thread.title = threadInfo.title;
			thread.text = threadInfo.text;
			getCallback(thread);
		};
		
		if (err) {
			console.log(err);
			return;
		}
		
		var commentList = [];
		for (var i = 0; i < postList.length; i++) {
			commentList.push({
				id: postList[i]["_id"],
				title: postList[i]["title"],
				text: postList[i]["text"],
				author: postList[i]["author"]
			})
		}
		console.log("postList: " + JSON.stringify(postList));
		console.log("commentList: " + JSON.stringify(commentList));
		var thread = {
			id: threadId,
			comments: commentList
		};
		
		forumModel.Thread
			.findOne({ "_id": threadId })
			.select('title text')
			.exec(findThreadCallback);
	};
	
	var threadId = recvData.signature.endPoint.substring(forumThread.length + 1);
	forumModel.Post
		.find({ "threadId": threadId })
		.limit(pageSize)
		.select('_id title text author')
		.exec(findPostCallback);
	
};
var createThread = function (recvData, createCallback) {
	var saveThreadCallback = function(err, doc) {
		var savePostCallback = function(err, doc) {
			if (err) {
				console.log('error! ' + err);
				return;
			}
			console.log('Post Saved:' + JSON.stringify(doc));
	
			createCallback(threadId)
			
		};
		if (err) {
			console.log('error! ' + err);
			return;
		}
		console.log('Thread Saved:' + JSON.stringify(doc));
		var threadId = doc.id;
		var postData = {
			"_id": postId,
			"threadId": threadId,
			"title": recvData.title,
			"text": recvData.text,
			"format": forumModel.FormatMarkdown,
			"author": {
				"name": recvData.name,
				"email": recvData.email
			},
			"createDate": new Date()
		};
		var newPost = new forumModel.Post(postData);
		newPost.save(savePostCallback);
		
	};
	var postId = forumModel.newId();
	console.log("postId: " + JSON.stringify(postId));
	var threadData = {
		title: recvData.title,
		text: recvData.text,
		status: forumModel.StatusOpen,
		comments: [postId]
	};

	var newThread = new forumModel.Thread(threadData);
	
	newThread.save(saveThreadCallback);
	
};
var replyPost = function (recvData, createCallback) {
	var findPostCallback = function(err, doc) {
		var updateThreadCallback = function (err, doc) {
			var savePostCallback = function(err, doc) {
				console.log("replyPost saveCallback:" + JSON.stringify(doc));
				createCallback(threadId);
			};
			if (err) {
				console.log('error! ' + err);
				return;
			}
			var postData = {
				"_id": postId,
				"threadId": threadId,
				"title": recvData.title,
				"text": recvData.text,
				"format": forumModel.FormatMarkdown,
				"parentPost": {
					"id": doc.parentPostId
				},
				"author": {
					"name": recvData.name,
					"email": recvData.email
				}
			};
			var newPost = new forumModel.Post(postData);
			newPost.save(savePostCallback);
			
		};
		var postId = forumModel.newId();
		var threadId = doc.threadId;
		forumModel.Thread
			.update({ "_id": threadId }, { $push: { comments: postId } })
			.exec(updateThreadCallback);
	};
	forumModel.Post
		.findOne({ "_id": recvData.replyTo })
		.select('threadId')
		.exec(findPostCallback);


};
var updatePost = function (recvData, createCallback) {
	var updatePostCallback = function(err, doc) {
		if (err) {
			console.log('error! ' + err);
			return;
		}
		createCallback(doc);
	};
	var postData = {
		"title": recvData.title,
		"text": recvData.text,
		"author": {
			"name": recvData.name,
			"email": recvData.email
		}
	};
	
	forumModel.Post
		.update({ "_id": recvData.id}, postData, null, updatePostCallback);
};

module.exports.getRoot = function() {
	return forumRoot;
};

module.exports.setRoot = function(root) {
	forumRoot = root;
};

module.exports.setPageSize = function(size) {
	pageSize = size;
};

module.exports.openDatabase = function(db) {
	forumModel.openDatabase(db);
};

module.exports.onRead = function (recvData, readCallback) {
	var endPoint = recvData.signature.endPoint;
    if (endPoint.substring(0, forumThread.length) === forumThread) {
		getThread(recvData, readCallback);
	} else if (endPoint.substring(0, forumRoot.length) === forumRoot) {
		getThreadList(recvData, readCallback);
	}
};

module.exports.onCreate = function (recvData, createCallback) {
	var endPoint = recvData.signature.endPoint;
    if (endPoint.substring(0, forumThread.length) === forumThread) {
		if (recvData.item.replyTo !== undefined) {
			replyPost(recvData.item, createCallback);
		} else if (recvData.item.id !== undefined) {
			updatePost(recvData.item, createCallback);
		} else {
			createThread(recvData.item, createCallback);
		}
	} else if (endPoint.substring(0, forumRoot.length) === forumRoot) {
	} else {
	}

};

module.exports.onRequestThreadList = function(req, res) {
	// make parameter object for rendering
	var renderParams = makeRenderParams(res);
	renderParams["threadId"] = "";
	// render response    
	if (mgutil.is_mobile(req)) {
	  res.render('mobile/forum_threadlist', renderParams);
	} else {
	  res.render('desktop/forum_threadlist', renderParams);
	}
	
};
module.exports.onRequestThread = function(req, res) {
	// make parameter object for rendering
	var renderParams = makeRenderParams(res);
	renderParams["threadId"] = req.query.id;
	// render response    
	if (mgutil.is_mobile(req)) {
	  res.render('mobile/forum_thread', renderParams);
	} else {
	  res.render('desktop/forum_thread', renderParams);
	}
};
module.exports.onRequestNewThread = function(req, res) {
	// make parameter object for rendering
	var renderParams = makeRenderParams(res);
	renderParams["threadId"] = "";
	
	// render response    
	if (mgutil.is_mobile(req)) {
	  res.render('mobile/forum_newthread', renderParams);
	} else {
	  res.render('desktop/forum_newthread', renderParams);
	}
};
module.exports.test = function(req, res) {
	var renderParams = makeRenderParams(res);
	
	res.render('desktop/forum_test', renderParams);
};



