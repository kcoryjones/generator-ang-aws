angular.module('<%= _.camelCase(appname) %>', ['ui.bootstrap','ui.utils','ui.router','ngAnimate']);

angular.module('<%= _.camelCase(appname) %>').config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    /* Add New States Above (Do not remove this line) */
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
});

angular.module('<%= _.camelCase(appname) %>').run(function($rootScope) {

    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    /*//state change listener
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) { 
            $rootScope.stateChange = true;
    });
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) { 
            $rootScope.stateChange = false;
    });
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) { 
            $rootScope.stateChange = false;
    });
    */

});