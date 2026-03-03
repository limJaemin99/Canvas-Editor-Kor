import { version } from '../../../../package.json'
import { Draw } from '../draw/Draw'
import WordCountWorker from './works/wordCount?worker&inline'
import CatalogWorker from './works/catalog?worker&inline'
import GroupWorker from './works/group?worker&inline'
import ValueWorker from './works/value?worker&inline'
import { runWordCount } from './works/wordCount'
import { getCatalog } from './works/catalog'
import { getGroupIds } from './works/group'
import { runValue } from './works/value'
import { ICatalog } from '../../interface/Catalog'
import { IEditorResult } from '../../interface/Editor'
import { IGetValueOption } from '../../interface/Draw'
import { deepClone } from '../../utils'

// Worker를 안전하게 생성 후 동작 테스트. CSP 차단 시 null 반환
function createAndTestWorker(
  factory: new () => Worker,
  testMessage: unknown
): Promise<Worker | null> {
  return new Promise(resolve => {
    let worker: Worker
    try {
      worker = new factory()
    } catch {
      resolve(null)
      return
    }
    const timer = setTimeout(() => {
      worker.terminate()
      resolve(null)
    }, 800)
    worker.onmessage = () => {
      clearTimeout(timer)
      // 테스트 성공 → 리스너 초기화 후 반환
      worker.onmessage = null
      worker.onerror = null
      resolve(worker)
    }
    worker.onerror = () => {
      clearTimeout(timer)
      worker.terminate()
      resolve(null)
    }
    worker.postMessage(testMessage)
  })
}

export class WorkerManager {
  private draw: Draw
  private wordCountWorker: Worker | null = null
  private catalogWorker: Worker | null = null
  private groupWorker: Worker | null = null
  private valueWorker: Worker | null = null

  constructor(draw: Draw) {
    this.draw = draw
    this._initWorkers()
  }

  private _initWorkers() {
    createAndTestWorker(WordCountWorker, []).then(wc => {
      if (wc) {
        // Worker 사용 가능 → 나머지도 생성
        this.wordCountWorker = wc
        try { this.catalogWorker = new CatalogWorker() } catch { /* noop */ }
        try { this.groupWorker = new GroupWorker() } catch { /* noop */ }
        try { this.valueWorker = new ValueWorker() } catch { /* noop */ }
      }
      // wc가 null이면 모든 Worker를 메인 스레드 폴백으로 사용
    })
  }

  public getWordCount(): Promise<number> {
    const elementList = this.draw.getOriginalMainElementList()
    if (!this.wordCountWorker) {
      return Promise.resolve(runWordCount(elementList))
    }
    return new Promise(resolve => {
      this.wordCountWorker!.onmessage = evt => resolve(evt.data)
      this.wordCountWorker!.onerror = () => resolve(runWordCount(elementList))
      this.wordCountWorker!.postMessage(elementList)
    })
  }

  public getCatalog(): Promise<ICatalog | null> {
    const elementList = this.draw.getOriginalMainElementList()
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    if (!this.catalogWorker) {
      return Promise.resolve(getCatalog({ elementList, positionList }))
    }
    return new Promise(resolve => {
      this.catalogWorker!.onmessage = evt => resolve(evt.data)
      this.catalogWorker!.onerror = () => resolve(getCatalog({ elementList, positionList }))
      this.catalogWorker!.postMessage({ elementList, positionList })
    })
  }

  public getGroupIds(): Promise<string[]> {
    const elementList = this.draw.getOriginalMainElementList()
    if (!this.groupWorker) {
      return Promise.resolve(getGroupIds(elementList))
    }
    return new Promise(resolve => {
      this.groupWorker!.onmessage = evt => resolve(evt.data)
      this.groupWorker!.onerror = () => resolve(getGroupIds(elementList))
      this.groupWorker!.postMessage(elementList)
    })
  }

  public getValue(options?: IGetValueOption): Promise<IEditorResult> {
    const data = this.draw.getOriginValue(options)
    const opts = deepClone(this.draw.getOptions())
    if (!this.valueWorker) {
      return Promise.resolve({
        version,
        data: runValue({ data, options: options! }),
        options: opts
      })
    }
    return new Promise(resolve => {
      this.valueWorker!.onmessage = evt => resolve({ version, data: evt.data, options: opts })
      this.valueWorker!.onerror = () => resolve({
        version,
        data: runValue({ data, options: options! }),
        options: opts
      })
      this.valueWorker!.postMessage({ data, options })
    })
  }
}
