var mongoose = require('mongoose');

// http://stackoverflow.com/questions/8595509/how-do-you-share-constants-in-nodejs-modules
var constants = function (name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
};

constants("StatusOpen", 1);
constants("StatusClosed", 2);

constants("FormatHtml", 1);
constants("FormatMarkdown", 2);

var Schema = mongoose.Schema;

var threadSchema = Schema({
	title: String,
	text: String,
	status: Number, // StatusEnum
	comments: [Schema.Types.ObjectId],
	updateDate: { type: Date, default: Date.now }
});

var postSchema = Schema({
	threadId: Schema.Types.ObjectId,
	seqNo: Number,
	title: String,
	text: String,
	format: String, // FormatEnum
	tag: [],
	updateDate: { type: Date, default: Date.now },
	parentPost: {
		seqNo: Number,
		id: Schema.Types.ObjectId
	},
	author: {
		userId: Schema.Types.ObjectId,
		name: String,
		email: String
	},
	uri: String,
	counter: {
		useful: Number,
		notUseful: Number,
		viewed: Number
	}
});

module.exports.openDatabase = function(db) {
	var onOpen = function() {
	};
	var onError = function() {
		console.log('Failed to open db');
	}
	
	mongoose.connect(db);
	var conn = mongoose.connection;
	conn.on('error', onError);
	conn.once('open', onOpen);
	
};
module.exports.Thread = mongoose.model('forum_thread', threadSchema);
module.exports.Post = mongoose.model('forum_post', postSchema);
