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
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + '! Let\'s make a Partial!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for the partial (letters only):',
        default: 'myPartial',
        validate: function(input) {
          var regex = /^[a-zA-Z]+$/;
          return regex.test(input);
        }
      }
    ];

    this.prompt(prompts, function(prompts) {
      this.prompts = prompts;
      var additionalPrompts = [
        {
          type: 'input',
          name: 'routeUrl',
          message: 'Enter ui-router state url:',
          default: '/' + this.prompts.name,
        },
        {
          type: 'input',
          name: 'path',
          message: 'Where would you like to create the partial files?',
          default: 'partial/'+ this.prompts.name + '/'
        }
      ];
      this.prompt(additionalPrompts, function(additionalPrompts) {
        this.prompts.routeUrl = additionalPrompts.routeUrl;
        this.prompts.path = additionalPrompts.path;
        done();
      }.bind(this));
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
      indexHtml = indexHtml.replace(marker, '<script src="' + this.prompts.path + this.prompts.name + '.controller.js"></script>' + "\n  " + marker);
      this.fs.write('app/index.html', indexHtml);
    },

    updateAppRoutesJs: function() {
      var appRoutesJs = this.fs.read('app/app.routes.js');
      var marker = '/* Add New States Above (Do not remove this line) */';
      var state = "$stateProvider.state('" + this.prompts.name + "', {" + "\n" +
        "          url: '" + this.prompts.routeUrl + "'," + "\n" +
        "          templateUrl: '" + this.prompts.path + this.prompts.name + ".html'" + "\n" + 
        "        });";
      appRoutesJs = appRoutesJs.replace(marker, state + "\n        " + marker);
      this.fs.write('app/app.routes.js', appRoutesJs);
    },

    updateAppLess: function() {
      var appLess = this.fs.read('app/app.less');
      var marker = '/* Add Component LESS Above (Do not remove this line) */';
      appLess = appLess.replace(marker, '@import "' + this.prompts.path + this.prompts.name + '.less";' + "\n" + marker);
      this.fs.write('app/app.less', appLess);
    },

    partialJs: function() {
      this.fs.copyTpl(
        this.templatePath('partial.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.controller.js'),
        this.prompts
      );
    },

    partialTest: function() {
      this.fs.copyTpl(
        this.templatePath('partial.spec.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.controller.spec.js'),
        this.prompts
      );
    },

    partialHtml: function() {
      this.fs.copyTpl(
          this.templatePath('partial.html'),
          this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.html'),
          this.prompts
        );
    },

    partialLess: function() {
      this.fs.copyTpl(
          this.templatePath('partial.less'),
          this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.less'),
          this.prompts
        );
    }
  },

  install: {},

  end: {}

});
