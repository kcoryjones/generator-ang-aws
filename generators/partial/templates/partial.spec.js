describe('<%= _.capitalize(_.camelCase(name)) %>Controller', function() {

  beforeEach(module('<%= appname %>'));

  var scope,ctrl;

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('<%= _.capitalize(_.camelCase(name)) %>Controller', {$scope: scope});
  }));

  it('should ...', inject(function() {

    expect(1).toEqual(1);
      
  }));
});