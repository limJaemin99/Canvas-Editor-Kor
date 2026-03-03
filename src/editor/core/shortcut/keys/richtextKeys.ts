import { Command, RowFlex } from '../../..'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { IRegisterShortcut } from '../../../interface/shortcut/Shortcut'
import { isApple } from '../../../utils/ua'

export const richtextKeys: IRegisterShortcut[] = [
  {
    key: KeyMap.X,
    ctrl: true,
    shift: true,
    callback: (command: Command) => {
      command.executeStrikeout()
    }
  },
  {
    key: KeyMap.LEFT_BRACKET,
    mod: true,
    callback: (command: Command) => {
      command.executeSizeAdd()
    }
  },
  {
    key: KeyMap.RIGHT_BRACKET,
    mod: true,
    callback: (command: Command) => {
      command.executeSizeMinus()
    }
  },
  {
    key: KeyMap.B,
    mod: true,
    callback: (command: Command) => {
      command.executeBold()
    }
  },
  {
    key: KeyMap.I,
    mod: true,
    callback: (command: Command) => {
      command.executeItalic()
    }
  },
  {
    key: KeyMap.U,
    mod: true,
    callback: (command: Command) => {
      command.executeUnderline()
    }
  },
  {
    key: isApple ? KeyMap.COMMA : KeyMap.RIGHT_ANGLE_BRACKET,
    mod: true,
    shift: true,
    callback: (command: Command) => {
      command.executeSuperscript()
    }
  },
  {
    key: isApple ? KeyMap.PERIOD : KeyMap.LEFT_ANGLE_BRACKET,
    mod: true,
    shift: true,
    callback: (command: Command) => {
      command.executeSubscript()
    }
  },
  {
    key: KeyMap.L,
    mod: true,
    callback: (command: Command) => {
      command.executeRowFlex(RowFlex.LEFT)
    }
  },
  {
    key: KeyMap.E,
    mod: true,
    callback: (command: Command) => {
      command.executeRowFlex(RowFlex.CENTER)
    }
  },
  {
    key: KeyMap.R,
    mod: true,
    callback: (command: Command) => {
      command.executeRowFlex(RowFlex.RIGHT)
    }
  },
  {
    key: KeyMap.J,
    mod: true,
    callback: (command: Command) => {
      command.executeRowFlex(RowFlex.ALIGNMENT)
    }
  },
  {
    key: KeyMap.J,
    mod: true,
    shift: true,
    callback: (command: Command) => {
      command.executeRowFlex(RowFlex.JUSTIFY)
    }
  },
  {
    key: KeyMap.HOME,
    ctrl: true,
    callback: (command: Command) => {
      // 문서 최상단으로 이동
      const range = Reflect.get(command, 'range')
      if (range) {
        range.setRange(0, 0)
      }
    }
  },
  {
    key: KeyMap.END,
    ctrl: true,
    callback: (command: Command) => {
      // 문서 최하단으로 이동
      const draw = Reflect.get(command, 'draw')
      const range = Reflect.get(command, 'range')
      if (draw && range) {
        const elementList = draw.getElementList()
        const lastIndex = elementList.length - 1
        range.setRange(lastIndex, lastIndex)
      }
    }
  }
]
