(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .directive('<%= _.camelCase(name) %>', directive);
    
    directive.$inject = [/*'dependencies'*/];

    /* @ngInject */
    function directive() {
        // Usage    :
        //
        // Creates:
        //
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            <% if (directiveType=='simple') { %>restrict: 'A'<% } %><% if (directiveType=='complex') { %>scope: true,
            templateUrl: '<%= path %><%= name %>.directive.html'<% } %>
        };
        
        return directive;

        function link(scope, element, attrs) {
        }
    }

    Controller.$inject = [/*'dependencies'*/];

    /* @ngInject */
    function Controller() {
        var vm = this;
    }
})();
