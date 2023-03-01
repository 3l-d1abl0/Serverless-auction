# Authorization Service

This Service handles the jwt Token from the request via Validator Lambda in API Gateway.


* Keep your Auth0 certificate as secret.pem in the auth-service folder as it will be used by Lambda Authorizer
```
sls deploy --verbose --stage dev --aws-profile <aws-profile>
```

Check for the Stack Output, if everything deploys fine.