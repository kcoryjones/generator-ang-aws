(function() {
    'use strict';

    angular
        .module('<%= _.camelCase(appname) %>')
        .factory('api', factory);

    factory.$inject = ['$http'];

    /* @ngInject */
    function factory($http) {
    	var url  = 'http://192.168.7.24:3002';
		var service = {
            url: url,
            put: put,
            get: get,
            post: post,
            delete: del,
            login: login
        };

        return service;

        ////////////////

        //handles all methods
        function call(method, endpoint, data) {
			var config = {
				cache: false,
				method: method,
				url: url + endpoint
			}
			if (data) {
				config.data = data;
			}
			return $http(config);
		};

		//restful methods
		function put(model, item) {
			var endpoint = '/api/rest/' + model + '/' + item.id;
			return call('PUT', endpoint, item);
		};
		function get(model, hash) {
			var endpoint = '/api/rest/' + model;
			if (hash)
				endpoint += '/' + hash;
			return call('GET', endpoint, null);
		};
		function post(model, hash, range) {
			var endpoint = '/api/rest/' + model;
			return call('POST', endpoint, item);
		};
		function del(model, item) {
			var endpoint = '/api/rest/' + model + '/' + item.id;
			return call('DELETE', endpoint, item);
		};

		//login call
		function login(user) {
			return call('POST', '/api/login', user);
		};
    }
})();