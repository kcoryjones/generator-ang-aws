describe('<%= _.camelCase(name) %>', function() {

    beforeEach(module('<%= appname %>'));

    it('should ...', inject(function($filter) {

        var filter = $filter('<%= _.camelCase(name) %>');
        expect(filter('input')).toEqual('output');

    }));
});