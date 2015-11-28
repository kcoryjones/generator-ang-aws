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
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + '! Let\'s make a Directive!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for the directive (letters only):',
        default: 'myDirective',
        validate: function(input) {
          var regex = /^[a-zA-Z]+$/;
          return regex.test(input);
        }
      },
      {
        type: 'list',
        name: 'directiveType',
        message: 'Does this directive need an external html file (partial)?',
        choices: [
          {
            name:  'No',
            value: 'simple'
          },
          {
            name:  'Yes',
            value: 'complex'
          }
        ]
      },
    ];

    this.prompt(prompts, function(prompts) {
      this.prompts = prompts;
      var pathPrompt = [
        {
          type: 'input',
          name: 'path',
          message: 'In what folder would you like to create the directive files?',
          default: 'directive/'+ this.prompts.name + '/'
        },
      ];
      this.prompt(pathPrompt, function(pathPrompt) {
        this.prompts.path = pathPrompt.path;
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
      indexHtml = indexHtml.replace(marker, '<script src="' + this.prompts.path + this.prompts.name + '.directive.js"></script>' + "\n  " + marker);
      this.fs.write('app/index.html', indexHtml);
    },

    updateAppLess: function() {
      if (this.prompts.directiveType=='complex') {
        var appLess = this.fs.read('app/app.less');
        var marker = '/* Add Component LESS Above (Do not remove this line) */';
        appLess = appLess.replace(marker, '@import "' + this.prompts.path + this.prompts.name + '.directive.less";' + "\n" + marker);
        this.fs.write('app/app.less', appLess);
      }
    },

    directiveJs: function() {
      this.fs.copyTpl(
        this.templatePath('directive.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.directive.js'),
        this.prompts
      );
    },

    directiveTest: function() {
      this.fs.copyTpl(
        this.templatePath('directive.spec.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.directive.spec.js'),
        this.prompts
      );
    },

    directiveHtml: function() {
      if (this.prompts.directiveType=='complex') {
        this.fs.copyTpl(
          this.templatePath('directive.html'),
          this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.directive.html'),
          this.prompts
        );
      }
    },
    
    directiveLess: function() {
      if (this.prompts.directiveType=='complex') {
        this.fs.copyTpl(
          this.templatePath('directive.less'),
          this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.directive.less'),
          this.prompts
        );
      }
    }
  },

  install: {},

  end: {}

});
