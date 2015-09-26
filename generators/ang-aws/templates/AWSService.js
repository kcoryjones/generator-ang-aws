angular.module('<%= _.camelCase(appname) %>').factory('angAws',function($q) {
	
	//create our service object
	var AWSService = {};

	//set our defaults
	AWSService.defaults = {
		appname: '<%= _.camelCase(appname) %>',
		region: '<%= appname %>',
		IdentityPoolId: "<%= IdentityPoolId %>"
	}
	//default credentials - unauthenticated access: login function only
	AWSService.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: AWSService.defaults.IdentityPoolId
	});
	AWS.config.credentials = AWSService.credentials;
	AWSService.params = JSON.parse(JSON.stringify(AWSService.credentials.params)); //for debugging
	AWS.config.region = AWSService.defaults.region;


	//BEGIN PRIVATE FUNCTIONS
	//get cognito access
	AWSService._getCognitoAccess = function(email, password) {
		console.log('_getCognitoAccess(' + email + ',' + password + ')'); //for debugging
		var deferred = $q.defer();
		var force = false;
		if (email && password)
			var force = true;
		AWSService._loadCredentialParams(email, password).then(function(success) {
			AWSService._cognitoRefresh(force).then(function(success) {
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
	AWSService._loadCredentialParams = function(email, password) {
		console.log('_loadCredentialParams(' + email + ',' + password + ')'); //for debugging
		var deferred = $q.defer();
		var email = email || null;
		var password = password || null;		
		if (email && password) {
			AWSService._cognitoRefresh().then(function(success) {
				AWSService._setJwt(email, password).then(function(success) {
					AWSService._setParamsFromJwt();
					deferred.resolve({message:'set Jwt from email and password'});
				}, function(error) {
					deferred.reject(error);
				});
			}, function(error) {
				deferred.reject(error);
			});
		} else {
			if (AWSService._jwtNeedsRefresh()) {
				AWSService._setParamsFromJwt();
				AWSService._cognitoRefresh().then(function(success) {
					AWSService._setJwt(null, null, true).then(function(success) {
						AWSService._setParamsFromJwt();
						deferred.resolve({message:'set Jwt from jwt refresh'});
					}, function(error) {
						deferred.reject(error);
					});
				}, function(error) {
					deferred.reject(error);
				});
			} else {
				AWSService._setParamsFromJwt();
			}
			deferred.resolve({message:'set Jwt from email and password'});
		}
		return deferred.promise;
	};
	//refresh cognito access keys with current credentials
	AWSService._cognitoRefresh = function(force) {
		console.log('_cognitoRefresh(' + (force*1) + ') ' + AWSService.credentials.needsRefresh()); //for debugging
		var deferred = $q.defer();
		if (AWSService.credentials.needsRefresh() || force) {
			AWS.config.update({region:'us-east-1'});
			if (!AWSService.credentials.params.Logins) {
				AWSService.credentials.clearCachedId();
			}
			AWSService.credentials.refresh(function(error) {
				if (error) {
					deferred.reject(error);
				} else {
					AWSService.params = JSON.parse(JSON.stringify(AWSService.credentials.params)); //for debugging
					deferred.resolve({result:'success'});
				}
			});
			AWS.config.update({region:AWSService.defaults.region});
		} else {
			deferred.resolve({result:'success'});
		}
		return deferred.promise;
	};
	//call lambda login with email and password, set returned jwt to storage
	AWSService._setJwt = function(email, password, useToken) {
		console.log('_setJwt('+email+','+password+')'); //for debugging
		var deferred = $q.defer();
		var payload = {};
		if (email)
			payload.email = email;
		if (password)
			payload.password = password;
		if (useToken)
			payload.token = localStorage.getItem('jwt');
		if (AWSService.credentials.params.IdentityId)
			payload.identityId = AWSService.credentials.params.IdentityId;
		AWSService._lambdaInvoke(AWSService.defaults.region, AWSService.defaults.appname + '-login', 'RequestResponse', payload).then(function(jwt) {
			localStorage.setItem('jwt', jwt);
			deferred.resolve({message:'setjwt success'});
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	//load params from jwt
	AWSService._setParamsFromJwt = function() {
		console.log('_setParamsFromJwt()'); //for debugging
		var parsedJwt = AWSService._getParsedJwt();
		if (parsedJwt && parsedJwt.payload && parsedJwt.payload.params) {
			AWSService.credentials.params.IdentityId = parsedJwt.payload.params.IdentityId;
			AWSService.credentials.params.IdentityPoolId = parsedJwt.payload.params.IdentityPoolId;
			AWSService.credentials.params.Logins = parsedJwt.payload.params.Logins;
			AWSService.params = JSON.parse(JSON.stringify(AWSService.credentials.params)); //for debugging
			return true;
		}
		return false;
	};
	//return the parsed locally stored jwt or false
	AWSService._getParsedJwt = function() {
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
	AWSService._jwtNeedsRefresh = function() {
		console.log('_jwtNeedsRefresh()');
		var parsedJwt = AWSService._getParsedJwt();
		if (parsedJwt && parsedJwt.payload && parsedJwt.payload.exp) {
			return (parsedJwt.payload.exp < Math.floor(new Date() / 1000));
		}
		return false;
	}
	//general purpose - invoke any lambda function
	AWSService._lambdaInvoke = function(region, funcName, invocationType, payload) {
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
	AWSService._checkLoggedIn = function() {
		if (localStorage.getItem('jwt')) {
			AWSService.loggedin = true;
		} else {
			AWSService.loggedin = false;
		}
	};
	AWSService._checkLoggedIn();
	//END PRIVATE FUNCTIONS


	//BEGIN PUBLIC FUNCTIONS
	//login via username and password
	AWSService.login = function(email, password) {
		console.log('login(' + email + ',' + password + ')'); //for debugging
		var deferred = $q.defer();
		AWSService._getCognitoAccess(email, password).then(function(success) {
			AWSService._checkLoggedIn();
			deferred.resolve(success);
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	//logout
	AWSService.logout = function() {
		localStorage.removeItem('jwt');
		AWSService._checkLoggedIn();
		AWSService.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: AWSService.defaults.IdentityPoolId
		});
		AWSService.credentials.clearCachedId();
		AWS.config.credentials = AWSService.credentials;
		AWSService.params = JSON.parse(JSON.stringify(AWSService.credentials.params)); //for debugging
	};
	//END PUBLIC FUNCTIONS

	
	//return service object
	return AWSService;
});