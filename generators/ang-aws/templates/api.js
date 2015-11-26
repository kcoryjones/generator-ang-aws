(function() {
    'use strict';

    angular
        .module('<%= _.camelCase(appname) %>')
        .factory('api', api);

    api.$inject = ['$http'];

    function api($http) {
    	var url  = 'http://192.168.7.24:3002';
		var service = {
            url: url,
            put: put,
            get: get,
            post: post,
            delete: delete,
            login: login
        };

        return service;

        //handles all methods
        function call = function(method, endpoint, data) {
			var config = {
				cache: false,
				method: method,
				url: api.defaults.url + endpoint
			}
			if (data) {
				config.data = data;
			}
			return $http(config);
		};

		//restful methods
		function put = function(model, item) {
			var endpoint = '/api/rest/' + model + '/' + item.id;
			return api.call('PUT', endpoint, item);
		};
		function get = function(model, hash) {
			var endpoint = '/api/rest/' + model;
			if (hash)
				endpoint += '/' + hash;
			return api.call('GET', endpoint, null);
		};
		function post = function(model, hash, range) {
			var endpoint = '/api/rest/' + model;
			return api.call('POST', endpoint, item);
		};
		function delete = function(model, item) {
			var endpoint = '/api/rest/' + model + '/' + item.id;
			return api.call('DELETE', endpoint, item);
		};

		//login call
		api.login = function(user) {
			return api.call('POST', '/api/login', user);
		}

    }
})();