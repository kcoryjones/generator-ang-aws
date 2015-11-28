(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .filter('<%= _.camelCase(name) %>', <%= _.camelCase(name) %>);

    function <%= _.camelCase(name) %>() {
        return <%= _.camelCase(name) %>Filter;

        ////////////////

        function <%= _.camelCase(name) %>Filter(params) {
            return params;
        }
    }

})();
