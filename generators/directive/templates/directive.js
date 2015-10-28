angular.module('<%= appname %>').directive('<%= _.camelCase(name) %>', function() {
    return {
    <% if (directiveType=='complex') { %>
        restrict: 'E',
        replace: true,
        scope: {

        },
        templateUrl: '<%= path %><%= name %>.html',
    <% } %>
    <% if (directiveType=='simple') { %>
        restrict: 'A',
    <% } %>
        link: function(scope, element, attrs, fn) {

        }
    };
});
