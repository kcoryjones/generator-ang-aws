'use strict';
var yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    yosay = require('yosay'),
    exec = require('child_process').execSync;

module.exports = yeoman.generators.Base.extend({

  initializing: {},

  prompting: function() {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + ' generator!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'appname',
        message: 'Enter an app name (letters only). This will prefix all AWS entries and be the angular module name.',
        default: 'app',
        validate: function(input) {
          var regex = /^[a-zA-Z]+$/;
          return regex.test(input);
        }
      }
    ];

    this.prompt(prompts, function(prompts) {
      this.prompts = prompts;
      done();
    }.bind(this));
  },

  configuring: function() {
    this.log(this.prompts);
  },

  writing: {
    app: function() {
      this.fs.copyTpl(
        this.templatePath('_index.html'),
        this.destinationPath('app/index.html'),
        this.prompts
      );
      this.fs.copyTpl(
        this.templatePath('_app.js'),
        this.destinationPath('app/app.js'),
        this.prompts
      );
      this.fs.copyTpl(
        this.templatePath('_app.less'),
        this.destinationPath('app/app.less'),
        this.prompts
      );
    },

    dependencies: function() {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('app/package.json'),
        this.prompts
      );
      this.fs.copyTpl(
        this.templatePath('_bower.json'),
        this.destinationPath('app/bower.json'),
        this.prompts
      );
    },

    support: function() {
      // this.fs.copy(
      //   this.templatePath('bowerrc'),
      //   this.destinationPath('.bowerrc')
      // ); 
      // this.fs.copy(
      //   this.templatePath('editorconfig'),
      //   this.destinationPath('.editorconfig')
      // );
      // this.fs.copy(
      //   this.templatePath('jshintrc'),
      //   this.destinationPath('.jshintrc')
      // );
      // this.fs.copy(
      //   this.templatePath('_Gruntfile.js'),
      //   this.destinationPath('Gruntfile.js')
      // );
      // this.fs.copy(
      //   this.templatePath('_gulpfile.js'),
      //   this.destinationPath('gulpfile.js')
      // );
    }
  },

  install: function() {
    this.config.set('appname',this.prompts.appname);
    this.config.save();
    process.chdir('app/');
    this.runInstall('npm', '', {}, null);
    this.installDependencies({npm:false});
  },

  end: {}

});
