angular.module('albumade').factory('api',function(angAws, $http) {
    //create our service object
	var api = {};

	api.defaults = {
		url: 'http://192.168.7.24:3002'
	};

	api.call = function(method, endpoint, data) {
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

	//our crud
	api.put = function(model, item) {
		var endpoint = '/api/rest/' + model + '/' + item.id;
		return api.call('PUT', endpoint, item);
	};
	api.get = function(model, hash) {
		var endpoint = '/api/rest/' + model;
		if (hash)
			endpoint += '/' + hash;
		return api.call('GET', endpoint, null);
	};
	api.post = function(model, hash, range) {
		var endpoint = '/api/rest/' + model;
		return api.call('POST', endpoint, item);
	};
	api.delete = function(model, item) {
		var endpoint = '/api/rest/' + model + '/' + item.id;
		return api.call('DELETE', endpoint, item);
	};

	//login
	api.login = function(user) {
		return api.call('POST', '/api/login', user);
	}

	//return service object
	return api;
});
