import { Platform } from 'react-native'
import { Database } from './db.interface'
import { db as webDB } from './db.web'
import { db as nativeDB } from './db.native'

export const db: Database = Platform.OS === 'web' ? webDB : nativeDB