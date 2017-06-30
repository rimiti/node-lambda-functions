import AWS from 'aws-sdk'
import gulp from 'gulp'
import zip from 'gulp-zip'
import install from 'gulp-install'
import fs from 'fs'
import util from 'gulp-util'
import del from 'del'

AWS.config.region = 'eu-central-1'
let lambda = new AWS.Lambda()
const IAMRole = 'arn:aws:iam::000000000000:role/lambda-role'

gulp.task('js', ['babel'], () => {
  return gulp.src(['./**/*'], {base: './src'})
    .pipe(gulp.dest('dist/'))
})

/**
 * @description Reads zip file into buffer
 * @return {Promise}
 */
const getZipFile = () => {
  return new Promise((resolve, reject) => {
      fs.readFile(`./deploy/${util.env.functionName}.zip`, (err, data) => (err) ? reject(err) : resolve(data))
    }
  )
}

/**
 * @description Upload Function Zip file to Lambda
 * @return {Promise.<TResult>}
 */
const createFunction = () => {
  return getZipFile().then(
    (data) => {
      const params = {
        Code: { ZipFile: data },
        FunctionName: util.env.functionName,
        Handler: `index.${util.env.functionName}`,
        Role: IAMRole,
        Runtime: 'nodejs4.3'
      }
      return lambda.createFunction(params).promise()
    }
  )

}

/**
 * @description Updates an existing Lambda function by uploading the Zip File
 * @return {Promise.<TResult>}
 */
const updateFunction = () => {
  return getZipFile().then(
    (data) => {
      const params = {
        FunctionName: util.env.functionName,
        ZipFile: data
      }
      return lambda.updateFunctionCode(params).promise()
    }
  )
}

gulp.task('certificates', [], () => {
  return gulp.src([`./src/${util.env.functionName}/**/*.json`])
    .pipe(gulp.dest(`dist/${util.env.functionName}`))
})

gulp.task('clean-dist', () => {
  return del([`./dist/${util.env.functionName}/**/*`, `!./dist/${util.env.functionName}/node_modules/**/*`])
})

gulp.task('node-modules', ['clean-dist'], () => {
  return gulp.src(`./src/${util.env.functionName}/package.json`)
    .pipe(gulp.dest(`dist/${util.env.functionName}`))
    .pipe(install({production: true}))
})

gulp.task('zip', ['node-modules', 'certificates', 'babel'], () => {
  return gulp.src([`dist/${util.env.functionName}/**/*`])
    .pipe(zip(`${util.env.functionName}.zip`))
    .pipe(gulp.dest('./deploy'))
})

gulp.task('upload', ['zip'], () => {
  return lambda.getFunction({FunctionName: util.env.functionName}).promise().then(
    data => {
      console.log('Function already exist -> updating it')
      return updateFunction()
    },
    err => {
      console.log('Function does not exist -> creating it')
      return createFunction()
    }
  )
})

gulp.task('test-invoke', ['upload'], () => {
  let lambda = new AWS.Lambda()

  const params = {
    FunctionName: util.env.functionName,
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{"data": "AslaAqpVWgAAAAEB", \
                "clientId": "wan0x", \
                "topic": "uplink" \
        }'
  }

  return lambda.getFunction({FunctionName: util.env.functionName}).promise().then(
    (data) => {
      return lambda.invoke(params).promise()
    },
    (err) => {
      console.error(`Function ${util.env.functionName} not found "${err}"`)
      return Promise.reject(err)
    }
  ).then(
    (data) => {
      console.log(data)
    }
  )
})

gulp.task('deploy', ['test-invoke'])
