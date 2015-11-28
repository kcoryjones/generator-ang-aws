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
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + '! Let\'s make a Filter!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for the filter (letters only):',
        default: 'myFilter',
        validate: function(input) {
          var regex = /^[a-zA-Z]+$/;
          return regex.test(input);
        }
      },
      {
        type: 'input',
        name: 'path',
        message: 'Where would you like to create the filter files?',
        default: 'filters/'
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
      indexHtml = indexHtml.replace(marker, '<script src="' + this.prompts.path + this.prompts.name + '.filter.js"></script>' + "\n  " + marker);
      this.fs.write('app/index.html', indexHtml);
    },

    filterJs: function() {
      this.fs.copyTpl(
        this.templatePath('filter.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.filter.js'),
        this.prompts
      );
    },

    filterTest: function() {
      this.fs.copyTpl(
        this.templatePath('filter.spec.js'),
        this.destinationPath('app/' + this.prompts.path + this.prompts.name + '.filter.spec.js'),
        this.prompts
      );
    }
  },

  install: {},

  end: {}

});
