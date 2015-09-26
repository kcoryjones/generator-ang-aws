'use strict';
var yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  
  initializing: {},

  prompting: function() {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + '! Let\'s make a Service!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for the service (letters only):',
        default: 'myService',
        validate: function(input) {
          var regex = /^[a-zA-Z]+$/;
          return regex.test(input);
        }
      },
      {
        type: 'input',
        name: 'path',
        message: 'Where would you like to create the service files?',
        default: 'services/'
      }
    ];

    this.prompt(prompts, function(prompts) {
      this.prompts = prompts;
      done();
    }.bind(this));
  },

  configuring: function() {
    var config = this.config.getAll();
    for (var attrname in config) {
      this.prompts[attrname] = config[attrname];
    }
    this.log(this.prompts);
  },

  writing: {
    updateIndexHtml: function() {
      var indexHtml = this.fs.read('app/index.html');
      var marker = '<!-- Add New Component JS Above (Do not remove this line) -->';
      indexHtml = indexHtml.replace(marker, '<script src="' + this.prompts.path + this.prompts.name + '.js"></script>' + "\n  " + marker);
      this.fs.write('app/index.html', indexHtml);
    },
    
    serviceJs: function() {
      this.fs.copyTpl(
        this.templatePath('service.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.js'),
        this.prompts
      );
    },

    serviceTest: function() {
      this.fs.copyTpl(
        this.templatePath('service-spec.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '-spec.js'),
        this.prompts
      );
    }
  },

  install: {},

  end: {}

});
