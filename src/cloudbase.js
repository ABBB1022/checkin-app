import cloudbase from '@cloudbase/js-sdk'

const app = cloudbase.init({
  env: 'zzb-apps-3gxzi3br68a2bc66'
})

export const db = app.database()

export const COLLECTIONS = {
  ITEMS: 'checkin_items',
  RECORDS: 'checkin_records'
}
