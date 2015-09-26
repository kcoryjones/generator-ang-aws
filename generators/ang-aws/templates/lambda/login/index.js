console.log('Loading function');
var AWS = require('aws-sdk'), // globally available on local and aws
    bcrypt = require('bcrypt-nodejs'),
    jwt = require('jwt-simple'),
    config = require('./config');

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log(config);
  
  //get event variables
  var email = event.email || null;
  var password = event.password || null;
  var token = event.token || null;
  var identityId = event.identityId || null;

  //some private variables
  var jwtValidated = false;
  var tokenDuration = 86400;

  if (!token && (!email || !password)) {
    console.log('error', 'Blank Username or Password or no Token');
    context.fail('Invalid Username or Password');
  }

  if (token) {
    try {
      var parsedJwt = jwt.decode(token, config.secret, 'HS256');
    } catch (e) {
      console.log(e);      
      context.fail('Invalid Token');
    }
    email = parsedJwt.user.email.S;
    jwtValidated = true;
  }

  //payload to be filled out in jwt and secret to hash
  var exp = Math.floor(new Date() / 1000) + tokenDuration;
  var payload = {params:{Logins:{}},user:{},exp:exp};

  var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10', region: config.region});
  var params1 = {
    TableName: config.TableName,
    Key: {
      email: {S: email}
    },
    ConsistentRead: true,
  };
  console.log('starting dynamodb get item');
  dynamodb.getItem(params1, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail(err);
    } else {
      console.log(data);
      payload.user = JSON.parse(JSON.stringify(data.Item));
      payload.user.password.S = '';
      if (jwtValidated || bcrypt.compareSync(password, data.Item.password.S)) {
        console.log('password validated');
        var params = {
          IdentityPoolId: config.IdentityPoolId,
          Logins: {},
          TokenDuration: tokenDuration
        };
        console.log(params);
        params.Logins[config.DeveloperProviderName] = email;
        console.log(params);
        if (identityId) {
          params['IdentityId'] = identityId;
        }
        console.log(params);
        payload.params.IdentityPoolId = params.IdentityPoolId;
        var cognitoidentity = new AWS.CognitoIdentity({apiVersion: '2014-06-30', region: 'us-east-1'});
        cognitoidentity.getOpenIdTokenForDeveloperIdentity(params, function(err, data) {
          if (err) {
            console.log(err, err.stack);
            context.fail(err);
          } else {
            console.log('success', data);
            payload.params.IdentityId = data.IdentityId;
            payload.params.Logins['cognito-identity.amazonaws.com'] = data.Token;
            var jwtToken = jwt.encode(payload, config.secret);
            console.log('jwtToken', jwtToken);
            context.succeed(jwtToken);
          }
        });
      } else {
        console.log('error', 'Invalid Password');
        context.fail('Invalid Username or Password');
      }
    }
  });
};