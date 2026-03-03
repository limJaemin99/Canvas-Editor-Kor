import { ITitleOption, ITitleSizeOption } from '../../interface/Title'
import { TitleLevel } from '../enum/Title'

export const defaultTitleOption: Readonly<Required<ITitleOption>> = {
  defaultTitleSize: 26,     // 제목
  defaultPyeonSize: 24,     // 편
  defaultJangSize: 22,      // 장
  defaultBuchikSize: 22,    // 부칙
  defaultJeolSize: 20,      // 절
  defaultGwanSize: 18,      // 관
  defaultJoSize: 16,        // 조
  defaultByeoljiSize: 16,   // 별지/별표
  defaultHangSize: 16,      // 항
  defaultHoSize: 16,        // 호
  defaultMokSize: 16,       // 목
  defaultDanSize: 16        // 단
}

export const titleSizeMapping: Record<TitleLevel, keyof ITitleSizeOption> = {
  [TitleLevel.TITLE]: 'defaultTitleSize',
  [TitleLevel.PYEON]: 'defaultPyeonSize',
  [TitleLevel.JANG]: 'defaultJangSize',
  [TitleLevel.BUCHIK]: 'defaultBuchikSize',
  [TitleLevel.JEOL]: 'defaultJeolSize',
  [TitleLevel.GWAN]: 'defaultGwanSize',
  [TitleLevel.JO]: 'defaultJoSize',
  [TitleLevel.BYEOLJI]: 'defaultByeoljiSize'
}

export const titleOrderNumberMapping: Record<TitleLevel, number> = {
  [TitleLevel.TITLE]: 1,
  [TitleLevel.PYEON]: 2,
  [TitleLevel.JANG]: 3,
  [TitleLevel.BUCHIK]: 2,   // 부칙: 편과 동일한 2depth (제목 아래)
  [TitleLevel.JEOL]: 5,
  [TitleLevel.GWAN]: 6,
  [TitleLevel.JO]: 7,
  [TitleLevel.BYEOLJI]: 2,  // 별지/별표: 편과 동일한 2depth (제목 아래)
}

export const titleNodeNameMapping: Record<string, TitleLevel> = {
  H1: TitleLevel.TITLE,
  H2: TitleLevel.PYEON,
  H3: TitleLevel.JANG,
  H4: TitleLevel.JEOL,
  H5: TitleLevel.GWAN,
  H6: TitleLevel.JO
}
