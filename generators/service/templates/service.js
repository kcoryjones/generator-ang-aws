angular.module('<%= appname %>').factory('<%= _.camelCase(name) %>',function() {
    var <%= _.camelCase(name) %> = {};
    return <%= _.camelCase(name) %>;
});
