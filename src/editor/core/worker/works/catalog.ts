import { ICatalog, ICatalogItem } from '../../../interface/Catalog'
import { IElement, IElementPosition } from '../../../interface/Element'

interface IGetCatalogPayload {
  elementList: IElement[]
  positionList: IElementPosition[]
}

type ICatalogElement = IElement & {
  pageNo: number
}

enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table',
  HYPERLINK = 'hyperlink',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
  SEPARATOR = 'separator',
  PAGE_BREAK = 'pageBreak',
  CONTROL = 'control',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  LATEX = 'latex',
  TAB = 'tab',
  DATE = 'date',
  BLOCK = 'block',
  TITLE = 'title',
  AREA = 'area',
  LIST = 'list',
  LABEL = 'label'
}

enum TitleLevel {
  TITLE = 'title',
  PYEON = 'pyeon',
  JANG = 'jang',
  BUCHIK = 'buchik',
  JEOL = 'jeol',
  GWAN = 'gwan',
  JO = 'jo',
  BYEOLJI = 'byeolji'
}

const titleOrderNumberMapping: Record<TitleLevel, number> = {
  [TitleLevel.TITLE]: 1,
  [TitleLevel.PYEON]: 2,
  [TitleLevel.JANG]: 3,
  [TitleLevel.BUCHIK]: 2,   // 부칙: 편과 동일한 2depth
  [TitleLevel.JEOL]: 5,
  [TitleLevel.GWAN]: 6,
  [TitleLevel.JO]: 7,
  [TitleLevel.BYEOLJI]: 2  // 별지/별표: 편과 동일한 2depth
}

const TEXTLIKE_ELEMENT_TYPE: ElementType[] = [
  ElementType.TEXT,
  ElementType.HYPERLINK,
  ElementType.SUBSCRIPT,
  ElementType.SUPERSCRIPT,
  ElementType.CONTROL,
  ElementType.DATE,
  ElementType.LABEL
]

const ZERO = '\u200B'

function isTextLikeElement(element: IElement): boolean {
  return !element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)
}

function getCatalog(payload: IGetCatalogPayload): ICatalog | null {
  const { elementList, positionList } = payload

  // 筛选标题
  const titleElementList: ICatalogElement[] = []
  let t = 0
  while (t < elementList.length) {
    const element = elementList[t]
    // positionList[t]가 없을 경우 안전하게 처리
    const pageNo = positionList[t]?.pageNo ?? 0

    const getElementInfo = (
      element: IElement,
      elementList: IElement[],
      position: number
    ) => {
      const titleId = element.titleId
      const level = element.level
      const titleElement: ICatalogElement = {
        type: ElementType.TITLE,
        value: '',
        level,
        titleId,
        pageNo
      }
      const valueList: IElement[] = []
      while (position < elementList.length) {
        const titleE = elementList[position]
        if (titleId !== titleE.titleId) {
          position--
          break
        }
        valueList.push(titleE)
        position++
      }
      titleElement.value = valueList
        .filter(el => isTextLikeElement(el))
        .map(el => el.value)
        .join('')
        .replace(new RegExp(ZERO, 'g'), '')
      return { position, titleElement }
    }

    // 케이스 1: flatten된 요소 (titleId가 있는 일반 텍스트 요소)
    if (element.titleId) {
      const { position, titleElement } = getElementInfo(element, elementList, t)
      t = position
      titleElementList.push(titleElement)
    }
    // 케이스 2: type=title 구조 (valueList를 가진 중첩 요소 - flatten 전 구조가 남아있는 경우)
    else if (element.type === ElementType.TITLE && element.level) {
      const level = element.level as TitleLevel
      // valueList에서 텍스트 추출
      const name = (element.valueList || [])
        .filter(el => isTextLikeElement(el))
        .map(el => el.value)
        .join('')
        .replace(new RegExp(ZERO, 'g'), '')
      const titleId = element.titleId || `catalog_${t}`
      titleElementList.push({
        type: ElementType.TITLE,
        value: name,
        level,
        titleId,
        pageNo
      } as ICatalogElement)
    }

    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      for (let r = 0; r < trList.length; r++) {
        const tr = trList[r]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          const value = td.value
          if (value.length > 1) {
            let index = 1
            while (index < value.length) {
              if (value[index]?.titleId) {
                const { titleElement, position } = getElementInfo(
                  value[index],
                  value,
                  index
                )
                titleElementList.push(titleElement)
                index = position
              }
              index++
            }
          }
        }
      }
    }
    t++
  }
  if (!titleElementList.length) return null
  // 查找到比最新元素大的标题时终止
  const recursiveInsert = (
    title: ICatalogElement,
    catalogItem: ICatalogItem
  ) => {
    const subCatalogItem =
      catalogItem.subCatalog[catalogItem.subCatalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[subCatalogItem?.level]
    const titleLevel = titleOrderNumberMapping[title.level!]
    if (subCatalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, subCatalogItem)
    } else {
      catalogItem.subCatalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        pageNo: title.pageNo,
        subCatalog: []
      })
    }
  }
  // 循环标题组
  // 如果当前列表级别小于标题组最新标题级别：则递归查找最小级别并追加
  // 如果大于：则直接追加至当前标题组
  const catalog: ICatalog = []
  for (let e = 0; e < titleElementList.length; e++) {
    const title = titleElementList[e]
    const catalogItem = catalog[catalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[catalogItem?.level]
    const titleLevel = titleOrderNumberMapping[title.level!]
    if (catalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, catalogItem)
    } else {
      catalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        pageNo: title.pageNo,
        subCatalog: []
      })
    }
  }
  return catalog
}

onmessage = evt => {
  const payload = <IGetCatalogPayload>evt.data
  const catalog = getCatalog(payload)
  postMessage(catalog)
}
