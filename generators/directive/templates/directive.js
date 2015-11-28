(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .directive('<%= _.camelCase(name) %>', <%= _.camelCase(name) %>);

    directive.$inject = [/*'dependencies'*/];

    /* @ngInject */
    function <%= _.camelCase(name) %>(/*dependencies*/) {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            <% if (directiveType=='simple') { %>restrict: 'A'<% } %>
            <% if (directiveType=='complex') { %>scope: {},
            templateUrl: '<%= path %><%= name %>.directive.html'<% } %>
        };
        return directive;

        function link(scope, element, attrs) {
        }
    }

    /* @ngInject */
    function Controller() {

    }
})();
