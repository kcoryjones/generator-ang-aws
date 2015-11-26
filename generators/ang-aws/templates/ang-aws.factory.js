(function() {
    'use strict';

    angular
        .module('<%= _.camelCase(appname) %>')
        .factory('angAws', angAws);

    angAws.$inject = ['$q'];
    
    function angAws($q) {
        var service = {
            api: api
        };

        return service;

        //invoke lambda api function specifically
        function api = function(payload) {
            var deferred = $q.defer();
            
            lambdaInvoke('<%= _.camelCase(appname) %>-api', payload).then(function(response) {
                deferred.resolve(response);
            }, function(error) {
                deferred.reject(error);
            });
            
            return deferred.promise;
        };

        //invoke any lambda function
        function lambdaInvoke = function(funcName, payload) {
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: '<%= identityPoolId %>'
            });
            AWS.config.region = 'us-east-1';
            var lambda = new AWS.Lambda({region:'<%= region %>'});
            var deferred = $q.defer();
            
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
    }
})();