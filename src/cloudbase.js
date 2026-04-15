import cloudbase from '@cloudbase/js-sdk'

const app = cloudbase.init({
  env: 'zzb-apps-3gxzi3br68a2bc66'
})

// 添加匿名登录
export const auth = app.auth()
export const db = app.database()

export const COLLECTIONS = {
  ITEMS: 'checkin_items',
  RECORDS: 'checkin_records'
}

// 导出登录方法
export async function signInAnonymously() {
  await auth.signInAnonymously()
}
