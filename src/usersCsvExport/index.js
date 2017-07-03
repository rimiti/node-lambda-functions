import aws from 'aws-sdk'
import _ from 'lodash'
import moment from 'moment'
import mysql from 'promise-mysql'
import json2csv from 'json2csv'
import nodemailer from 'nodemailer'
aws.config.loadFromPath('./aws_credentials.json')

const transport = nodemailer.createTransport({
  transport: 'ses',
  accessKeyId: '',
  secretAccessKey: '',
  region: 'eu-west-1'
})

const databaseConfig = {host: '', user: '', password: '', database: ''}

aws.config.region = 'eu-central-1'

let dbQuery
let filename
let bucket
let email

/**
 * @description Query Database and return backs results
 * @param connection
 */
const queryDatabase = (connection) => {
  console.log(`Connection with database established`)
  return connection.query(dbQuery)
}

/**
 * @description Parse sql query result array json into csv file
 * @param rows
 * @return {*}
 */
const parseDatabaseResultToCsv = (rows) => {
  console.log(`Query success. Got ${rows.length} rows`)
  if (!rows.length)
    return Promise.reject(`Query returned 0 Rows`)
  let fields = _.keys(rows[0])
  return new Promise(
    (resolve, reject) => {
      json2csv({data: rows, fields: fields, quotes: '', del: ''}, (err, csv) => {
        if (err) {
          reject(err)
        } else {
          resolve(csv)
        }
      })
    }
  )
}

/**
 * @description Sends Email containing CSV file
 * @param csv
 * @return {Promise}
 */
const sendCSVbyMail = (csv) => {
  console.log(`Sending CSV by mail`)
  let emailConfig = {
    from: email.from,
    to: email.to,
    cc: email.cc,
    subject: `${email.subject} - ${moment().utc().format("DD-MM-YYYY")}`,
    html: email.html,
    attachments: [{
      filename: `${filename}_${moment().utc().format("YYYYMMDD_HHmmss")}.csv`,
      content: csv,
      contentType: 'text/csv'
    }]
  }

  return new Promise((resolve, reject) => transport.sendMail(emailConfig, (error, info) => {
    if (error) {
      console.log(`Error sending email: ${error}`)
      return reject()
    }
    console.log(`Email sent with success to ${info}`)
    return resolve()
  }))
}

/**
 * @description Uploads CSV file to S3 bucket
 * @param csv
 * @return {Promise.<TResult>}
 */
const uploadToS3 = (csv) => {
  console.log(`Uploading CSV to S3`)
  let s3bucket = new aws.S3()
  let params = {
    Bucket: bucket,
    Key: `${filename}_${moment().utc().format("YYYYMMDD_HHmmss")}.csv`,
    Body: csv,
    ContentType: "text/csv"
  }

  return s3bucket.putObject(params).promise()
    .then(() => {
      console.log(`uploaded to S3`)
      return Promise.resolve()
    })
    .catch((e) => {
      console.log(`error uploading to S3 : ${e}`)
      return Promise.reject(e)
    })
}

/**
 * @description Main Lambda handler
 * @param event
 * @param context
 */
let handler = (event, context) => {
  console.time(`handler`)
  console.log(`Received event: ${JSON.stringify(event, null, 2)}`)
  dbQuery = event.dbQuery
  bucket = event.bucket
  email = event.email
  filename = event.filename

  if (!dbQuery) return context.done(new Error(`Query not provided`))
  if (!bucket) return context.done(new Error(`S3 bucket not provided`))
  if (!email) return context.done(new Error(`Email object not defined`))

  mysql.createConnection(databaseConfig)
    .then(queryDatabase)
    .then(parseDatabaseResultToCsv)
    .then(csv => Promise.all([sendCSVbyMail(csv), uploadToS3(csv)]))
    .then(() => {
      console.log(`Extraction completed`)
      console.timeEnd(`handler`)
      context.done()
    })
    .catch((error) => {
      console.timeEnd(`handler`)
      context.done(error)
    })
}

export {handler as usersCsvExport}

