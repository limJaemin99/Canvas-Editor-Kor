import { EditorMode, EditorZone } from '../../../../dataset/enum/Editor'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { isMod } from '../../../../utils/hotkey'
import { CanvasEvent } from '../../CanvasEvent'
import { backspace } from './backspace'
import { del } from './delete'
import { enter } from './enter'
import { left } from './left'
import { right } from './right'
import { tab } from './tab'
import { updown } from './updown'

export function keydown(evt: KeyboardEvent, host: CanvasEvent) {
  if (host.isComposing) return
  const draw = host.getDraw()
  // 键盘事件逻辑分发
  if (evt.key === KeyMap.Backspace) {
    backspace(evt, host)
  } else if (evt.key === KeyMap.Delete) {
    del(evt, host)
  } else if (evt.key === KeyMap.Enter) {
    enter(evt, host)
  } else if (evt.key === KeyMap.Left) {
    left(evt, host)
  } else if (evt.key === KeyMap.Right) {
    right(evt, host)
  } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
    updown(evt, host)
  } else if (isMod(evt) && evt.key === KeyMap.HOME) {
    // Ctrl+Home: 문서 최상단으로 이동
    const zoneManager = draw.getZone()
    if (zoneManager.isMainActive()) {
      const positionList = draw.getPosition().getPositionList()
      const rangeManager = draw.getRange()
      rangeManager.setRange(0, 0)
      draw.getPosition().setCursorPosition(positionList[0] || null)
      draw.getCursor().drawCursor({ isShow: true })
      // 스크롤 최상단으로
      const pageContainer = draw.getPageContainer()
      pageContainer.scrollTop = 0
    }
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.END) {
    // Ctrl+End: 문서 최하단으로 이동
    const zoneManager = draw.getZone()
    if (zoneManager.isMainActive()) {
      const positionList = draw.getPosition().getPositionList()
      const lastIdx = positionList.length - 1
      const rangeManager = draw.getRange()
      rangeManager.setRange(lastIdx, lastIdx)
      draw.getPosition().setCursorPosition(positionList[lastIdx] || null)
      draw.getCursor().drawCursor({ isShow: true })
      // 스크롤 최하단으로
      const pageContainer = draw.getPageContainer()
      pageContainer.scrollTop = pageContainer.scrollHeight
    }
    evt.preventDefault()
  } else if (isMod(evt) && evt.key.toLocaleLowerCase() === KeyMap.Z) {
    if (draw.isReadonly() && draw.getMode() !== EditorMode.FORM) return
    draw.getHistoryManager().undo()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key.toLocaleLowerCase() === KeyMap.Y) {
    if (draw.isReadonly() && draw.getMode() !== EditorMode.FORM) return
    draw.getHistoryManager().redo()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key.toLocaleLowerCase() === KeyMap.C) {
    host.copy()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key.toLocaleLowerCase() === KeyMap.X) {
    host.cut()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key.toLocaleLowerCase() === KeyMap.A) {
    host.selectAll()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key.toLocaleLowerCase() === KeyMap.S) {
    if (draw.isReadonly()) return
    const listener = draw.getListener()
    if (listener.saved) {
      listener.saved(draw.getValue())
    }
    const eventBus = draw.getEventBus()
    if (eventBus.isSubscribe('saved')) {
      eventBus.emit('saved', draw.getValue())
    }
    evt.preventDefault()
  } else if (evt.key === KeyMap.ESC) {
    // 退出格式刷
    host.clearPainterStyle()
    // 退出页眉页脚编辑
    const zoneManager = draw.getZone()
    if (!zoneManager.isMainActive()) {
      zoneManager.setZone(EditorZone.MAIN)
    }
    evt.preventDefault()
  } else if (evt.key === KeyMap.TAB) {
    tab(evt, host)
  }
}
