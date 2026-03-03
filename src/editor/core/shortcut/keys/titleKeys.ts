import { Command, TitleLevel } from '../../..'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { IRegisterShortcut } from '../../../interface/shortcut/Shortcut'

export const titleKeys: IRegisterShortcut[] = [
  {
    key: KeyMap.ZERO,
    alt: true,
    ctrl: true,
    callback: (command: Command) => {
      command.executeTitle(null)
    }
  },
  {
    key: KeyMap.ONE,
    alt: true,
    ctrl: true,
    callback: (command: Command) => {
      command.executeTitle(TitleLevel.TITLE)
    }
  }
]
