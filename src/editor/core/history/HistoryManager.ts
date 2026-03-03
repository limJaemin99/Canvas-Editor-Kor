import { Draw } from '../draw/Draw'

export class HistoryManager {
  private undoStack: Array<Function> = []
  private redoStack: Array<Function> = []
  private maxRecordCount: number
  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
    // 忽略第一次历史记录
    this.maxRecordCount = draw.getOptions().historyMaxRecordCount + 1
  }

  public undo() {
    if (this.undoStack.length > 1) {
      // undo 실행 전 현재 커서 range와 positionContext 저장
      const currentRange = this.draw.getRange().getRange()
      const currentEndIndex = currentRange.endIndex
      const currentPositionContext = this.draw.getPosition().getPositionContext()
      const isInTable = currentPositionContext.isTable

      const pop = this.undoStack.pop()!
      this.redoStack.push(pop)
      if (this.undoStack.length) {
        // 내용 복원 (내부에서 render + replaceRange(oldRange) 호출됨)
        this.undoStack[this.undoStack.length - 1]()

        if (isInTable) {
          // 표 내부였다면: 복원 후 positionContext를 현재 표 컨텍스트로 재설정하고 range 복원
          this.draw.getPosition().setPositionContext({ ...currentPositionContext })
          this.draw.getRange().replaceRange({ ...currentRange })
          // 표 내부 setCursor
          this.draw.setCursor(currentEndIndex)
        } else {
          // 일반 본문: range를 undo 전 위치로 교체 후 커서 재배치
          this.draw.getRange().replaceRange({ ...currentRange })
          this.draw.setCursor(currentEndIndex)
        }
      }
    }
  }

  public redo() {
    if (this.redoStack.length) {
      const pop = this.redoStack.pop()!
      this.undoStack.push(pop)
      pop()
    }
  }

  public execute(fn: Function) {
    this.undoStack.push(fn)
    if (this.redoStack.length) {
      this.redoStack = []
    }
    while (this.undoStack.length > this.maxRecordCount) {
      this.undoStack.shift()
    }
  }

  public isCanUndo(): boolean {
    return this.undoStack.length > 1
  }

  public isCanRedo(): boolean {
    return !!this.redoStack.length
  }

  public isStackEmpty(): boolean {
    return !this.undoStack.length && !this.redoStack.length
  }

  public recovery() {
    this.undoStack = []
    this.redoStack = []
  }

  public popUndo() {
    return this.undoStack.pop()
  }
}
