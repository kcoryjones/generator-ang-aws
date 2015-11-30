(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .factory('<%= _.camelCase(name) %>', factory);

    factory.$inject = [/*'dependencies'*/];

    /* @ngInject */
    function factory() {
        var service = {
            func: func
        };
        return service;

        ////////////////

        function func() {
        }
    }
})();