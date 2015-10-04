var express = require('express'),
	app = express(),
	path = require('path'),
	fs = require('fs'),
	vogels = require('vogels'),
	joi = require('vogels/node_modules/joi'),
	bcrypt = require('bcrypt-nodejs'),
	httpMocks = require('node-mocks-http'),
	AWS = require('aws-sdk'),
	jwt = require('jsonwebtoken'),
    config = require('./config');

var lambdaEnv = !(require.main === module);
var secret = config.secret;

// dynamodb database connection
vogels.AWS.config.update({region: config.region});
var dynamodb = new AWS.DynamoDB({region: config.region});
vogels.dynamoDriver(dynamodb);

// some environment variables
if (!lambdaEnv) {
	app.set('port', process.env.PORT || 3002);
}

// dynamically include routes (Controller)
fs.readdirSync(__dirname + '/controllers').forEach(function (file) {
	if (file.substr(-3) == '.js') {
		route = require('./controllers/' + file);
		route.controller(app);
	}
});

//authorization checking
app.use(function (req, res, next) {
	console.log('checking authorization header');
	if (!req.headers.authorization) {
		res.status(401);
		handleSend({message:"Not Authorized"}, null, req, res);
	} else {
		var token = req.headers.authorization.replace('Bearer ', '');
		try {
			req.decoded = jwt.verify(token, secret, {algorithms:["HS256"]});
			next();
		} catch(err) {
			res.status(401);
			handleSend(err, null, req, res);
		}
	}
});

//handle all unmatched routes
app.all('*', function(req, res) {
	console.log('all *');
	res.status(404).send('404 Not Found');
});

// common handleSend output (object with 'err' and 'data' properties)
handleSend = function(err, data, req, res) {
	console.log('handleSend');
	var response = {data:null,err:null};
	if (err) {
		response.err = err;
		if (res.statusCode>=200 && res.statusCode<400) {
			res.status(404);
		}
	} else {
		response.data = data;
	}
	res.send(response);
	if (lambdaEnv) {
		next();
	}
}

//for amazon lambda
exports.handler = function(event, context) {
	console.log('Received event:', JSON.stringify(event, null, 2));
	var req = httpMocks.createRequest({
		method: event.method.toUpperCase(),
		url: event.url,
		body: event.body,
		headers: event.headers
	}); 
	var res = httpMocks.createResponse();
	app(req, res, function() {
		if (res.statusCode == 200) {
			context.succeed(res._getData());
		} else {
			context.fail(res._getData());
		}
	});
}

//for running as http server
if (!lambdaEnv) {
	app.listen(app.get('port'), function() {
		console.log('Express server listening on port ' + app.get('port'));
	});
}