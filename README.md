# node-lambda-functions [![Build Status](https://travis-ci.org/rimiti/node-lambda-functions.svg?branch=master)](https://travis-ci.org/rimiti/node-lambda-functions) [![Coverage Status](https://coveralls.io/repos/github/rimiti/node-lambda-functions/badge.svg?branch=master)](https://coveralls.io/github/rimiti/node-lambda-functions?branch=master)
Convert your object into HL7 message.

# Install
```
$ git clone https://github.com/rimiti/node-lambda-functions.git
```

## How it works ?
For each folder:
- Each folders present in `./src` directory is a lambda function.
- Each functions must have a `package.json` file with his all dependencies included.
- Each functions must have a `index.js` as entry point.
- Each functions must have a `test.js` to simulate a launch.
- Each functions must have a `json` as event object. 

## Example

### usersCsvExport
Export SQL results in a csv file, send it by mail and saves file on S3.
The function triggers each event generated by Cloudwatch, which must be configured to send an event with the following json data:
```json
{
  "query": "SELECT * FROM db.users",
  "bucket": "users.export",
  "filename": "exportUtilisateur",
  "email": {
    "from": "Dim Solution <no-reply@dimsolution.com>",
    "to": "dimitri.dobairro@dimsolution.com",
    "cc": "contact@dimsolution.com",
    "subject": "Export utilisateur",
    "html": "<p>Hello,</p><p>Please find attached users export file. <br><br></p><small><i>This is an automatic email, please do not reply.</i></small>"
  }
}
```

## Upload your function
```js
gulp deploy --functionName usersCsvExport
```

## Tag
```js
gulp tag:patch   // Makes v0.1.0 → v0.1.1
gulp tag:feature // Makes v0.1.1 → v0.2.0
gulp tag:release // Makes v0.2.1 → v1.0.0
```

## Tests
```js
// Run tests
gulp mocha
```