// v0.12.0 - https://github.com/ryanfitz/vogels/tree/e669fac5c70f30a4664e49276832bb00625ba67b
var vogels = require('vogels')
	,Joi = require('vogels/node_modules/joi')
	,User = vogels.define('User', {
  		//define hash key and range keys
	  	hashKey: 'email',
	  	// add the timestamp attributes (updatedAt, createdAt)
	  	timestamps: true,
	  	//define schema
	  	schema: {
	  		//id: vogels.types.uuid(),
	  		email: Joi.string().email(),
		    name: Joi.string(),
		    password: Joi.string(),
		    role: Joi.string()
		}
	});

module.exports = User;