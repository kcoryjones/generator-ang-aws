'use strict';
var yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    yosay = require('yosay'),
    fs = require('fs'),
    AWS = require('aws-sdk'),
    bcrypt = require('bcrypt-nodejs'),
    exec = require('child_process').execSync;

module.exports = yeoman.generators.Base.extend({

  initializing: function() {
    if (!AWS.config.credentials || !AWS.config.credentials.filename) {
      this.log(yosay(
        'Whoops! Looks like you haven\'t put in your AWS credentials yet!'
      ));
      this.env.error();
    }
  },

  prompting: function() {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the fantabulous ' + chalk.red('ang-aws') + '! Let\'s create the ang-aws Service!'
    ));

    var prompts = [
      {
        type: 'list',
        name: 'region',
        message: 'Enter the AWS region to create entries in',
        choices: [
          {
            name:  'Oregon (us-west-2)',
            value: 'us-west-2'
          },
          {
            name:  'N. Virginia (us-east-1)',
            value: 'us-east-1'
          },
          {
            name:  'EU Ireland (eu-west-1)',
            value: 'eu-west-1'
          },
          {
            name:  'Asia Tokyo (ap-northeast-1)',
            value: 'ap-northeast-1'
          }
        ]
      },
      {
        type: 'input',
        name: 'secret',
        message: 'Enter a secret string for token signing',
        default: 'lonGstrinGwith$ymb01s'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Enter the superadmin name',
        default: 'K Cory Jones'
      },
      {
        type: 'input',
        name: 'email',
        message: 'Enter the superadmin email',
        default: 'kcoryjones@gmail.com',
        validate: function(input) {
          // won't catch everything, but fairly decent email regex
          var regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
          return regex.test(input);
        }
      },
      {
        type: 'password',
        name: 'password',
        default: 'password',
        message: 'Enter the superadmin password'
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
    lambda: function() {
      this.log('writing lambda...');
      var that = this;
      //make all our directories
      fs.mkdirSync(this.destinationPath('lambda'));
      fs.mkdirSync(this.destinationPath('lambda/api'));
      fs.mkdirSync(this.destinationPath('lambda/api/controllers'));
      fs.mkdirSync(this.destinationPath('lambda/api/models'));
      fs.writeFileSync(
        this.destinationPath('lambda/api/package.json'),
        this.fs.read(this.templatePath('lambda/api/_package.json'))
      );
      fs.writeFileSync(
        this.destinationPath('lambda/api/index.js'),
        this.fs.read(this.templatePath('lambda/api/index.js'))
      );
      fs.writeFileSync(
        this.destinationPath('lambda/api/controllers/api.js'),
        this.fs.read(this.templatePath('lambda/api/controllers/api.js'))
      );
      fs.writeFileSync(
        this.destinationPath('lambda/api/models/users.js'),
        this.fs.read(this.templatePath('lambda/api/models/users.js'))
      );
    },

    lambdaDependencies: function() {
      var that = this;
      // run npm install for lambda/api
      that.log('Updating lambda api dependencies...');
      var apiCmd = 'sudo npm update --prefix=' + that.destinationPath('lambda/api');
      exec(apiCmd, function(err, stdout, stderr) {
        if (err) {
          that.log('There was an error');
          that.log(stderr);
          that.env.error();
        }
        that.log(stdout);
      });
    },

    awsSetup: function() {
      var done = this.async();
      var that = this;
      that.log('configuring aws...');
      AWS.config.update({region: that.prompts.region});
      var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
      var createTableParams = {
        TableName: that.prompts.appname + '-users',
        AttributeDefinitions: [{
          AttributeName: 'email', 
          AttributeType: 'S' 
        }],
        KeySchema: [{
          AttributeName: 'email',
          KeyType: 'HASH'
        }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      };
      var iam = new AWS.IAM({apiVersion: '2010-05-08'});
      var createLambdaRoleParams = {
        AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
        RoleName: that.prompts.appname + '-role-lambda'
      };
      that.log('Creating lambda role');
      iam.createRole(createLambdaRoleParams, function(err, data) {
        if (err) {
          that.log('There was an error creating lambda role');
          that.log(err.message);
          that.env.error();
        }
        that.log('Lambda role created');
        that.log(data);
        var lambdaArn = data.Role.Arn;
        that.log('Creating table ' + createTableParams.TableName + ' in DynamoDB');
        dynamodb.createTable(createTableParams, function(err, data) {
          if (err) {
            that.log('There was an error creating table ' + createTableParams.TableName + ' in DynamoDB');
            that.log(err.message);
            that.env.error();
          }
          dynamodb.waitFor('tableExists', {TableName:createTableParams.TableName}, function(err, data) {
            if (err) {
              that.log('There was an error creating table ' + createTableParams.TableName + ' in DynamoDB');
              that.log(err.message);
              that.env.error();
            }
            that.log('Table ' + createTableParams.TableName + ' created');
            that.log(data);
            var putItemParams = {
              TableName: createTableParams.TableName,
              Item: {
                email: {"S":that.prompts.email},
                name: {"S":that.prompts.name},
                password: {"S":bcrypt.hashSync(that.prompts.password)},
                role: {"S":"superadmin"}
              }
            }
            that.log('Inserting SuperAdmin');
            dynamodb.putItem(putItemParams, function(err, data) {
              if (err) {
                that.log('There was an error inserting SuperAdmin');
                that.log(err.message);
                that.env.error();
              }
              that.log('SuperAdmin user inserted');
              that.log(data);
              var cognitoidentity = new AWS.CognitoIdentity({region:'us-east-1'});
              var createIdentityPoolParams = {
                AllowUnauthenticatedIdentities: true,
                IdentityPoolName: that.prompts.appname + 'IdentityPool',
                DeveloperProviderName: 'users.' + that.prompts.appname + '.app'
              };
              that.log('Creating identity pool ' + createIdentityPoolParams.IdentityPoolName);
              cognitoidentity.createIdentityPool(createIdentityPoolParams, function(err, data) {
                if (err) {
                  that.log('There was an error creating identity pool');
                  that.log(err.message);
                  that.env.error();
                }
                that.log('Identity pool created');
                that.log(data);
                var identityPoolId = that.prompts.identityPoolId = data.IdentityPoolId;
                var createUnauthenticatedRoleParams = {
                  AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Federated":"cognito-identity.amazonaws.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"cognito-identity.amazonaws.com:aud":"' + identityPoolId + '"},"ForAnyValue:StringLike":{"cognito-identity.amazonaws.com:amr":"unauthenticated"}}}]}',
                  RoleName: that.prompts.appname + '-role-unauthenticated'
                };
                that.log('Creating identity pool unauthenticated role');
                iam.createRole(createUnauthenticatedRoleParams, function(err, data) {
                  if (err) {
                    that.log('There was an error creating unauthenticated role');
                    that.log(err.message);
                    that.env.error();
                  }
                  that.log('Unauthenticated role created');
                  that.log(data);
                  var unauthenticatedArn = data.Role.Arn;
                  fs.writeSync(fs.openSync(that.destinationPath('lambda/api/config.js'), 'w'), [
                    "var config = {};",
                    "config.region = '" + that.prompts.region + "';",
                    "config.secret = '" + that.prompts.secret + "';",
                    "config.TableName = '" + createTableParams.TableName + "';",
                    "config.IdentityPoolId = '" + that.prompts.identityPoolId + "';",
                    "config.DeveloperProviderName = '" + createIdentityPoolParams.DeveloperProviderName + "';",
                    "module.exports = config;"
                  ].join("\n"));
                  var cmd = 'cd ' + that.destinationPath('lambda/api') + ' && zip -r api.zip . -x "*.zip"';
                  that.log('Zipping api lambda function');
                  exec(cmd, function(err, stdout, stderr) {
                    if (err) {
                      that.log('There was an error zipping lambda api');
                      that.log(stderr);
                      that.env.error();
                    }
                  });
                  fs.readFile(that.destinationPath('lambda/api/api.zip'), function (err, apiFileBuffer) {
                    if (err) {
                      that.log('There was an error reading api zip file');
                      that.log(err.message);
                      that.env.error();
                    }
                    var createLambdaApiParams = {
                      Code: {
                        ZipFile:  apiFileBuffer
                      },
                      FunctionName: that.prompts.appname + '-api',
                      Handler: 'index.handler',
                      Role: lambdaArn,
                      Runtime: 'nodejs',
                      Description: 'Handles API calls',
                      MemorySize: 1536,
                      Timeout: 60
                    };
                    that.log('Creating api lambda function');
                    var lambda = new AWS.Lambda();
                    lambda.createFunction(createLambdaApiParams, function(err, data) {
                      if (err) {
                        that.log('There was an error creating api lambda function');
                        that.log(err.message);
                        that.env.error();
                      }
                      that.log('Api lambda function created');
                      that.log(data);
                      var apiLambdaArn = data.FunctionArn;
                      var putPolicyRoleLambdaParams = {
                        PolicyDocument: '{"Version":"2012-10-17","Statement":[{"Action":["dynamodb:*"],"Effect":"Allow","Resource":"*"},{"Effect":"Allow","Action":["cognito-identity:GetOpenIdTokenForDeveloperIdentity"],"Resource":"*"}]}',
                        PolicyName: that.prompts.appname + '-policy-lambda',
                        RoleName: that.prompts.appname + '-role-lambda'
                      };
                      that.log('Putting dynamodb and cognito access policy for lambda role');
                      iam.putRolePolicy(putPolicyRoleLambdaParams, function(err, data) {  
                        if (err) {
                          that.log('There was an error putting policy');
                          that.log(err.message);
                          that.env.error();
                        }
                        that.log('Lambda Role policy put');
                        that.log(data);
                        var putPolicyApiLambdaParams = {
                          PolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"Stmt1437017197000","Effect":"Allow","Action":["lambda:InvokeFunction"],"Resource":["' + apiLambdaArn + '"]}]}',
                          PolicyName: that.prompts.appname + '-policy-lambda-api',
                          RoleName: that.prompts.appname + '-role-unauthenticated'
                        };
                        that.log('Putting invoke api lambda policy for unauthenticated role');
                        iam.putRolePolicy(putPolicyApiLambdaParams, function(err, data) {
                          if (err) {
                            that.log('There was an error putting policy');
                            that.log(err.message);
                            that.env.error();
                          }
                          that.log('Invoke api lambda policy put');
                          that.log(data);
                          var setIdentityPoolRolesParams = {
                            IdentityPoolId: identityPoolId,
                            Roles: {
                              unauthenticated: unauthenticatedArn
                            }
                          };
                          cognitoidentity.setIdentityPoolRoles(setIdentityPoolRolesParams, function(err, data) {
                            if (err) {
                              that.log('There was an error setting identity pool roles');
                              that.log(err.message);
                              that.env.error();
                            }
                            that.log('Identity pool roles set');
                            that.log(data);
                            // update index.html
                            that.log('updating index.html...');
                            var indexHtml = that.fs.read('app/index.html');
                            var marker = '<!-- Add New Component JS Above (Do not remove this line) -->';
                            indexHtml = indexHtml.replace(marker, '<script src="service/angAws.js"></script>' + "\n  " + '<script src="service/angAws.js"></script>' + "\n  " + marker);
                            that.fs.write('app/index.html', indexHtml);
                            // write angAws service
                            that.log('writing angAws service...');
                            that.fs.copyTpl(
                              that.templatePath('angAws.js'),
                              that.destinationPath('app/service/angAws.js'),
                              that.prompts
                            );
                            // write api service
                            that.log('writing api service...');
                            that.fs.copyTpl(
                              that.templatePath('api.js'),
                              that.destinationPath('app/service/api.js'),
                              that.prompts
                            );
                            that.log('All done!');
                            done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    },

    angAwsJs: function() {
      this.fs.copyTpl(
        this.templatePath('angAws.js'),
        this.destinationPath('app/service/angAws.js'),
        this.prompts
      );
    }

  },

  install: function() {
    this.log('Saving configuration...');
    this.config.set('region',this.prompts.region);
    this.config.set('identityPoolId',this.prompts.identityPoolId);
    this.config.save();
  },

  end: {}

});
