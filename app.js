
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// add 1
var formidable = require('formidable');
var fs = require('fs');
var util = require('util');
// ---

var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer();
chat.on('connection', function(conn) {
    connections.push(conn);
    var number = connections.length;
    conn.write("Welcome, User " + number);
    conn.on('data', function(message) {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write("User " + number + " says: " + message);
        }
    });
    conn.on('close', function() {
        for (var ii=0; ii < connections.length; ii++) {
            connections[ii].write("User " + number + " has disconnected");
        }
    });
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);


// add 2
app.post('/post', function(req, res) {

  var form = new formidable.IncomingForm();
  form.encoding = "utf-8";
  form.uploadDir = "./public/images";

  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/html'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));

    var oldPath = './' + files.file._writeStream.path;
    var newPath = './public/images/' + files.file.name;
    fs.rename(oldPath, newPath, function(err) {
      if (err) throw err;
    });
  });

});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
chat.installHandlers(server, {prefix:'/chat'});
