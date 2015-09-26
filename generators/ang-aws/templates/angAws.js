angular.module('<%= _.camelCase(appname) %>').factory('angAws',function($q) {
	
	//create our service object
	var angAws = {};

	//set our defaults
	angAws.defaults = {
		appname: '<%= _.camelCase(appname) %>',
		region: '<%= appname %>',
		IdentityPoolId: "<%= identityPoolId %>"
	}
	//default credentials - unauthenticated access: login function only
	angAws.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: angAws.defaults.IdentityPoolId
	});
	AWS.config.credentials = angAws.credentials;
	angAws.params = JSON.parse(JSON.stringify(angAws.credentials.params)); //for debugging
	AWS.config.region = angAws.defaults.region;


	//BEGIN PRIVATE FUNCTIONS
	//get cognito access
	angAws._getCognitoAccess = function(email, password) {
		console.log('_getCognitoAccess(' + email + ',' + password + ')'); //for debugging
		var deferred = $q.defer();
		var force = false;
		if (email && password)
			var force = true;
		angAws._loadCredentialParams(email, password).then(function(success) {
			angAws._cognitoRefresh(force).then(function(success) {
				deferred.resolve(success);
			}, function(error) {
				deferred.reject(error);
			});
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	//load credential params via email password or unexpired jwt
	angAws._loadCredentialParams = function(email, password) {
		console.log('_loadCredentialParams(' + email + ',' + password + ')'); //for debugging
		var deferred = $q.defer();
		var email = email || null;
		var password = password || null;		
		if (email && password) {
			angAws._cognitoRefresh().then(function(success) {
				angAws._setJwt(email, password).then(function(success) {
					angAws._setParamsFromJwt();
					deferred.resolve({message:'set Jwt from email and password'});
				}, function(error) {
					deferred.reject(error);
				});
			}, function(error) {
				deferred.reject(error);
			});
		} else {
			if (angAws._jwtNeedsRefresh()) {
				angAws._setParamsFromJwt();
				angAws._cognitoRefresh().then(function(success) {
					angAws._setJwt(null, null, true).then(function(success) {
						angAws._setParamsFromJwt();
						deferred.resolve({message:'set Jwt from jwt refresh'});
					}, function(error) {
						deferred.reject(error);
					});
				}, function(error) {
					deferred.reject(error);
				});
			} else {
				angAws._setParamsFromJwt();
			}
			deferred.resolve({message:'set Jwt from email and password'});
		}
		return deferred.promise;
	};
	//refresh cognito access keys with current credentials
	angAws._cognitoRefresh = function(force) {
		console.log('_cognitoRefresh(' + (force*1) + ') ' + angAws.credentials.needsRefresh()); //for debugging
		var deferred = $q.defer();
		if (angAws.credentials.needsRefresh() || force) {
			AWS.config.update({region:'us-east-1'});
			if (!angAws.credentials.params.Logins) {
				angAws.credentials.clearCachedId();
			}
			angAws.credentials.refresh(function(error) {
				if (error) {
					deferred.reject(error);
				} else {
					angAws.params = JSON.parse(JSON.stringify(angAws.credentials.params)); //for debugging
					deferred.resolve({result:'success'});
				}
			});
			AWS.config.update({region:angAws.defaults.region});
		} else {
			deferred.resolve({result:'success'});
		}
		return deferred.promise;
	};
	//call lambda login with email and password, set returned jwt to storage
	angAws._setJwt = function(email, password, useToken) {
		console.log('_setJwt('+email+','+password+')'); //for debugging
		var deferred = $q.defer();
		var payload = {};
		if (email)
			payload.email = email;
		if (password)
			payload.password = password;
		if (useToken)
			payload.token = localStorage.getItem('jwt');
		if (angAws.credentials.params.IdentityId)
			payload.identityId = angAws.credentials.params.IdentityId;
		angAws._lambdaInvoke(angAws.defaults.region, angAws.defaults.appname + '-login', 'RequestResponse', payload).then(function(jwt) {
			localStorage.setItem('jwt', jwt);
			deferred.resolve({message:'setjwt success'});
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	//load params from jwt
	angAws._setParamsFromJwt = function() {
		console.log('_setParamsFromJwt()'); //for debugging
		var parsedJwt = angAws._getParsedJwt();
		if (parsedJwt && parsedJwt.payload && parsedJwt.payload.params) {
			angAws.credentials.params.IdentityId = parsedJwt.payload.params.IdentityId;
			angAws.credentials.params.IdentityPoolId = parsedJwt.payload.params.IdentityPoolId;
			angAws.credentials.params.Logins = parsedJwt.payload.params.Logins;
			angAws.params = JSON.parse(JSON.stringify(angAws.credentials.params)); //for debugging
			return true;
		}
		return false;
	};
	//return the parsed locally stored jwt or false
	angAws._getParsedJwt = function() {
		console.log('_getParsedJwt()'); //for debugging
		var jwt = localStorage.getItem('jwt') || null;
		if (jwt) {
			var parsedJwt = {};
			jwt = jwt.split('.');
			parsedJwt.header = JSON.parse(window.atob(jwt[0]));
			parsedJwt.payload = JSON.parse(window.atob(jwt[1]));
			parsedJwt.signature = jwt[2];
			return parsedJwt;
		} else {
			return false;
		}
	};
	//return true or false whether we have a jwt that needs to be refreshed
	angAws._jwtNeedsRefresh = function() {
		console.log('_jwtNeedsRefresh()');
		var parsedJwt = angAws._getParsedJwt();
		if (parsedJwt && parsedJwt.payload && parsedJwt.payload.exp) {
			return (parsedJwt.payload.exp < Math.floor(new Date() / 1000));
		}
		return false;
	}
	//general purpose - invoke any lambda function
	angAws._lambdaInvoke = function(region, funcName, invocationType, payload) {
		// console.log('_lambdaInvoke('+region+','+funcName+','+invocationType+','+payload+')', payload); //for debugging
		var deferred = $q.defer();
		var lambda = new AWS.Lambda({region: region});
		var params = {
			FunctionName: funcName,
			InvocationType: invocationType, // 'Event | RequestResponse | DryRun',
			LogType: 'Tail',
			Payload: JSON.stringify(payload)
		};
		lambda.invoke(params, function(error, success) {
			if (error) {
				deferred.reject(error);
			} else {
				var success = JSON.parse(success.Payload);
				if (success.errorMessage) {
					deferred.reject(success); //weird I know but lamba context.fail is coming back as success object with .errorMessage property
				} else {
					deferred.resolve(success);
				}
			}
		});
		return deferred.promise;
	};
	angAws._checkLoggedIn = function() {
		if (localStorage.getItem('jwt')) {
			angAws.loggedin = true;
		} else {
			angAws.loggedin = false;
		}
	};
	angAws._checkLoggedIn();
	//END PRIVATE FUNCTIONS


	//BEGIN PUBLIC FUNCTIONS
	//login via username and password
	angAws.login = function(email, password) {
		console.log('login(' + email + ',' + password + ')'); //for debugging
		var deferred = $q.defer();
		angAws._getCognitoAccess(email, password).then(function(success) {
			angAws._checkLoggedIn();
			deferred.resolve(success);
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	//logout
	angAws.logout = function() {
		localStorage.removeItem('jwt');
		angAws._checkLoggedIn();
		angAws.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: angAws.defaults.IdentityPoolId
		});
		angAws.credentials.clearCachedId();
		AWS.config.credentials = angAws.credentials;
		angAws.params = JSON.parse(JSON.stringify(angAws.credentials.params)); //for debugging
	};
	//END PUBLIC FUNCTIONS

	
	//return service object
	return angAws;
});