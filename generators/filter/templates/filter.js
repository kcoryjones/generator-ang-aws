(function() {
    'use strict';

    angular
        .module('<%= appname %>')
        .filter('<%= _.camelCase(name) %>', filter);

    function filter() {
        return <%= _.camelCase(name) %>Filter;

        ////////////////

        function <%= _.camelCase(name) %>Filter(params) {
            return params;
        }
    }

})();
