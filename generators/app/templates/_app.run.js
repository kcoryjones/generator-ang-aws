(function() {
    'use strict';

    angular
        .module('<%= _.camelCase(appname) %>')
        .run(appRun);
    
    appRun.$inject = ['$rootScope'];

    /* @ngInject */
    function appRun($rootScope) {

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

    }
})();