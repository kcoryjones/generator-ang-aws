//app.module.js
(function() {
    'use strict';

    angular
        .module('<%= _.camelCase(appname) %>', [
            'ui.bootstrap',
            'ui.utils',
            'ui.router',
            'ngAnimate'
        ]);
})();