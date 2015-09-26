var AWS = require('aws-sdk'),
	prompt = require('prompt'),
	bcrypt = require('bcrypt-nodejs'),
	exec = require('child_process').execSync,
	fs = require('fs');

if (!AWS.config.credentials.filename) {
	console.log('Error - no credentials file');
	return 1;
};

var appParamProps = {
	properties: {
		appname: {
			description: 'Enter your app name (letters only)',
			pattern: /^[a-zA-Z]+$/,
			message: 'Name must be only letters',
			required: true
		},
		region: {
			description: 'Enter your aws region',
			default: 'us-west-2',
			required: true
		},
		secret: {
			description: 'Enter a secret string for token signing',
			required: true
		},
		name: {
			description: 'Enter the SuperAdmin name',
			required: true
		},
		email: {
			description: 'Enter the SuperAdmin email',
			pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
			message: 'Please enter a valid email',
			required: true
		},
		password: {
			description: 'Enter the SuperAdmin password',
			hidden: true,
			required: true
		}
	}
};

prompt.start();

prompt.get(appParamProps, function (err, appParams) {
	if (err) {
		console.log('Parameter Input Error');
		return;
	}
	AWS.config.update({region: appParams.region});
	var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
	var createTableParams = {
		TableName: appParams.appname + '-users',
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
	console.log('Creating table ' + createTableParams.TableName + ' in DynamoDB');
	dynamodb.createTable(createTableParams, function(err, data) {
		if (err) {
			console.log('There was an error creating table ' + createTableParams.TableName + ' in DynamoDB');
			console.log(err.message);
			return;
		}
		dynamodb.waitFor('tableExists', {TableName:createTableParams.TableName}, function(err, data) {
			if (err) {
				console.log('There was an error creating table ' + createTableParams.TableName + ' in DynamoDB');
				console.log(err.message);
				return;
			}
			console.log('Table ' + createTableParams.TableName + ' created');
			console.log(data);
			var putItemParams = {
				TableName: createTableParams.TableName,
				Item: {
					email: {"S":appParams.email},
					name: {"S":appParams.name},
					password: {"S":bcrypt.hashSync(appParams.password)},
					role: {"S":"superadmin"}
				}
			}
			console.log('Inserting SuperAdmin');
			dynamodb.putItem(putItemParams, function(err, data) {
				if (err) {
					console.log('There was an error inserting SuperAdmin');
					console.log(err.message);
					return;
				}
				console.log('SuperAdmin user inserted');
				console.log(data);
				var cognitoidentity = new AWS.CognitoIdentity({region:'us-east-1'});
				var createIdentityPoolParams = {
					AllowUnauthenticatedIdentities: true,
					IdentityPoolName: appParams.appname + 'IdentityPool',
					DeveloperProviderName: 'users.' + appParams.appname + '.app'
				};
				console.log('Creating identity pool ' + createIdentityPoolParams.IdentityPoolName);
				cognitoidentity.createIdentityPool(createIdentityPoolParams, function(err, data) {
					if (err) {
						console.log('There was an error creating identity pool');
						console.log(err.message);
						return;
					}
					console.log('Identity pool created');
					console.log(data);
					var identityPoolId = data.IdentityPoolId;
					var iam = new AWS.IAM({apiVersion: '2010-05-08'});
					var createUnauthenticatedRoleParams = {
						AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Federated":"cognito-identity.amazonaws.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"cognito-identity.amazonaws.com:aud":"' + identityPoolId + '"},"ForAnyValue:StringLike":{"cognito-identity.amazonaws.com:amr":"unauthenticated"}}}]}',
						RoleName: appParams.appname + '-role-unauthenticated'
					};
					console.log('Creating identity pool unauthenticated role');
					iam.createRole(createUnauthenticatedRoleParams, function(err, data) {
						if (err) {
							console.log('There was an error creating unauthenticated role');
							console.log(err.message);
							return;
						}
						console.log('Unauthenticated role created');
						console.log(data);
						var unauthenticatedArn = data.Role.Arn;
						var createAuthenticatedRoleParams = {
							AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Federated":"cognito-identity.amazonaws.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"cognito-identity.amazonaws.com:aud":"' + identityPoolId + '"},"ForAnyValue:StringLike":{"cognito-identity.amazonaws.com:amr":"authenticated"}}}]}',
							RoleName: appParams.appname + '-role-authenticated'
						};
						console.log('Creating identity pool authenticated role');
						iam.createRole(createAuthenticatedRoleParams, function(err, data) {
							if (err) {
								console.log('There was an error creating Authenticated role');
								console.log(err.message);
								return;
							}
							console.log('Authenticated role created');
							console.log(data);
							var authenticatedArn = data.Role.Arn;
							var createLambdaRoleParams = {
								AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
								RoleName: appParams.appname + '-role-lambda'
							};
							console.log('Creating lambda role');
							iam.createRole(createLambdaRoleParams, function(err, data) {
								if (err) {
									console.log('There was an error creating lambda role');
									console.log(err.message);
									return;
								}
								console.log('Lambda role created');
								console.log(data);
								var lambdaArn = data.Role.Arn;
								fs.writeSync(fs.openSync('/var/www/lambda/login/config.js','w'), [
									"var config = {};",
									"config.region = '" + appParams.region + "';",
									"config.secret = '" + appParams.secret + "';",
									"config.TableName = '" + createTableParams.TableName + "';",
									"config.IdentityPoolId = '" + identityPoolId + "';",
									"config.DeveloperProviderName = '" + createIdentityPoolParams.DeveloperProviderName + "';",
									"module.exports = config;"
								].join("\n"));
								fs.writeSync(fs.openSync('/var/www/lambda/api/config.js', 'w'), [
									"var config = {};",
									"config.region = '" + appParams.region + "';",
									"config.secret = '" + appParams.secret + "';",
									"module.exports = config;"
								].join("\n"));
								var cmd = 'cd /var/www/lambda/login && zip -r login.zip . -x "*.zip"';
								console.log('Zipping login lambda function');
								exec(cmd, function(err, stdout, stderr) {
									if (err) {
										console.log('There was an error zipping lambda login');
										console.log(stderr);
										return;
									}
								});
								cmd = 'cd /var/www/lambda/api && zip -r api.zip . -x "*.zip"';
								console.log('Zipping api lambda function');
								exec(cmd, function(err, stdout, stderr) {
									if (err) {
										console.log('There was an error zipping lambda api');
										console.log(stderr);
										return;
									}
								});
								fs.readFile('/var/www/lambda/login/login.zip', function (err, loginFileBuffer) {
									if (err) {
										console.log('There was an error reading login zip file');
										console.log(err.message);
										return;
									}
									var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
									var createLambdaLoginParams = {
										Code: {
											ZipFile: loginFileBuffer
										},
										FunctionName: appParams.appname + '-login',
										Handler: 'index.handler',
										Role: lambdaArn,
										Runtime: 'nodejs',
										Description: 'Checks user email and password and returns cognito identity token',
										MemorySize: 1536,
										Timeout: 5
									};
									console.log('Creating login lambda function');								
									lambda.createFunction(createLambdaLoginParams, function(err, data) {
										if (err) {
											console.log('There was an error creating login lambda function');
											console.log(err.message);
											return;
										}
										console.log('Login lambda function created');
										console.log(data);
										var loginLambdaArn = data.FunctionArn;
										fs.readFile('/var/www/lambda/api/api.zip', function (err, apiFileBuffer) {
											if (err) {
												console.log('There was an error reading login zip file');
												console.log(err.message);
												return;
											}
											var createLambdaApiParams = {
												Code: {
													ZipFile:  apiFileBuffer
												},
												FunctionName: appParams.appname + '-api',
												Handler: 'index.handler',
												Role: lambdaArn,
												Runtime: 'nodejs',
												Description: 'Handles API calls',
												MemorySize: 1536,
												Timeout: 60
											};
											console.log('Creating api lambda function');
											lambda.createFunction(createLambdaApiParams, function(err, data) {
												if (err) {
													console.log('There was an error creating api lambda function');
													console.log(err.message);
													return;
												}
												console.log('Api lambda function created');
												console.log(data);
												var apiLambdaArn = data.FunctionArn;
												var putPolicyRoleLambdaParams = {
													PolicyDocument: '{"Version":"2012-10-17","Statement":[{"Action":["dynamodb:*"],"Effect":"Allow","Resource":"*"},{"Effect":"Allow","Action":["cognito-identity:GetOpenIdTokenForDeveloperIdentity"],"Resource":"*"}]}',
													PolicyName: appParams.appname + '-policy-lambda',
													RoleName: appParams.appname + '-role-lambda'
												};
												console.log('Putting dynamodb and cognito access policy for lambda role');
												iam.putRolePolicy(putPolicyRoleLambdaParams, function(err, data) {	
													if (err) {
														console.log('There was an error putting policy');
														console.log(err.message);
														return;
													}
													console.log('Lambda Role policy put');
													console.log(data);
													var putPolicyLoginLambdaParams = {
														PolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"Stmt1437017197000","Effect":"Allow","Action":["lambda:InvokeFunction"],"Resource":["' + loginLambdaArn + '"]}]}',
														PolicyName: appParams.appname + '-policy-lambda-login',
														RoleName: appParams.appname + '-role-unauthenticated'
													};
													console.log('Putting invoke login lambda policy for unauthenticated role');
													iam.putRolePolicy(putPolicyLoginLambdaParams, function(err, data) {
														if (err) {
															console.log('There was an error putting policy');
															console.log(err.message);
															return;
														}
														console.log('Invoke login lambda policy put');
														console.log(data);
														putPolicyLoginLambdaParams.RoleName = appParams.appname + '-role-authenticated';
														console.log('Putting invoke login lambda policy for authenticated role');
														iam.putRolePolicy(putPolicyLoginLambdaParams, function(err, data) {
															if (err) {
																console.log('There was an error putting policy');
																console.log(err.message);
																return;
															}
															console.log('Invoke login lambda policy put');
															console.log(data);
															var putPolicyApiLambdaParams = {
																PolicyDocument: '{"Version":"2012-10-17","Statement":[{"Sid":"Stmt1437017197000","Effect":"Allow","Action":["lambda:InvokeFunction"],"Resource":["' + apiLambdaArn + '"]}]}',
																PolicyName: appParams.appname + '-policy-lambda-api',
																RoleName: appParams.appname + '-role-authenticated'
															};
															console.log('Putting invoke api lambda policy for authenticated role');
															iam.putRolePolicy(putPolicyApiLambdaParams, function(err, data) {
																if (err) {
																	console.log('There was an error putting policy');
																	console.log(err.message);
																	return;
																}
																console.log('Invoke api lambda policy put');
																console.log(data);
																var setIdentityPoolRolesParams = {
																	IdentityPoolId: identityPoolId,
																	Roles: {
																		unauthenticated: unauthenticatedArn,
																		authenticated: authenticatedArn
																	}
																};
																cognitoidentity.setIdentityPoolRoles(setIdentityPoolRolesParams, function(err, data) {
																	if (err) {
																		console.log('There was an error setting identity pool roles');
																		console.log(err.message);
																		return;
																	}
																	console.log('Identity pool roles set');
																	console.log(data);
																	console.log('Wooo, that was long. Everything is set up now though!');
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
					 });
				});
			});
		});
	});
});