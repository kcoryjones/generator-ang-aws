angular.module('<%= appname %>').filter('<%= _.camelCase(name) %>', function() {
    return function(input,arg) {
        return 'output';
    };
});
