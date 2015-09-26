angular.module('<%= _.camelCase(appname) %>', ['ui.bootstrap','ui.utils','ui.router','ngAnimate']);

angular.module('<%= _.camelCase(appname) %>').config(function($stateProvider, $urlRouterProvider) {

    /* Add New States Above (Do not remove this line) */
    $urlRouterProvider.otherwise('/home');

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

});