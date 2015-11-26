(function() {
    'use strict';

    angular
        .module('<%= _.camelCase(appname) %>')
        .config(angAwsConfig);

    angAwsConfig.$inject = ['$httpProvider', 'angAws'];

    function angAwsConfig($httpProvider, angAws) {
        var intercept = false; //true for production

        //register interceptor
        $httpProvider.interceptors.push(function(angAws) {
            if (intercept) {
                return {
                    'request': request,
                    'response': response
                };
            }
            return {};
        });

        function request(config) {
            if (config.url.substring(0, 17) == "192.168.7.24:3002") {
                alert('request intercepted');
            }
            return config;
        }

        function response(response) {
            if (response.config.url.substring(0, 17) == "192.168.7.24:3002") {
                alert('response intercepted');
            }
            return response;
        }
    }
})();