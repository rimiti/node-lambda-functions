import {usersCsvExport} from './'
const event_users = require('./event_test_users.json')

/**
 * @description Test lambda function
 */
usersCsvExport(event_users, {
  done: (err) => {
    console.log('done', err)
    if (err) {
      process.exit(1)
    } else {
      process.exit(0)
    }

  }
})
