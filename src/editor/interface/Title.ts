import { EditorZone } from '../dataset/enum/Editor'
import { IElement } from './Element'

export interface ITitleSizeOption {
  defaultTitleSize?: number    // 제목
  defaultPyeonSize?: number    // 편
  defaultJangSize?: number     // 장
  defaultBuchikSize?: number   // 부칙
  defaultJeolSize?: number     // 절
  defaultGwanSize?: number     // 관
  defaultJoSize?: number       // 조
  defaultByeoljiSize?: number  // 별지/별표
  defaultHangSize?: number     // 항
  defaultHoSize?: number       // 호
  defaultMokSize?: number      // 목
  defaultDanSize?: number      // 단
}

export type ITitleOption = ITitleSizeOption & {}

export interface ITitleRule {
  deletable?: boolean
  disabled?: boolean
}

export type ITitle = ITitleRule & {
  conceptId?: string
}

export interface IGetTitleValueOption {
  conceptId: string
}

export type IGetTitleValueResult = (ITitle & {
  value: string | null
  elementList: IElement[]
  zone: EditorZone
})[]
