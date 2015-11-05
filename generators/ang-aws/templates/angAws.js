angular.module('<%= _.camelCase(appname) %>').factory('angAws',function($q, $httpProvider) {
	
	//create our service object
	var angAws = {};
	//intercept tells our interceptor to intercept
	angAws.intercept = true;

	//AWS config
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: '<%= identityPoolId %>'
	});
	AWS.config.region = 'us-east-1';

	//general purpose - invoke any lambda function
	angAws._lambdaInvoke = function(funcName, payload) {
		var deferred = $q.defer();
		var lambda = new AWS.Lambda({region:'<%= region %>'});
		lambda.invoke({
			FunctionName: funcName,
			Payload: JSON.stringify(payload),
			InvocationType: 'RequestResponse',
			LogType: 'Tail'
		}, function(error, success) {
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

	//invoke lambda api function specifically
	angAws._api = function(payload) {
		var deferred = $q.defer();
		angAws._lambdaInvoke('<%= _.camelCase(appname) %>-api', payload).then(function(response) {
			deferred.resolve(response);
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	}

	//return service object
	return angAws;
}).config(function($httpProvider) {
	//register interceptor
    $httpProvider.interceptors.push(function(angAws) {
        if (angAws.intercept) {
            return {
               'request': function(config) {
                    //alert(JSON.stringify(config));
                    if (config.url.substring(0, 17) == "192.168.7.24:3002") {
                        alert('request intercepted');
                    }
                    return config;
                },
                'response': function(response) {
                    //alert(JSON.stringify(response));
                    if (response.config.url.substring(0, 17) == "192.168.7.24:3002") {
                        alert('response intercepted');
                    }
                    return response;
                }
            };
        }
        return {};
    });
});