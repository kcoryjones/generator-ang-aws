(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .controller('<% _.capitalize(_.camelCase(name)) %>Controller', Controller);

    Controller.$inject = [/*'dependencies'*/];

    /* @ngInject */
    function Controller() {
        var vm = this;

        activate();

        ////////////////

        function activate() {
        }
    }
})();
