/*  
 *  rest.js
 *  restful interface (GET, POST, PUT, DELETE to model endpoints)
 *  endpoints:  /api/rest/:model (for get-all, put)
 *  			/api/rest/:model/:hkv or /api/rest/:model/:hkv/:rkv (for get-one, post, delete)
 */ 

// load up our dependencies
var vogels  = require('vogels')
    ,fs     = require('fs')
    ,bcrypt = require('bcrypt-nodejs');

// dynamically include all models
var models = {};
fs.readdirSync(__dirname + '/../models').forEach(function (file) {
	if (file.substr(-3) == '.js') {
		var model_name = file.replace('.js', '');
		models[file.replace('.js', '')] = require('../models/' + file);
	}
});

// create our exports controller function for easy loading
module.exports.controller = function(app) {

	var init = function(req, res) {
		if (req.params.model && typeof models[req.params.model] == 'undefined') {
			handleSend({'message':'Model ' + req.params.model + ' does not exist'}, null, req, res);
			return false;
		}
		return true;
	}

	// base route - future api documentation goes here
	app.get('/api', function(req, res) {
	    console.log('/api called');
	    var err = {'message':'Not Implemented'};
	    handleSend(err, null, req, res);
	});

	//seeding - create tables
	app.get('/api/createTables', function(req, res) {
		var tables = {};
		vogels.createTables({
			'Client': {readCapacity: 1, writeCapacity: 1},
			'Users': {readCapacity: 1, writeCapacity: 1}
		}, function (err) {
		  	if (err) {
		    	console.log('Error creating tables', err);
		    	res.send(err);
		  	} else {
		    	console.log('Tables created');
		    	res.send('Tables created');
		  	}
		});
	});

	//seeding - create user
	app.get('/api/createUser', function(req, res) {
		models.users.create({
			email: 'name@site.tld', 
			name: 'Name name',
			password: bcrypt.hashSync('password'),
			role: 'admin'
		}, function (err, data) {
			res.send({err:err,data:data});
		});
	});

	//non-rest get state from session
	app.get('/api/state', function(req, res) {
		var state = req.session.state || null;
		res.send("state = " + JSON.stringify(state) + ';');
	});

	//non-rest login
	app.post('/api/login', function(req, res) {
		models.users.get(req.body.email, {ConsistentRead: true}, function (err, data) {
			if (data) {
				bcrypt.compare(req.body.password, data.get('password'), function(err, matches) {
				   	if (matches) {
				   		var state = {};
				   		state.user = JSON.parse(JSON.stringify(data));
						if (state.user && state.user.hasOwnProperty('password')) {
							state.user.password = '';
						}
				   		req.session.state = state;
						handleSend(null, state, req, res);
					} else {
						handleSend(err, null, req, res);
					}
				});
			} else {
				handleSend(err, null, req, res);
			}
		});
	});

	//non-rest logout
	app.get('/api/logout', function(req, res) {
   		if (req.session.state && req.session.state.user) {
   			req.session.state.user = null;
   		}
		handleSend(null, null, req, res);
	});

	// rest - get-all handling
	app.get('/api/rest/:model', function(req, res) {
		if (init(req, res)) {
			models[req.params.model].scan().loadAll().exec(function (err, data) {
				handleSend(err, data, req, res);
			});
		}
	});

	// rest - get-one handling either hash key value (hkv) or hkv and range key value (rkv)
	app.get('/api/rest/:model/:hkv', function(req, res) {
		if (init(req, res)) {
			models[req.params.model].get(req.params.hkv, {ConsistentRead: true}, function (err, data) {
				handleSend(err, data, req, res);
			});
		}
	});
	app.get('/api/rest/:model/:hkv/:rkv', function(req, res) {
		handleSend(null, null, req, res);
	});

	// rest - post (update) handling either hash key value (hkv) or hkv and range key value (rkv)
	app.post('/api/rest/:model/:hkv', function(req, res) {
		handleSend(null, null, req, res);
	});
	app.post('/api/rest/:model/:hkv/:rkv', function(req, res) {
		handleSend(null, null, req, res);
	});

	// rest - put (create) handling either hash key value (hkv) or hkv and range key value (rkv)
	app.put('/api/rest/:model', function(req, res) {
		handleSend(null, null, req, res);
	});

	// rest - delete handling either hash key value (hkv) or hkv and range key value (rkv)
	app.delete('/api/rest/:model/:hkv', function(req, res) {
		handleSend(null, null, req, res);
	});
	app.delete('/api/rest/:model/:hkv/:rkv', function(req, res) {
		handleSend(null, null, req, res);
	});

}
