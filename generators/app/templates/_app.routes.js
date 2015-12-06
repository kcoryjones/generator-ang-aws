(function() {
    'use strict';
    
    angular
        .module('<%= _.camelCase(appname) %>')
        .config(config);

    config.$inject = ['$stateProvider','$urlRouterProvider','$locationProvider'];

    /* @ngInject */
    function config($stateProvider, $urlRouterProvider, $locationProvider) {

        /* Add New States Above (Do not remove this line) */
        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);
    }
})();