var fs = require('fs');
var http = require('http');
var https = require('https');

var privateKey = fs.readFileSync('my-key.pem');
var certificate = fs.readFileSync('my-cert.pem');

var credentials = {key: privateKey, cert: certificate};

//express libraries
var express = require('express');
var handlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var app = express();


// use the body parser middlewear so we can accept post requests
app.use(bodyParser.urlencoded({ extended: true })); 
app.engine('handlebars', handlebars({defaultLayout: 'main'})); //try taking out this
//app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

var clientList = [];

//Database to store data -- live web class
var Datastore = require('nedb');
var db = new Datastore({filename:'liveweb2016.db', autoload:true});
var db1 = new Datastore({filename:'itp2016.db', autoload:true});
var db2 = new Datastore({filename:'itp2017.db', autoload:true});


//WEBSOCKET PORTION
var io = require('socket.io').listen(httpsServer);

httpServer.listen(8083, function(){
	console.log('App listening on port 8083!');
});

httpsServer.listen(8087, function(){
	console.log('App listening on port 8087!');
});

//EXPRESS PORTION
app.get('/', function (req, res) {
    res.render('home', { pageTitle: "" } );
});

//view LW class
app.get('/view', function (req, res){
	res.render('view', {pageTitle: ""} );
});

//view ITP2016 graduating class
app.get('/view-itp2016', function (req, res){
	res.render('view-itp2016', {pageTitle: ""} );
});

//view ITP2017 graduating class
app.get('/view-itp2017', function (req, res){
	res.render('view-itp2017', {pageTitle: ""} );
});

// //submit LW class
// app.get('/submit', function (req, res){
// 	res.render('submit', {pageTitle: ""} );
// });

//submit ITP2016 graduating class
app.get('/submit-itp2016', function (req, res){
	res.render('submit-itp2016', {pageTitle: ""} );
});

//submit ITP2017 graduating class
app.get('/submit-itp2017', function (req, res){
	res.render('submit-itp2017', {pageTitle: ""} );
});

//folder to archive LW videos
app.get('/liveweb2016/:videoname', function(req, res) {
	res.sendfile(__dirname+"/liveweb2016/"+req.params.videoname);
});

//folder to archive ITP2016 videos
app.get('/itp2016/:videoname', function(req, res) {
	res.sendfile(__dirname+"/itp2016/"+req.params.videoname);
});

//folder to archive ITP2017 videos
app.get('/itp2017/:videoname', function(req, res) {
	res.sendfile(__dirname+"/itp2017/"+req.params.videoname);
});


//SOCKETS
io.sockets.on('connection',

	function (socket){
		console.log ("We have a new client: " + socket.id);
		clientList.push(socket.id);
		socket.emit('client', clientList);

		//for live web class
		socket.on('allinfo', function (data){
			console.log(data);

			//remove spaces in the full name that people entered
			var fileName = data.txt;
			var path_name = fileName.replace(/[^a-zA-Z]/g, "");

			//save video separately
			fs.writeFile(__dirname + '/liveweb2016/' + path_name+'.webm', data.video, function(err){
				if (err) console.log(err);
				console.log("Video is saved!");
				});

			//Save text as JavaScript object in nedb
			var datatosave = {
				id: socket.id,
				txt: data.txt,
				text: data.text
			}

			//Insert the data into the database
				db.insert(datatosave, function (err, newDocs){
					if (err) console.log("err: " + err);
					console.log("newDocs: " + newDocs);
				});

				//maybe try doing io.emit, so that it instantly updates to other users

		});

		//for itp2016
		socket.on('allinfo2016', function (data){
			console.log(data);

			//remove spaces in the full name that people entered
			var fileName = data.txt;
			var path_name = fileName.replace(/[^a-zA-Z]/g, "");

			//save video separately
			fs.writeFile(__dirname + '/itp2016/' + path_name+'.webm', data.video, function(err){
				if (err) console.log(err);
				console.log("Video is saved!");
				});

			//Save text as JavaScript object in nedb
			var datatosave = {
				id: socket.id,
				txt: data.txt,
				text: data.text
			}

			//Insert the data into the database
				db1.insert(datatosave, function (err, newDocs){
					if (err) console.log("err: " + err);
					console.log("newDocs: " + newDocs);
				});

		});

		//for itp2017
		socket.on('allinfo2017', function (data){
			console.log(data);

			//remove spaces in the full name that people entered
			var fileName = data.txt;
			var path_name = fileName.replace(/[^a-zA-Z]/g, "");

			//save video separately
			fs.writeFile(__dirname + '/itp2017/' + path_name+'.webm', data.video, function(err){
				if (err) console.log(err);
				console.log("Video is saved!");
				});

			//Save text as JavaScript object in nedb
			var datatosave = {
				id: socket.id,
				txt: data.txt,
				text: data.text
			}

			//Insert the data into the database
				db2.insert(datatosave, function (err, newDocs){
					if (err) console.log("err: " + err);
					console.log("newDocs: " + newDocs);
				});

		});

		//When the history is requested, find all the docs in the database
		//for live web class
		socket.on('history', function(){
			db.find({}, function(err, docs, data){
				//Loop through the results, send each one as if there were a new data
				for (var i=0; i<docs.length; i++){
					socket.emit('allinfo', {txt: docs[i].txt, text: docs[i].text, id: docs[i].id});
				}
			});
		});

		//for ITP 2016 class
		socket.on('history2016', function(){
			db1.find({}, function(err, docs, data){
				//Loop through the results, send each one as if there were a new data
				for (var i=0; i<docs.length; i++){
					socket.emit('allinfo2016', {txt: docs[i].txt, text: docs[i].text, id: docs[i].id});
				}
			});
		});

		//for ITP 2017 class
		socket.on('history2017', function(){
			db2.find({}, function(err, docs, data){
				//Loop through the results, send each one as if there were a new data
				for (var i=0; i<docs.length; i++){
					socket.emit('allinfo2017', {txt: docs[i].txt, text: docs[i].text, id: docs[i].id});
				}
			});
		});

		socket.on('disconnect', function() {
			var index = clientList.indexOf(socket.id);
			if (index != -1){
				clientList.splice(index, 1);
				console.log("client " + socket.id + " disconnected");
				io.emit('userdisconnected', socket.id);
			}
		});
	}
);
