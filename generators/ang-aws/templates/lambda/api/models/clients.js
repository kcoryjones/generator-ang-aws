// v0.12.0 - https://github.com/ryanfitz/vogels/tree/e669fac5c70f30a4664e49276832bb00625ba67b
var vogels = require('vogels')
	,Joi = require('vogels/node_modules/joi')
	,Client = vogels.define('Client', {
  		//define hash key and range keys
	  	hashKey: 'id',
	  	// add the timestamp attributes (updatedAt, createdAt)
	  	timestamps: true,
	  	//define schema
	  	schema: {
		    id: vogels.types.uuid(),
		    site: Joi.string(),
		    tld: Joi.string(),
		    settings: {
			    color: Joi.string().default('blue'),
			    acceptedTerms: Joi.boolean().default(false)
		    }
		}
	});

module.exports = Client;