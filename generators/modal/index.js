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
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + ' !Let\'s make a Modal!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for the modal (letters only):',
        default: 'myModal',
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
          name: 'path',
          message: 'In what folder would you like to create the modal files?',
          default: 'modal/'+ this.prompts.name + '/'
        }
      ];
      this.prompt(additionalPrompts, function(additionalPrompts) {
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
      indexHtml = indexHtml.replace(marker, '<script src="' + this.prompts.path + this.prompts.name + '.modal.js"></script>' + "\n  " + marker);
      this.fs.write('app/index.html', indexHtml);
    },

    updateAppLess: function() {
      var appLess = this.fs.read('app/app.less');
      var marker = '/* Add Component LESS Above (Do not remove this line) */';
      appLess = appLess.replace(marker, '@import "' + this.prompts.path + this.prompts.name + '.modal.less";' + "\n" + marker);
      this.fs.write('app/app.less', appLess);
    },

    modalJs: function() {
      this.fs.copyTpl(
        this.templatePath('modal.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.modal.js'),
        this.prompts
      );
    },

    modalTest: function() {
      this.fs.copyTpl(
        this.templatePath('modal.spec.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.modal.spec.js'),
        this.prompts
      );
    },

    modalHtml: function() {
      this.fs.copyTpl(
          this.templatePath('modal.html'),
          this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.modal.html'),
          this.prompts
        );
    },

    modalLess: function() {
      this.fs.copyTpl(
          this.templatePath('modal.less'),
          this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.modal.less'),
          this.prompts
        );
    }
  },

  install: {},

  end: function() {
    console.log('');
    console.log('  Open this modal by using ' + chalk.bold('angular-ui-bootstrap') + ' module\'s ' + chalk.bold('$modal') + ' service:');
    console.log('');
    console.log('  $modal.open({');
    console.log('      templateUrl: \'' + this.prompts.path + this.prompts.name + '.modal.html' + '\',');
    console.log('      controller: \''+ _.capitalize(_.camelCase(this.prompts.name)) +'Controller\'');
    console.log('  }).result.then(function(result){');
    console.log('      //do something with the result');
    console.log('  });');
    console.log('');
  }

});