(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .controller('<%= _.capitalize(_.camelCase(name)) %>Controller', Controller);

    Controller.$inject = ['$scope'];

    /* @ngInject */
    function Controller($scope) {
        var vm = this;
        vm.title = 'Controller';

        activate();

        ////////////////

        function activate() {
        }
    }
})();