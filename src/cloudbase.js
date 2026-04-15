import cloudbase from '@cloudbase/js-sdk'

const app = cloudbase.init({
  env: 'zzb-apps-3gxzi3br68a2bc66'
})

// 认证模块
export const auth = app.auth()

// 数据库
export const db = app.database()

export const COLLECTIONS = {
  ITEMS: 'checkin_items',
  RECORDS: 'checkin_records'
}

// 匿名登录
export async function signInAnonymously() {
  await auth.signInAnonymously()
}
