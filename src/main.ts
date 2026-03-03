import { commentList, data, options } from './mock'
import './style.css'
import prism from 'prismjs'
import Editor, {
  BlockType,
  Command,
  ControlState,
  ControlType,
  EditorMode,
  EditorZone,
  ElementType,
  IBlock,
  ICatalogItem,
  IElement,
  KeyMap,
  ListStyle,
  ListType,
  PageMode,
  PaperDirection,
  RowFlex,
  TextDecorationStyle,
  TitleLevel,
  splitText
} from './editor'
import { Dialog } from './components/dialog/Dialog'
import { formatPrismToken } from './utils/prism'
import { Signature } from './components/signature/Signature'
import { debounce, nextTick, scrollIntoView } from './utils'

window.onload = function () {
  const isApple =
    typeof navigator !== 'undefined' && /Mac OS X/.test(navigator.userAgent)

  // 예시 데이터 저장
  const exampleData = {
    header: [
      {
        value: '제1인민병원',
        size: 32,
        rowFlex: RowFlex.CENTER
      },
      {
        value: '\n외래 진료 기록',
        size: 18,
        rowFlex: RowFlex.CENTER
      },
      {
        value: '\n',
        type: ElementType.SEPARATOR
      }
    ],
    main: <IElement[]>data,
    footer: [
      {
        value: 'canvas-editor',
        size: 12
      }
    ]
  }

  // 1. 편집기 초기화 - 빈 문서로 시작
  const container = document.querySelector<HTMLDivElement>('.editor')!
  const instance = new Editor(
    container,
    {
      header: [],
      main: [
        {
          value: '\n'
        }
      ],
      footer: []
    },
    options
  )
  console.log('인스턴스: ', instance)
  // cypress 사용
  Reflect.set(window, 'editor', instance)

  // 메뉴 팝업 제거
  window.addEventListener(
    'click',
    evt => {
      const visibleDom = document.querySelector('.visible')
      if (!visibleDom || visibleDom.contains(<Node>evt.target)) return
      visibleDom.classList.remove('visible')
    },
    {
      capture: true
    }
  )

  // 2. | 실행취소 | 재실행 | 서식 복사 | 서식 지우기 |
  const undoDom = document.querySelector<HTMLDivElement>('.menu-item__undo')!
  undoDom.title = `실행취소(${isApple ? '⌘' : 'Ctrl'}+Z)`
  undoDom.onclick = function () {
    console.log('undo')
    instance.command.executeUndo()
  }

  const redoDom = document.querySelector<HTMLDivElement>('.menu-item__redo')!
  redoDom.title = `재실행(${isApple ? '⌘' : 'Ctrl'}+Y)`
  redoDom.onclick = function () {
    console.log('redo')
    instance.command.executeRedo()
  }

  const painterDom = document.querySelector<HTMLDivElement>(
    '.menu-item__painter'
  )!

  let isFirstClick = true
  let painterTimeout: number
  painterDom.onclick = function () {
    if (isFirstClick) {
      isFirstClick = false
      painterTimeout = window.setTimeout(() => {
        console.log('painter-click')
        isFirstClick = true
        instance.command.executePainter({
          isDblclick: false
        })
      }, 200)
    } else {
      window.clearTimeout(painterTimeout)
    }
  }

  painterDom.ondblclick = function () {
    console.log('painter-dblclick')
    isFirstClick = true
    window.clearTimeout(painterTimeout)
    instance.command.executePainter({
      isDblclick: true
    })
  }

  document.querySelector<HTMLDivElement>('.menu-item__format')!.onclick =
    function () {
      console.log('format')
      instance.command.executeFormat()
    }

  // 3. | 글꼴 | 글꼴 크게 | 글꼴 작게 | 굵게 | 기울임 | 밑줄 | 취소선 | 위첨자 | 아래첨자 | 글꼴 색 | 강조 색 |
  const fontDom = document.querySelector<HTMLDivElement>('.menu-item__font')!
  const fontSelectDom = fontDom.querySelector<HTMLDivElement>('.select')!
  const fontOptionDom = fontDom.querySelector<HTMLDivElement>('.options')!
  fontDom.onclick = function () {
    console.log('font')
    fontOptionDom.classList.toggle('visible')
  }
  fontOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executeFont(li.dataset.family!)
  }

  const sizeSetDom = document.querySelector<HTMLDivElement>('.menu-item__size')!
  const sizeSelectDom = sizeSetDom.querySelector<HTMLDivElement>('.select')!
  const sizeOptionDom = sizeSetDom.querySelector<HTMLDivElement>('.options')!
  sizeSetDom.title = `글꼴 크기 설정`
  sizeSetDom.onclick = function () {
    console.log('size')
    sizeOptionDom.classList.toggle('visible')
  }
  sizeOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executeSize(Number(li.dataset.size!))
  }

  const sizeAddDom = document.querySelector<HTMLDivElement>(
    '.menu-item__size-add'
  )!
  sizeAddDom.title = `글꼴 크게(${isApple ? '⌘' : 'Ctrl'}+[)`
  sizeAddDom.onclick = function () {
    console.log('size-add')
    instance.command.executeSizeAdd()
  }

  const sizeMinusDom = document.querySelector<HTMLDivElement>(
    '.menu-item__size-minus'
  )!
  sizeMinusDom.title = `글꼴 작게(${isApple ? '⌘' : 'Ctrl'}+])`
  sizeMinusDom.onclick = function () {
    console.log('size-minus')
    instance.command.executeSizeMinus()
  }

  const boldDom = document.querySelector<HTMLDivElement>('.menu-item__bold')!
  boldDom.title = `굵게(${isApple ? '⌘' : 'Ctrl'}+B)`
  boldDom.onclick = function () {
    console.log('bold')
    instance.command.executeBold()
  }

  const italicDom =
    document.querySelector<HTMLDivElement>('.menu-item__italic')!
  italicDom.title = `기울임(${isApple ? '⌘' : 'Ctrl'}+I)`
  italicDom.onclick = function () {
    console.log('italic')
    instance.command.executeItalic()
  }

  const underlineDom = document.querySelector<HTMLDivElement>(
    '.menu-item__underline'
  )!
  underlineDom.title = `밑줄(${isApple ? '⌘' : 'Ctrl'}+U)`
  const underlineOptionDom =
    underlineDom.querySelector<HTMLDivElement>('.options')!
  underlineDom.querySelector<HTMLSpanElement>('.select')!.onclick =
    function () {
      underlineOptionDom.classList.toggle('visible')
    }
  underlineDom.querySelector<HTMLElement>('i')!.onclick = function () {
    console.log('underline')
    instance.command.executeUnderline()
    underlineOptionDom.classList.remove('visible')
  }
  underlineDom.querySelector<HTMLUListElement>('ul')!.onmousedown = function (
    evt
  ) {
    const li = evt.target as HTMLLIElement
    const decorationStyle = <TextDecorationStyle>li.dataset.decorationStyle
    instance.command.executeUnderline({
      style: decorationStyle
    })
    underlineOptionDom.classList.remove('visible')
  }

  const strikeoutDom = document.querySelector<HTMLDivElement>(
    '.menu-item__strikeout'
  )!
  strikeoutDom.onclick = function () {
    console.log('strikeout')
    instance.command.executeStrikeout()
  }

  const superscriptDom = document.querySelector<HTMLDivElement>(
    '.menu-item__superscript'
  )!
  superscriptDom.title = `위첨자(${isApple ? '⌘' : 'Ctrl'}+Shift+,)`
  superscriptDom.onclick = function () {
    console.log('superscript')
    instance.command.executeSuperscript()
  }

  const subscriptDom = document.querySelector<HTMLDivElement>(
    '.menu-item__subscript'
  )!
  subscriptDom.title = `아래첨자(${isApple ? '⌘' : 'Ctrl'}+Shift+.)`
  subscriptDom.onclick = function () {
    console.log('subscript')
    instance.command.executeSubscript()
  }

  // ─── 색상 팔레트 공통 유틸 ───────────────────────────────────────
  const MAX_RECENT = 8
  const recentColors: { color: string[]; highlight: string[] } = { color: [], highlight: [] }

  function addRecentColor(type: 'color' | 'highlight', hex: string) {
    if (!hex || hex === 'transparent') return
    const list = recentColors[type]
    const idx = list.indexOf(hex.toUpperCase())
    if (idx !== -1) list.splice(idx, 1)
    list.unshift(hex.toUpperCase())
    if (list.length > MAX_RECENT) list.pop()
    renderRecentColors(type)
  }

  function renderRecentColors(type: 'color' | 'highlight') {
    const container = document.getElementById(`${type}-recent-items`)!
    container.innerHTML = ''
    const list = recentColors[type]
    if (!list.length) {
      (container.closest('.color-palette__recent') as HTMLElement).style.display = 'none'
      return
    }
    (container.closest('.color-palette__recent') as HTMLElement).style.display = 'block'
    list.forEach(hex => {
      const el = document.createElement('div')
      el.className = 'color-item'
      el.style.background = hex
      if (hex === '#FFFFFF') el.style.border = '1px solid #ddd'
      el.addEventListener('click', evt => {
        evt.stopPropagation()
        if (type === 'color') {
          instance.command.executeColor(hex)
          colorSpanDom.style.backgroundColor = hex
          colorPaletteDom.classList.remove('visible')
        } else {
          instance.command.executeHighlight(hex)
          highlightSpanDom.style.backgroundColor = hex
          highlightPaletteDom.classList.remove('visible')
        }
      })
      container.appendChild(el)
    })
  }

  // ─── 글꼴 색 팔레트 ──────────────────────────────────────────────
  const colorDom = document.querySelector<HTMLDivElement>('.menu-item__color')!
  const colorSpanDom = colorDom.querySelector('span')!
  const colorPaletteDom = colorDom.querySelector<HTMLDivElement>('.color-palette')!
  const colorRgbToggle = document.getElementById('color-rgb-toggle') as HTMLButtonElement
  const colorRgbPanel = document.getElementById('color-rgb-panel') as HTMLDivElement
  const colorRgbInput = document.getElementById('color-rgb-input') as HTMLInputElement
  const colorRgbPreview = document.getElementById('color-rgb-preview') as HTMLDivElement
  const colorRgbApply = document.getElementById('color-rgb-apply') as HTMLButtonElement

  // 최근 사용 색상 초기 숨김
  ;(document.getElementById('color-recent') as HTMLElement).style.display = 'none'

  colorDom.onclick = function (evt) {
    evt.stopPropagation()
    colorPaletteDom.classList.toggle('visible')
    highlightPaletteDom.classList.remove('visible')
    // RGB 패널 초기화
    colorRgbPanel.style.display = 'none'
    colorRgbToggle.textContent = '▼ 직접 입력 (RGB)'
  }

  // RGB 토글
  colorRgbToggle.addEventListener('click', evt => {
    evt.stopPropagation()
    const open = colorRgbPanel.style.display === 'none'
    colorRgbPanel.style.display = open ? 'flex' : 'none'
    colorRgbToggle.textContent = open ? '▲ 직접 입력 (RGB)' : '▼ 직접 입력 (RGB)'
  })

  // RGB input 변경 시 미리보기만 업데이트 (적용 안 함)
  colorRgbInput.addEventListener('input', evt => {
    evt.stopPropagation()
    colorRgbPreview.style.background = colorRgbInput.value
  })
  colorRgbInput.addEventListener('click', evt => evt.stopPropagation())

  // 적용 버튼 클릭 시만 실제 적용
  colorRgbApply.addEventListener('click', evt => {
    evt.stopPropagation()
    const hex = colorRgbInput.value
    instance.command.executeColor(hex)
    colorSpanDom.style.backgroundColor = hex
    addRecentColor('color', hex)
    colorPaletteDom.classList.remove('visible')
    colorRgbPanel.style.display = 'none'
    colorRgbToggle.textContent = '▼ 직접 입력 (RGB)'
  })

  // 팔레트 색상 클릭
  colorPaletteDom.querySelectorAll('.color-palette__row .color-item').forEach(item => {
    item.addEventListener('click', (evt) => {
      evt.stopPropagation()
      const color = (item as HTMLElement).dataset.color!
      instance.command.executeColor(color)
      colorSpanDom.style.backgroundColor = color
      addRecentColor('color', color)
      colorPaletteDom.classList.remove('visible')
    })
  })

  // ─── 강조 색 팔레트 ──────────────────────────────────────────────
  const highlightDom = document.querySelector<HTMLDivElement>('.menu-item__highlight')!
  const highlightSpanDom = highlightDom.querySelector('span')!
  const highlightPaletteDom = highlightDom.querySelector<HTMLDivElement>('.color-palette')!
  const highlightRgbToggle = document.getElementById('highlight-rgb-toggle') as HTMLButtonElement
  const highlightRgbPanel = document.getElementById('highlight-rgb-panel') as HTMLDivElement
  const highlightRgbInput = document.getElementById('highlight-rgb-input') as HTMLInputElement
  const highlightRgbPreview = document.getElementById('highlight-rgb-preview') as HTMLDivElement
  const highlightRgbApply = document.getElementById('highlight-rgb-apply') as HTMLButtonElement

  ;(document.getElementById('highlight-recent') as HTMLElement).style.display = 'none'

  highlightDom.onclick = function (evt) {
    evt.stopPropagation()
    highlightPaletteDom.classList.toggle('visible')
    colorPaletteDom.classList.remove('visible')
    highlightRgbPanel.style.display = 'none'
    highlightRgbToggle.textContent = '▼ 직접 입력 (RGB)'
  }

  highlightRgbToggle.addEventListener('click', evt => {
    evt.stopPropagation()
    const open = highlightRgbPanel.style.display === 'none'
    highlightRgbPanel.style.display = open ? 'flex' : 'none'
    highlightRgbToggle.textContent = open ? '▲ 직접 입력 (RGB)' : '▼ 직접 입력 (RGB)'
  })

  highlightRgbInput.addEventListener('input', evt => {
    evt.stopPropagation()
    highlightRgbPreview.style.background = highlightRgbInput.value
  })
  highlightRgbInput.addEventListener('click', evt => evt.stopPropagation())

  highlightRgbApply.addEventListener('click', evt => {
    evt.stopPropagation()
    const hex = highlightRgbInput.value
    instance.command.executeHighlight(hex)
    highlightSpanDom.style.backgroundColor = hex
    addRecentColor('highlight', hex)
    highlightPaletteDom.classList.remove('visible')
    highlightRgbPanel.style.display = 'none'
    highlightRgbToggle.textContent = '▼ 직접 입력 (RGB)'
  })

  highlightPaletteDom.querySelectorAll('.color-palette__row .color-item').forEach(item => {
    item.addEventListener('click', (evt) => {
      evt.stopPropagation()
      const color = (item as HTMLElement).dataset.color!
      if (color === 'transparent') {
        instance.command.executeHighlight(null)
        highlightSpanDom.style.backgroundColor = '#ffff00'
      } else {
        instance.command.executeHighlight(color)
        highlightSpanDom.style.backgroundColor = color
        addRecentColor('highlight', color)
      }
      highlightPaletteDom.classList.remove('visible')
    })
  })

  // 팔레트 외부 클릭 시 닫기
  document.addEventListener('click', () => {
    colorPaletteDom.classList.remove('visible')
    highlightPaletteDom.classList.remove('visible')
  })

  const titleDom = document.querySelector<HTMLDivElement>('.menu-item__title')!
  const titleSelectDom = titleDom.querySelector<HTMLDivElement>('.select')!
  const titleOptionDom = titleDom.querySelector<HTMLDivElement>('.options')!
  // 제목 옵션에서는 단축키 툴팁을 설정하지 않음

  titleDom.onclick = function () {
    console.log('title')
    titleOptionDom.classList.toggle('visible')
  }
  titleOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    const level = <TitleLevel>li.dataset.level
    instance.command.executeTitle(level || null)
  }

  const leftDom = document.querySelector<HTMLDivElement>('.menu-item__left')!
  leftDom.title = `왼쪽 정렬(${isApple ? '⌘' : 'Ctrl'}+L)`
  leftDom.onclick = function () {
    console.log('left')
    instance.command.executeRowFlex(RowFlex.LEFT)
  }

  const centerDom =
    document.querySelector<HTMLDivElement>('.menu-item__center')!
  centerDom.title = `가운데 정렬(${isApple ? '⌘' : 'Ctrl'}+E)`
  centerDom.onclick = function () {
    console.log('center')
    instance.command.executeRowFlex(RowFlex.CENTER)
  }

  const rightDom = document.querySelector<HTMLDivElement>('.menu-item__right')!
  rightDom.title = `오른쪽 정렬(${isApple ? '⌘' : 'Ctrl'}+R)`
  rightDom.onclick = function () {
    console.log('right')
    instance.command.executeRowFlex(RowFlex.RIGHT)
  }

  const alignmentDom = document.querySelector<HTMLDivElement>(
    '.menu-item__alignment'
  )!
  alignmentDom.title = `양쪽 정렬(${isApple ? '⌘' : 'Ctrl'}+J)`
  alignmentDom.onclick = function () {
    console.log('alignment')
    instance.command.executeRowFlex(RowFlex.ALIGNMENT)
  }

  const justifyDom = document.querySelector<HTMLDivElement>(
    '.menu-item__justify'
  )!
  justifyDom.title = `균등 분할(${isApple ? '⌘' : 'Ctrl'}+Shift+J)`
  justifyDom.onclick = function () {
    console.log('justify')
    instance.command.executeRowFlex(RowFlex.JUSTIFY)
  }

  // 들여쓰기 증가/감소
  const indentIncreaseDom = document.querySelector<HTMLDivElement>('.menu-item__indent-increase')!
  indentIncreaseDom.onclick = function () {
    instance.command.executeIndentIncrease()
  }

  const indentDecreaseDom = document.querySelector<HTMLDivElement>('.menu-item__indent-decrease')!
  indentDecreaseDom.onclick = function () {
    instance.command.executeIndentDecrease()
  }

  const rowMarginDom = document.querySelector<HTMLDivElement>(
    '.menu-item__row-margin'
  )!
  const rowOptionDom = rowMarginDom.querySelector<HTMLDivElement>('.options')!
  rowMarginDom.onclick = function () {
    console.log('row-margin')
    rowOptionDom.classList.toggle('visible')
  }
  rowOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executeRowMargin(Number(li.dataset.rowmargin!))
  }

  const listDom = document.querySelector<HTMLDivElement>('.menu-item__list')!
  listDom.title = `목록(${isApple ? '⌘' : 'Ctrl'}+Shift+U)`
  const listOptionDom = listDom.querySelector<HTMLDivElement>('.options')!
  listDom.onclick = function () {
    console.log('list')
    listOptionDom.classList.toggle('visible')
  }
  listOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    const listType = <ListType>li.dataset.listType || null
    const listStyle = <ListStyle>(<unknown>li.dataset.listStyle)
    instance.command.executeList(listType, listStyle)
  }

  // 4. | 표 | 그림 | 하이퍼링크 | 구분선 | 워터마크 | 코드 블록 | 구분선 | 컨트롤 | 체크박스 | LaTeX | 날짜 선택
  const tableDom = document.querySelector<HTMLDivElement>('.menu-item__table')!
  const tablePanelContainer = document.querySelector<HTMLDivElement>(
    '.menu-item__table__collapse'
  )!
  const tableClose = document.querySelector<HTMLDivElement>('.table-close')!
  const tableTitle = document.querySelector<HTMLDivElement>('.table-select')!
  const tablePanel = document.querySelector<HTMLDivElement>('.table-panel')!
  // 행렬 그리기
  const tableCellList: HTMLDivElement[][] = []
  for (let i = 0; i < 10; i++) {
    const tr = document.createElement('tr')
    tr.classList.add('table-row')
    const trCellList: HTMLDivElement[] = []
    for (let j = 0; j < 10; j++) {
      const td = document.createElement('td')
      td.classList.add('table-cel')
      tr.append(td)
      trCellList.push(td)
    }
    tablePanel.append(tr)
    tableCellList.push(trCellList)
  }
  let colIndex = 0
  let rowIndex = 0
  // 모든 셀 선택 제거
  function removeAllTableCellSelect() {
    tableCellList.forEach(tr => {
      tr.forEach(td => td.classList.remove('active'))
    })
  }
  // 제목 내용 설정
  function setTableTitle(payload: string) {
    tableTitle.innerText = payload
  }
  // 초기 상태로 복원
  function recoveryTable() {
    // 선택 스타일, 제목, 선택 행렬 복원
    removeAllTableCellSelect()
    setTableTitle('삽입')
    colIndex = 0
    rowIndex = 0
    // panel 숨기기
    tablePanelContainer.style.display = 'none'
  }
  tableDom.onclick = function () {
    console.log('table')
    tablePanelContainer!.style.display = 'block'
  }
  tablePanel.onmousemove = function (evt) {
    const celSize = 16
    const rowMarginTop = 10
    const celMarginRight = 6
    const { offsetX, offsetY } = evt
    // 모든 선택 제거
    removeAllTableCellSelect()
    colIndex = Math.ceil(offsetX / (celSize + celMarginRight)) || 1
    rowIndex = Math.ceil(offsetY / (celSize + rowMarginTop)) || 1
    // 선택 스타일 변경
    tableCellList.forEach((tr, trIndex) => {
      tr.forEach((td, tdIndex) => {
        if (tdIndex < colIndex && trIndex < rowIndex) {
          td.classList.add('active')
        }
      })
    })
    // 표 제목 변경
    setTableTitle(`${rowIndex}×${colIndex}`)
  }
  tableClose.onclick = function () {
    recoveryTable()
  }
  tablePanel.onclick = function () {
    // 선택 적용
    instance.command.executeInsertTable(rowIndex, colIndex)
    recoveryTable()
  }

  const imageDom = document.querySelector<HTMLDivElement>('.menu-item__image')!
  const imageFileDom = document.querySelector<HTMLInputElement>('#image')!
  imageDom.onclick = function () {
    imageFileDom.click()
  }
  imageFileDom.onchange = function () {
    const file = imageFileDom.files![0]!
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = function () {
      // 너비와 높이 계산
      const image = new Image()
      const value = fileReader.result as string
      image.src = value
      image.onload = function () {
        instance.command.executeImage({
          value,
          width: image.width,
          height: image.height
        })
        imageFileDom.value = ''
      }
    }
  }

  const hyperlinkDom = document.querySelector<HTMLDivElement>(
    '.menu-item__hyperlink'
  )!
  hyperlinkDom.onclick = function () {
    console.log('hyperlink')
    new Dialog({
      title: '하이퍼링크',
      data: [
        {
          type: 'text',
          label: '텍스트',
          name: 'name',
          required: true,
          placeholder: '텍스트를 입력하세요',
          value: instance.command.getRangeText()
        },
        {
          type: 'text',
          label: '링크',
          name: 'url',
          required: true,
          placeholder: '링크를 입력하세요'
        }
      ],
      onConfirm: payload => {
        const name = payload.find(p => p.name === 'name')?.value
        if (!name) return
        const url = payload.find(p => p.name === 'url')?.value
        if (!url) return
        instance.command.executeHyperlink({
          url,
          valueList: splitText(name).map(n => ({
            value: n,
            size: 16
          }))
        })
      }
    })
  }

  const separatorDom = document.querySelector<HTMLDivElement>(
    '.menu-item__separator'
  )!
  const separatorOptionDom =
    separatorDom.querySelector<HTMLDivElement>('.options')!
  separatorDom.onclick = function () {
    console.log('separator')
    separatorOptionDom.classList.toggle('visible')
  }
  separatorOptionDom.onmousedown = function (evt) {
    let payload: number[] = []
    const li = evt.target as HTMLLIElement
    const separatorDash = li.dataset.separator?.split(',').map(Number)
    if (separatorDash) {
      const isSingleLine = separatorDash.every(d => d === 0)
      if (!isSingleLine) {
        payload = separatorDash
      }
    }
    instance.command.executeSeparator(payload)
  }

  const pageBreakDom = document.querySelector<HTMLDivElement>(
    '.menu-item__page-break'
  )!
  pageBreakDom.onclick = function () {
    console.log('pageBreak')
    instance.command.executePageBreak()
  }

  // ─── 워터마크 색상 팔레트 (밝음→어두움 8단계) ─────────────────
  const WATERMARK_COLORS = [
    { hex: '#E8E8E8', label: '매우 밝은 회색' },
    { hex: '#C0C0C0', label: '밝은 회색' },
    { hex: '#AEB5C0', label: '기본 회색' },
    { hex: '#8899AA', label: '중간 회색' },
    { hex: '#6C7A89', label: '어두운 회색' },
    { hex: '#4A5568', label: '더 어두운 회색' },
    { hex: '#2D3748', label: '매우 어두운 회색' },
    { hex: '#1A202C', label: '거의 검정' }
  ]

  function showWatermarkDialog() {
    let selectedWatermarkColor = '#AEB5C0'

    // 마스크
    const mask = document.createElement('div')
    mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;'
    document.body.appendChild(mask)

    // 컨테이너
    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:1000;'
    document.body.appendChild(wrap)

    // 다이얼로그
    const dlg = document.createElement('div')
    dlg.style.cssText = 'background:#fff;border-radius:4px;padding:0 30px 24px;min-width:380px;box-shadow:0 4px 16px rgba(0,0,0,.2);'
    wrap.appendChild(dlg)

    // 제목
    const titleBar = document.createElement('div')
    titleBar.style.cssText = 'height:56px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e6ed;margin-bottom:20px;'
    titleBar.innerHTML = '<span style="font-size:16px;font-weight:600;">워터마크</span>'
    const closeBtn = document.createElement('i')
    closeBtn.style.cssText = 'width:16px;height:16px;cursor:pointer;display:inline-block;background:url(./assets/images/close.svg);'
    closeBtn.onclick = dispose
    titleBar.appendChild(closeBtn)
    dlg.appendChild(titleBar)

    // 폼 필드 생성 헬퍼
    function makeField(labelText: string, inputEl: HTMLElement) {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;'
      const lbl = document.createElement('span')
      lbl.style.cssText = 'font-size:14px;color:#3d4757;margin-right:12px;white-space:nowrap;'
      lbl.textContent = labelText
      row.appendChild(lbl)
      row.appendChild(inputEl)
      dlg.appendChild(row)
    }

    const inputStyle = 'width:240px;height:30px;border:1px solid #d3d3d3;border-radius:2px;padding:4px 8px;box-sizing:border-box;outline:none;font-size:13px;'

    // 내용
    const dataInput = document.createElement('input')
    dataInput.type = 'text'; dataInput.style.cssText = inputStyle; dataInput.placeholder = '내용을 입력하세요'
    makeField('내용 *', dataInput)

    // 색상 팔레트
    const colorWrap = document.createElement('div')
    colorWrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;'
    const colorRow = document.createElement('div')
    colorRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;'

    WATERMARK_COLORS.forEach(c => {
      const swatch = document.createElement('div')
      swatch.style.cssText = `width:24px;height:24px;border-radius:3px;cursor:pointer;background:${c.hex};border:2px solid ${c.hex === selectedWatermarkColor ? '#4991f2' : 'transparent'};box-sizing:border-box;`
      swatch.title = c.label
      swatch.addEventListener('click', () => {
        selectedWatermarkColor = c.hex
        colorRow.querySelectorAll<HTMLDivElement>('[data-wcolor]').forEach(el => {
          el.style.border = `2px solid ${el.dataset.wcolor === c.hex ? '#4991f2' : 'transparent'}`
        })
      })
      swatch.dataset.wcolor = c.hex
      colorRow.appendChild(swatch)
    })
    colorWrap.appendChild(colorRow)

    // 선택 색상 미리보기 라벨
    makeField('색상', colorWrap)

    // 글꼴 크기
    const sizeInput = document.createElement('input')
    sizeInput.type = 'number'; sizeInput.style.cssText = inputStyle; sizeInput.value = '120'
    makeField('글꼴 크기', sizeInput)

    // 투명도
    const opacityInput = document.createElement('input')
    opacityInput.type = 'number'; opacityInput.style.cssText = inputStyle; opacityInput.value = '0.3'; opacityInput.step = '0.1'; opacityInput.min = '0'; opacityInput.max = '1'
    makeField('투명도', opacityInput)

    // 반복
    const repeatSelect = document.createElement('select')
    repeatSelect.style.cssText = inputStyle
    repeatSelect.innerHTML = '<option value="0">반복 안함</option><option value="1">반복</option>'
    makeField('반복', repeatSelect)

    // 버튼
    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;margin-top:8px;'
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = '취소'
    cancelBtn.style.cssText = 'padding:0 16px;height:30px;border:1px solid #e2e6ed;border-radius:2px;background:#fff;cursor:pointer;'
    cancelBtn.onclick = dispose
    const confirmBtn = document.createElement('button')
    confirmBtn.textContent = '확인'
    confirmBtn.style.cssText = 'padding:0 16px;height:30px;border:1px solid #4991f2;border-radius:2px;background:#4991f2;color:#fff;cursor:pointer;'
    confirmBtn.onclick = () => {
      if (!dataInput.value.trim()) { dataInput.focus(); return }
      const repeat = repeatSelect.value === '1'
      instance.command.executeAddWatermark({
        data: dataInput.value.trim(),
        color: selectedWatermarkColor,
        size: Number(sizeInput.value) || 120,
        opacity: Number(opacityInput.value) || 0.3,
        repeat,
        gap: repeat ? [10, 10] : undefined
      })
      dispose()
    }
    btnRow.appendChild(cancelBtn)
    btnRow.appendChild(confirmBtn)
    dlg.appendChild(btnRow)

    function dispose() {
      mask.remove()
      wrap.remove()
    }
    mask.onclick = dispose
  }

  const watermarkDom = document.querySelector<HTMLDivElement>(
    '.menu-item__watermark'
  )!
  const watermarkOptionDom =
    watermarkDom.querySelector<HTMLDivElement>('.options')!
  watermarkDom.onclick = function () {
    console.log('watermark')
    watermarkOptionDom.classList.toggle('visible')
  }
  watermarkOptionDom.onmousedown = function (evt) {
    const li = evt.target as HTMLLIElement
    const menu = li.dataset.menu!
    watermarkOptionDom.classList.toggle('visible')
    if (menu === 'add') {
      showWatermarkDialog()
    } else {
      instance.command.executeDeleteWatermark()
    }
  }

  const codeblockDom = document.querySelector<HTMLDivElement>(
    '.menu-item__codeblock'
  )!
  codeblockDom.onclick = function () {
    console.log('codeblock')
    new Dialog({
      title: '코드 블록',
      data: [
        {
          type: 'textarea',
          name: 'codeblock',
          placeholder: '코드를 입력하세요',
          width: 500,
          height: 300
        }
      ],
      onConfirm: payload => {
        const codeblock = payload.find(p => p.name === 'codeblock')?.value
        if (!codeblock) return
        const tokenList = prism.tokenize(codeblock, prism.languages.javascript)
        const formatTokenList = formatPrismToken(tokenList)
        const elementList: IElement[] = []
        for (let i = 0; i < formatTokenList.length; i++) {
          const formatToken = formatTokenList[i]
          const tokenStringList = splitText(formatToken.content)
          for (let j = 0; j < tokenStringList.length; j++) {
            const value = tokenStringList[j]
            const element: IElement = {
              value
            }
            if (formatToken.color) {
              element.color = formatToken.color
            }
            if (formatToken.bold) {
              element.bold = true
            }
            if (formatToken.italic) {
              element.italic = true
            }
            elementList.push(element)
          }
        }
        elementList.unshift({
          value: '\n'
        })
        instance.command.executeInsertElementList(elementList)
      }
    })
  }

  const controlDom = document.querySelector<HTMLDivElement>(
    '.menu-item__control'
  )!
  const controlOptionDom = controlDom.querySelector<HTMLDivElement>('.options')!
  controlDom.onclick = function () {
    console.log('control')
    controlOptionDom.classList.toggle('visible')
  }
  controlOptionDom.onmousedown = function (evt) {
    controlOptionDom.classList.toggle('visible')
    const li = evt.target as HTMLLIElement
    const type = <ControlType>li.dataset.control
    switch (type) {
      case ControlType.TEXT:
        new Dialog({
          title: '텍스트 컨트롤',
          data: [
            {
              type: 'text',
              label: '플레이스홀더',
              name: 'placeholder',
              required: true,
              placeholder: '플레이스홀더를 입력하세요'
            },
            {
              type: 'text',
              label: '기본값',
              name: 'value',
              placeholder: '기본값을 입력하세요'
            }
          ],
          onConfirm: payload => {
            const placeholder = payload.find(
              p => p.name === 'placeholder'
            )?.value
            if (!placeholder) return
            const value = payload.find(p => p.name === 'value')?.value || ''
            instance.command.executeInsertControl({
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                value: value
                  ? [
                      {
                        value
                      }
                    ]
                  : null,
                placeholder
              }
            })
          }
        })
        break
      case ControlType.SELECT:
        new Dialog({
          title: '목록 컨트롤',
          data: [
            {
              type: 'text',
              label: '플레이스홀더',
              name: 'placeholder',
              required: true,
              placeholder: '플레이스홀더를 입력하세요'
            },
            {
              type: 'text',
              label: '기본값',
              name: 'code',
              placeholder: '기본값을 입력하세요'
            },
            {
              type: 'textarea',
              label: '값 집합',
              name: 'valueSets',
              required: true,
              height: 100,
              placeholder: `값 집합 JSON을 입력하세요, 예：\n[{\n"value":"있음",\n"code":"98175"\n}]`
            }
          ],
          onConfirm: payload => {
            const placeholder = payload.find(
              p => p.name === 'placeholder'
            )?.value
            if (!placeholder) return
            const valueSets = payload.find(p => p.name === 'valueSets')?.value
            if (!valueSets) return
            const code = payload.find(p => p.name === 'code')?.value
            instance.command.executeInsertControl({
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                code,
                value: null,
                placeholder,
                valueSets: JSON.parse(valueSets)
              }
            })
          }
        })
        break
      case ControlType.CHECKBOX:
        new Dialog({
          title: '체크박스 컨트롤',
          data: [
            {
              type: 'text',
              label: '기본값',
              name: 'code',
              placeholder: '기본값을 입력하세요, 여러 값은 쉼표로 구분'
            },
            {
              type: 'textarea',
              label: '값 집합',
              name: 'valueSets',
              required: true,
              height: 100,
              placeholder: `값 집합 JSON을 입력하세요, 예：\n[{\n"value":"있음",\n"code":"98175"\n}]`
            }
          ],
          onConfirm: payload => {
            const valueSets = payload.find(p => p.name === 'valueSets')?.value
            if (!valueSets) return
            const code = payload.find(p => p.name === 'code')?.value
            instance.command.executeInsertControl({
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                code,
                value: null,
                valueSets: JSON.parse(valueSets)
              }
            })
          }
        })
        break
      case ControlType.RADIO:
        new Dialog({
          title: '라디오버튼 컨트롤',
          data: [
            {
              type: 'text',
              label: '기본값',
              name: 'code',
              placeholder: '기본값을 입력하세요'
            },
            {
              type: 'textarea',
              label: '값 집합',
              name: 'valueSets',
              required: true,
              height: 100,
              placeholder: `값 집합 JSON을 입력하세요, 예：\n[{\n"value":"있음",\n"code":"98175"\n}]`
            }
          ],
          onConfirm: payload => {
            const valueSets = payload.find(p => p.name === 'valueSets')?.value
            if (!valueSets) return
            const code = payload.find(p => p.name === 'code')?.value
            instance.command.executeInsertControl({
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                code,
                value: null,
                valueSets: JSON.parse(valueSets)
              }
            })
          }
        })
        break
      case ControlType.DATE:
        new Dialog({
          title: '날짜 컨트롤',
          data: [
            {
              type: 'text',
              label: '플레이스홀더',
              name: 'placeholder',
              required: true,
              placeholder: '플레이스홀더를 입력하세요'
            },
            {
              type: 'text',
              label: '기본값',
              name: 'value',
              placeholder: '기본값을 입력하세요'
            },
            {
              type: 'select',
              label: '날짜 형식',
              name: 'dateFormat',
              value: 'yyyy-MM-dd hh:mm:ss',
              required: true,
              options: [
                {
                  label: 'yyyy-MM-dd hh:mm:ss',
                  value: 'yyyy-MM-dd hh:mm:ss'
                },
                {
                  label: 'yyyy-MM-dd',
                  value: 'yyyy-MM-dd'
                }
              ]
            }
          ],
          onConfirm: payload => {
            const placeholder = payload.find(
              p => p.name === 'placeholder'
            )?.value
            if (!placeholder) return
            const value = payload.find(p => p.name === 'value')?.value || ''
            const dateFormat =
              payload.find(p => p.name === 'dateFormat')?.value || ''
            instance.command.executeInsertControl({
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                dateFormat,
                value: value
                  ? [
                      {
                        value
                      }
                    ]
                  : null,
                placeholder
              }
            })
          }
        })
        break
      case ControlType.NUMBER:
        new Dialog({
          title: '숫자 컨트롤',
          data: [
            {
              type: 'text',
              label: '플레이스홀더',
              name: 'placeholder',
              required: true,
              placeholder: '플레이스홀더를 입력하세요'
            },
            {
              type: 'text',
              label: '기본값',
              name: 'value',
              placeholder: '기본값을 입력하세요'
            }
          ],
          onConfirm: payload => {
            const placeholder = payload.find(
              p => p.name === 'placeholder'
            )?.value
            if (!placeholder) return
            const value = payload.find(p => p.name === 'value')?.value || ''
            instance.command.executeInsertControl({
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                value: value
                  ? [
                      {
                        value
                      }
                    ]
                  : null,
                placeholder
              }
            })
          }
        })
        break
      default:
        break
    }
  }

  const checkboxDom = document.querySelector<HTMLDivElement>(
    '.menu-item__checkbox'
  )!
  checkboxDom.onclick = function () {
    console.log('checkbox')
    instance.command.executeInsertElementList([
      {
        type: ElementType.CHECKBOX,
        checkbox: {
          value: false
        },
        value: ''
      }
    ])
  }

  const radioDom = document.querySelector<HTMLDivElement>('.menu-item__radio')!
  radioDom.onclick = function () {
    console.log('radio')
    instance.command.executeInsertElementList([
      {
        type: ElementType.RADIO,
        checkbox: {
          value: false
        },
        value: ''
      }
    ])
  }

  const latexDom = document.querySelector<HTMLDivElement>('.menu-item__latex')!
  latexDom.onclick = function () {
    console.log('LaTeX')
    new Dialog({
      title: 'LaTeX',
      data: [
        {
          type: 'textarea',
          height: 100,
          name: 'value',
          placeholder: 'LaTeX 텍스트를 입력하세요'
        }
      ],
      onConfirm: payload => {
        const value = payload.find(p => p.name === 'value')?.value
        if (!value) return
        instance.command.executeInsertElementList([
          {
            type: ElementType.LATEX,
            value
          }
        ])
      }
    })
  }

  const dateDom = document.querySelector<HTMLDivElement>('.menu-item__date')!
  const dateDomOptionDom = dateDom.querySelector<HTMLDivElement>('.options')!
  dateDom.onclick = function () {
    console.log('date')
    dateDomOptionDom.classList.toggle('visible')
    // 위치 조정
    const bodyRect = document.body.getBoundingClientRect()
    const dateDomOptionRect = dateDomOptionDom.getBoundingClientRect()
    if (dateDomOptionRect.left + dateDomOptionRect.width > bodyRect.width) {
      dateDomOptionDom.style.right = '0px'
      dateDomOptionDom.style.left = 'unset'
    } else {
      dateDomOptionDom.style.right = 'unset'
      dateDomOptionDom.style.left = '0px'
    }
    // 현재 날짜
    const date = new Date()
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const dateTimeString = `${dateString} ${hour}:${minute}:${second}`
    dateDomOptionDom.querySelector<HTMLLIElement>('li:first-child')!.innerText =
      dateString
    dateDomOptionDom.querySelector<HTMLLIElement>('li:last-child')!.innerText =
      dateTimeString
  }
  dateDomOptionDom.onmousedown = function (evt) {
    const li = evt.target as HTMLLIElement
    const dateFormat = li.dataset.format!
    dateDomOptionDom.classList.toggle('visible')
    instance.command.executeInsertElementList([
      {
        type: ElementType.DATE,
        value: '',
        dateFormat,
        valueList: [
          {
            value: li.innerText.trim()
          }
        ]
      }
    ])
  }

  const blockDom = document.querySelector<HTMLDivElement>('.menu-item__block')!
  blockDom.onclick = function () {
    console.log('block')
    new Dialog({
      title: '콘텐츠 블록',
      data: [
        {
          type: 'select',
          label: '유형',
          name: 'type',
          value: 'iframe',
          required: true,
          options: [
            {
              label: '웹 주소',
              value: 'iframe'
            },
            {
              label: '비디오',
              value: 'video'
            }
          ]
        },
        {
          type: 'number',
          label: '너비',
          name: 'width',
          placeholder: '너비를 입력하세요（기본값은 페이지 내 너비）'
        },
        {
          type: 'number',
          label: '높이',
          name: 'height',
          required: true,
          placeholder: '높이를 입력하세요'
        },
        {
          type: 'input',
          label: '주소',
          name: 'src',
          required: false,
          placeholder: '주소를 입력하세요'
        },
        {
          type: 'textarea',
          label: 'HTML',
          height: 100,
          name: 'srcdoc',
          required: false,
          placeholder: 'HTML 코드를 입력하세요（웹 주소 유형만 유효）'
        }
      ],
      onConfirm: payload => {
        const type = payload.find(p => p.name === 'type')?.value
        if (!type) return
        const width = payload.find(p => p.name === 'width')?.value
        const height = payload.find(p => p.name === 'height')?.value
        if (!height) return
        // 주소 또는 HTML 코드 중 최소 하나는 존재해야 함
        const src = payload.find(p => p.name === 'src')?.value
        const srcdoc = payload.find(p => p.name === 'srcdoc')?.value
        const block: IBlock = {
          type: <BlockType>type
        }
        if (block.type === BlockType.IFRAME) {
          if (!src && !srcdoc) return
          block.iframeBlock = {
            src,
            srcdoc
          }
        } else if (block.type === BlockType.VIDEO) {
          if (!src) return
          block.videoBlock = {
            src
          }
        }
        const blockElement: IElement = {
          type: ElementType.BLOCK,
          value: '',
          height: Number(height),
          block
        }
        if (width) {
          blockElement.width = Number(width)
        }
        instance.command.executeInsertElementList([blockElement])
      }
    })
  }

  // 5. | 검색&바꾸기 | 인쇄 |
  const searchCollapseDom = document.querySelector<HTMLDivElement>(
    '.menu-item__search__collapse'
  )!
  const searchInputDom = document.querySelector<HTMLInputElement>(
    '.menu-item__search__collapse__search input'
  )!
  const replaceInputDom = document.querySelector<HTMLInputElement>(
    '.menu-item__search__collapse__replace input'
  )!
  const searchRegInputDom =
    document.querySelector<HTMLInputElement>('#option-reg')!
  const searchCaseInputDom =
    document.querySelector<HTMLInputElement>('#option-case')!
  const searchSelectionInputDom =
    document.querySelector<HTMLInputElement>('#option-selection')!
  const searchDom =
    document.querySelector<HTMLDivElement>('.menu-item__search')!
  searchDom.title = `검색 및 바꾸기(${isApple ? '⌘' : 'Ctrl'}+F)`
  const searchResultDom =
    searchCollapseDom.querySelector<HTMLLabelElement>('.search-result')!
  function setSearchResult() {
    const result = instance.command.getSearchNavigateInfo()
    if (result) {
      const { index, count } = result
      searchResultDom.innerText = `${index}/${count}`
    } else {
      searchResultDom.innerText = ''
    }
  }
  searchDom.onclick = function () {
    console.log('search')
    searchCollapseDom.style.display = 'block'
    const bodyRect = document.body.getBoundingClientRect()
    const searchRect = searchDom.getBoundingClientRect()
    const searchCollapseRect = searchCollapseDom.getBoundingClientRect()
    if (searchRect.left + searchCollapseRect.width > bodyRect.width) {
      searchCollapseDom.style.right = '0px'
      searchCollapseDom.style.left = 'unset'
    } else {
      searchCollapseDom.style.right = 'unset'
    }
    searchInputDom.focus()
  }
  searchCollapseDom.querySelector<HTMLSpanElement>('span')!.onclick =
    function () {
      searchCollapseDom.style.display = 'none'
      searchInputDom.value = ''
      replaceInputDom.value = ''
      instance.command.executeSearch(null)
      setSearchResult()
    }

  function emitSearch() {
    instance.command.executeSearch(searchInputDom.value || null, {
      isRegEnable: searchRegInputDom.checked,
      isIgnoreCase: searchCaseInputDom.checked,
      isLimitSelection: searchSelectionInputDom.checked
    })
    setSearchResult()
  }

  searchInputDom.oninput = emitSearch
  searchRegInputDom.onchange = emitSearch
  searchCaseInputDom.onchange = emitSearch
  searchSelectionInputDom.onchange = emitSearch
  searchInputDom.onkeydown = function (evt) {
    if (evt.key === 'Enter') {
      emitSearch()
    }
  }
  searchCollapseDom.querySelector<HTMLButtonElement>('button')!.onclick =
    function () {
      const searchValue = searchInputDom.value
      const replaceValue = replaceInputDom.value
      if (searchValue && searchValue !== replaceValue) {
        instance.command.executeReplace(replaceValue)
      }
    }
  searchCollapseDom.querySelector<HTMLDivElement>('.arrow-left')!.onclick =
    function () {
      instance.command.executeSearchNavigatePre()
      setSearchResult()
    }
  searchCollapseDom.querySelector<HTMLDivElement>('.arrow-right')!.onclick =
    function () {
      instance.command.executeSearchNavigateNext()
      setSearchResult()
    }

  const printDom = document.querySelector<HTMLDivElement>('.menu-item__print')!
  printDom.title = `인쇄(${isApple ? '⌘' : 'Ctrl'}+P)`
  printDom.onclick = function () {
    console.log('print')
    instance.command.executePrint()
  }

  // 에디터 툴바 저장 버튼은 제거되었으므로 export-json DOM이 없을 수 있음 (안전하게 처리)
  const exportJsonDom = document.querySelector<HTMLDivElement>('.menu-item__export-json')
  if (exportJsonDom) {
    exportJsonDom.onclick = function () {
      // 부모창(JSP)으로 저장 데이터 요청 위임
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'EDITOR_SAVE_READY', payload: null }, '*')
      }
    }
  }

  // 예시 버튼 클릭 이벤트
  const exampleDom = document.querySelector<HTMLDivElement>('.menu-item__example')!
  exampleDom.onclick = function () {
    console.log('example')
    const confirmed = confirm('현재 문서 내용이 예시 데이터로 대체됩니다. 계속하시겠습니까?')
    if (confirmed) {
      instance.command.executeSetValue(exampleData)
      alert('예시 데이터를 불러왔습니다.')
    }
  }

  // 초기화 버튼 클릭 이벤트
  const resetDom = document.querySelector<HTMLDivElement>('.menu-item__reset')!
  resetDom.onclick = function () {
    console.log('reset')
    const confirmed = confirm('문서를 초기화하시겠습니까? 모든 내용이 삭제됩니다.')
    if (confirmed) {
      instance.command.executeSetValue({
        header: [],
        main: [
          {
            value: '\n'
          }
        ],
        footer: []
      })
      alert('문서가 초기화되었습니다.')
    }
  }

  // 6. 목차 표시/숨김 | 페이지 모드 | 용지 배율 | 용지 크기 | 용지 방향 | 여백 | 전체 화면 | 설정
  const editorOptionDom =
    document.querySelector<HTMLDivElement>('.editor-option')!
  editorOptionDom.onclick = function () {
    const options = instance.command.getOptions()
    new Dialog({
      title: '편집기 설정',
      data: [
        {
          type: 'textarea',
          name: 'option',
          width: 350,
          height: 300,
          required: true,
          value: JSON.stringify(options, null, 2),
          placeholder: '편집기 설정을 입력하세요'
        }
      ],
      onConfirm: payload => {
        const newOptionValue = payload.find(p => p.name === 'option')?.value
        if (!newOptionValue) return
        const newOption = JSON.parse(newOptionValue)
        instance.command.executeUpdateOptions(newOption)
      }
    })
  }

  async function updateCatalog() {
    const catalog = await instance.command.getCatalog()
    const catalogMainDom =
      document.querySelector<HTMLDivElement>('.catalog__main')!
    catalogMainDom.innerHTML = ''
    if (catalog) {
      const appendCatalog = (
        parent: HTMLDivElement,
        catalogItems: ICatalogItem[]
      ) => {
        for (let c = 0; c < catalogItems.length; c++) {
          const catalogItem = catalogItems[c]
          const catalogItemDom = document.createElement('div')
          catalogItemDom.classList.add('catalog-item')
          // 렌더링
          const catalogItemContentDom = document.createElement('div')
          catalogItemContentDom.classList.add('catalog-item__content')
          const catalogItemContentSpanDom = document.createElement('span')
          catalogItemContentSpanDom.innerText = catalogItem.name
          catalogItemContentDom.append(catalogItemContentSpanDom)
          // 위치 지정
          catalogItemContentDom.onclick = () => {
            instance.command.executeLocationCatalog(catalogItem.id)
          }
          catalogItemDom.append(catalogItemContentDom)
          if (catalogItem.subCatalog && catalogItem.subCatalog.length) {
            appendCatalog(catalogItemDom, catalogItem.subCatalog)
          }
          // 추가
          parent.append(catalogItemDom)
        }
      }
      appendCatalog(catalogMainDom, catalog)
    }
  }
  let isCatalogShow = true
  const catalogDom = document.querySelector<HTMLElement>('.catalog')!
  const catalogModeDom =
    document.querySelector<HTMLDivElement>('.catalog-mode')!
  const catalogHeaderCloseDom = document.querySelector<HTMLDivElement>(
    '.catalog__header__close'
  )!
  const switchCatalog = () => {
    isCatalogShow = !isCatalogShow
    if (isCatalogShow) {
      catalogDom.style.display = 'block'
      updateCatalog()
    } else {
      catalogDom.style.display = 'none'
    }
  }
  catalogModeDom.onclick = switchCatalog
  catalogHeaderCloseDom.onclick = switchCatalog

  const pageModeDom = document.querySelector<HTMLDivElement>('.page-mode')!
  const pageModeOptionsDom =
    pageModeDom.querySelector<HTMLDivElement>('.options')!
  pageModeDom.onclick = function () {
    pageModeOptionsDom.classList.toggle('visible')
  }
  pageModeOptionsDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executePageMode(<PageMode>li.dataset.pageMode!)
  }

  document.querySelector<HTMLDivElement>('.page-scale-percentage')!.onclick =
    function () {
      console.log('page-scale-recovery')
      instance.command.executePageScaleRecovery()
    }

  document.querySelector<HTMLDivElement>('.page-scale-minus')!.onclick =
    function () {
      console.log('page-scale-minus')
      instance.command.executePageScaleMinus()
    }

  document.querySelector<HTMLDivElement>('.page-scale-add')!.onclick =
    function () {
      console.log('page-scale-add')
      instance.command.executePageScaleAdd()
    }

  // 용지 크기
  const paperSizeDom = document.querySelector<HTMLDivElement>('.paper-size')!
  const paperSizeDomOptionsDom =
    paperSizeDom.querySelector<HTMLDivElement>('.options')!
  paperSizeDom.onclick = function () {
    paperSizeDomOptionsDom.classList.toggle('visible')
  }
  paperSizeDomOptionsDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    const paperType = li.dataset.paperSize!
    const [width, height] = paperType.split('*').map(Number)
    instance.command.executePaperSize(width, height)
    // 용지 상태 반영
    paperSizeDomOptionsDom
      .querySelectorAll('li')
      .forEach(child => child.classList.remove('active'))
    li.classList.add('active')
  }

  // 용지 방향
  const paperDirectionDom =
    document.querySelector<HTMLDivElement>('.paper-direction')!
  const paperDirectionDomOptionsDom =
    paperDirectionDom.querySelector<HTMLDivElement>('.options')!
  paperDirectionDom.onclick = function () {
    paperDirectionDomOptionsDom.classList.toggle('visible')
  }
  paperDirectionDomOptionsDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    const paperDirection = li.dataset.paperDirection!
    instance.command.executePaperDirection(<PaperDirection>paperDirection)
    // 용지 방향 상태 반영
    paperDirectionDomOptionsDom
      .querySelectorAll('li')
      .forEach(child => child.classList.remove('active'))
    li.classList.add('active')
  }

  // 페이지 여백
  const paperMarginDom =
    document.querySelector<HTMLDivElement>('.paper-margin')!
  paperMarginDom.onclick = function () {
    const [topMargin, rightMargin, bottomMargin, leftMargin] =
      instance.command.getPaperMargin()
    new Dialog({
      title: '여백',
      data: [
        {
          type: 'text',
          label: '위쪽 여백',
          name: 'top',
          required: true,
          value: `${topMargin}`,
          placeholder: '위쪽 여백을 입력하세요'
        },
        {
          type: 'text',
          label: '아래쪽 여백',
          name: 'bottom',
          required: true,
          value: `${bottomMargin}`,
          placeholder: '아래쪽 여백을 입력하세요'
        },
        {
          type: 'text',
          label: '왼쪽 여백',
          name: 'left',
          required: true,
          value: `${leftMargin}`,
          placeholder: '왼쪽 여백을 입력하세요'
        },
        {
          type: 'text',
          label: '오른쪽 여백',
          name: 'right',
          required: true,
          value: `${rightMargin}`,
          placeholder: '오른쪽 여백을 입력하세요'
        }
      ],
      onConfirm: payload => {
        const top = payload.find(p => p.name === 'top')?.value
        if (!top) return
        const bottom = payload.find(p => p.name === 'bottom')?.value
        if (!bottom) return
        const left = payload.find(p => p.name === 'left')?.value
        if (!left) return
        const right = payload.find(p => p.name === 'right')?.value
        if (!right) return
        instance.command.executeSetPaperMargin([
          Number(top),
          Number(right),
          Number(bottom),
          Number(left)
        ])
      }
    })
  }

  // 전체 화면
  const fullscreenDom = document.querySelector<HTMLDivElement>('.fullscreen')!
  fullscreenDom.onclick = toggleFullscreen
  window.addEventListener('keydown', evt => {
    if (evt.key === 'F11') {
      toggleFullscreen()
      evt.preventDefault()
    }
  })
  document.addEventListener('fullscreenchange', () => {
    fullscreenDom.classList.toggle('exist')
  })
  function toggleFullscreen() {
    console.log('fullscreen')
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // 7. 편집기 사용 모드
  let modeIndex = 0
  const modeList = [
    {
      mode: EditorMode.EDIT,
      name: '편집 모드'
    },
    {
      mode: EditorMode.CLEAN,
      name: '청결 모드'
    },
    {
      mode: EditorMode.READONLY,
      name: '읽기전용 모드'
    },
    {
      mode: EditorMode.FORM,
      name: '양식 모드'
    },
    {
      mode: EditorMode.PRINT,
      name: '인쇄 모드'
    },
    {
      mode: EditorMode.DESIGN,
      name: '설계 모드'
    },
    {
      mode: EditorMode.GRAFFITI,
      name: '주석 모드'
    }
  ]
  const modeElement = document.querySelector<HTMLDivElement>('.editor-mode')!
  modeElement.onclick = function () {
    // 모드 선택 순환
    modeIndex === modeList.length - 1 ? (modeIndex = 0) : modeIndex++
    // 모드 설정
    const { name, mode } = modeList[modeIndex]
    modeElement.innerText = name
    instance.command.executeMode(mode)
    // 메뉴바 권한 시각적 피드백 설정
    const isReadonly = mode === EditorMode.READONLY
    const enableMenuList = ['search', 'print']
    document.querySelectorAll<HTMLDivElement>('.menu-item>div').forEach(dom => {
      const menu = dom.dataset.menu
      isReadonly && (!menu || !enableMenuList.includes(menu))
        ? dom.classList.add('disable')
        : dom.classList.remove('disable')
    })
  }

  // 주석 시뮬레이션
  const commentDom = document.querySelector<HTMLDivElement>('.comment')!
  async function updateComment() {
    const groupIds = await instance.command.getGroupIds()
    for (const comment of commentList) {
      const activeCommentDom = commentDom.querySelector<HTMLDivElement>(
        `.comment-item[data-id='${comment.id}']`
      )
      // 편집기에 해당 그룹 id가 존재하는지 확인
      if (groupIds.includes(comment.id)) {
        // 현재 dom이 존재하는지 - 없으면 추가
        if (!activeCommentDom) {
          const commentItem = document.createElement('div')
          commentItem.classList.add('comment-item')
          commentItem.setAttribute('data-id', comment.id)
          commentItem.onclick = () => {
            instance.command.executeLocationGroup(comment.id)
          }
          commentDom.append(commentItem)
          // 선택 영역 정보
          const commentItemTitle = document.createElement('div')
          commentItemTitle.classList.add('comment-item__title')
          commentItemTitle.append(document.createElement('span'))
          const commentItemTitleContent = document.createElement('span')
          commentItemTitleContent.innerText = comment.rangeText
          commentItemTitle.append(commentItemTitleContent)
          const closeDom = document.createElement('i')
          closeDom.onclick = () => {
            instance.command.executeDeleteGroup(comment.id)
          }
          commentItemTitle.append(closeDom)
          commentItem.append(commentItemTitle)
          // 기본 정보
          const commentItemInfo = document.createElement('div')
          commentItemInfo.classList.add('comment-item__info')
          const commentItemInfoName = document.createElement('span')
          commentItemInfoName.innerText = comment.userName
          const commentItemInfoDate = document.createElement('span')
          commentItemInfoDate.innerText = comment.createdDate
          commentItemInfo.append(commentItemInfoName)
          commentItemInfo.append(commentItemInfoDate)
          commentItem.append(commentItemInfo)
          // 상세 댓글
          const commentItemContent = document.createElement('div')
          commentItemContent.classList.add('comment-item__content')
          commentItemContent.innerText = comment.content
          commentItem.append(commentItemContent)
          commentDom.append(commentItem)
        }
      } else {
        // 편집기 내에 해당 그룹 id가 없으면 dom 제거
        activeCommentDom?.remove()
      }
    }
  }
  // 8. 내부 이벤트 리스너
  instance.listener.rangeStyleChange = function (payload) {
    // 컨트롤 타입
    payload.type === ElementType.SUBSCRIPT
      ? subscriptDom.classList.add('active')
      : subscriptDom.classList.remove('active')
    payload.type === ElementType.SUPERSCRIPT
      ? superscriptDom.classList.add('active')
      : superscriptDom.classList.remove('active')
    payload.type === ElementType.SEPARATOR
      ? separatorDom.classList.add('active')
      : separatorDom.classList.remove('active')
    separatorOptionDom
      .querySelectorAll('li')
      .forEach(li => li.classList.remove('active'))
    if (payload.type === ElementType.SEPARATOR) {
      const separator = payload.dashArray.join(',') || '0,0'
      const curSeparatorDom = separatorOptionDom.querySelector<HTMLLIElement>(
        `[data-separator='${separator}']`
      )!
      if (curSeparatorDom) {
        curSeparatorDom.classList.add('active')
      }
    }

    // 富文本
    fontOptionDom
      .querySelectorAll<HTMLLIElement>('li')
      .forEach(li => li.classList.remove('active'))
    const curFontDom = fontOptionDom.querySelector<HTMLLIElement>(
      `[data-family='${payload.font}']`
    )
    if (curFontDom) {
      fontSelectDom.innerText = curFontDom.innerText
      fontSelectDom.style.fontFamily = payload.font
      curFontDom.classList.add('active')
    }
    sizeOptionDom
      .querySelectorAll<HTMLLIElement>('li')
      .forEach(li => li.classList.remove('active'))
    const curSizeDom = sizeOptionDom.querySelector<HTMLLIElement>(
      `[data-size='${payload.size}']`
    )
    if (curSizeDom) {
      sizeSelectDom.innerText = curSizeDom.innerText
      curSizeDom.classList.add('active')
    } else {
      sizeSelectDom.innerText = `${payload.size}`
    }
    payload.bold
      ? boldDom.classList.add('active')
      : boldDom.classList.remove('active')
    payload.italic
      ? italicDom.classList.add('active')
      : italicDom.classList.remove('active')
    payload.underline
      ? underlineDom.classList.add('active')
      : underlineDom.classList.remove('active')
    payload.strikeout
      ? strikeoutDom.classList.add('active')
      : strikeoutDom.classList.remove('active')
    if (payload.color) {
      colorDom.classList.add('active')
      colorSpanDom.style.backgroundColor = payload.color
    } else {
      colorDom.classList.remove('active')
      colorSpanDom.style.backgroundColor = '#000000'
    }
    if (payload.highlight) {
      highlightDom.classList.add('active')
      highlightSpanDom.style.backgroundColor = payload.highlight
    } else {
      highlightDom.classList.remove('active')
      highlightSpanDom.style.backgroundColor = '#ffff00'
    }

    // 행 레이아웃
    leftDom.classList.remove('active')
    centerDom.classList.remove('active')
    rightDom.classList.remove('active')
    alignmentDom.classList.remove('active')
    justifyDom.classList.remove('active')
    if (payload.rowFlex && payload.rowFlex === 'right') {
      rightDom.classList.add('active')
    } else if (payload.rowFlex && payload.rowFlex === 'center') {
      centerDom.classList.add('active')
    } else if (payload.rowFlex && payload.rowFlex === 'alignment') {
      alignmentDom.classList.add('active')
    } else if (payload.rowFlex && payload.rowFlex === 'justify') {
      justifyDom.classList.add('active')
    } else {
      leftDom.classList.add('active')
    }

    // 줄 간격
    rowOptionDom
      .querySelectorAll<HTMLLIElement>('li')
      .forEach(li => li.classList.remove('active'))
    const curRowMarginDom = rowOptionDom.querySelector<HTMLLIElement>(
      `[data-rowmargin='${payload.rowMargin}']`
    )!
    curRowMarginDom.classList.add('active')

    // 기능
    payload.undo
      ? undoDom.classList.remove('no-allow')
      : undoDom.classList.add('no-allow')
    payload.redo
      ? redoDom.classList.remove('no-allow')
      : redoDom.classList.add('no-allow')
    payload.painter
      ? painterDom.classList.add('active')
      : painterDom.classList.remove('active')

    // 제목
    titleOptionDom
      .querySelectorAll<HTMLLIElement>('li')
      .forEach(li => li.classList.remove('active'))
    if (payload.level) {
      const curTitleDom = titleOptionDom.querySelector<HTMLLIElement>(
        `[data-level='${payload.level}']`
      )!
      titleSelectDom.innerText = curTitleDom.innerText
      // 별지/별표처럼 텍스트가 긴 경우 글씨 크기 축소
      if (payload.level === TitleLevel.BYEOLJI) {
        titleSelectDom.style.fontSize = '9px'
      } else {
        titleSelectDom.style.fontSize = ''
      }
      curTitleDom.classList.add('active')
    } else {
      titleSelectDom.innerText = '본문'
      titleSelectDom.style.fontSize = ''
      const noLevelLi = titleOptionDom.querySelector<HTMLLIElement>('li:not([data-level])')
      if (noLevelLi) noLevelLi.classList.add('active')
    }

    // 列表
    listOptionDom
      .querySelectorAll<HTMLLIElement>('li')
      .forEach(li => li.classList.remove('active'))
    if (payload.listType) {
      listDom.classList.add('active')
      const listType = payload.listType
      const listStyle =
        payload.listType === ListType.OL ? ListStyle.DECIMAL : payload.listType
      const curListDom = listOptionDom.querySelector<HTMLLIElement>(
        `[data-list-type='${listType}'][data-list-style='${listStyle}']`
      )
      if (curListDom) {
        curListDom.classList.add('active')
      }
    } else {
      listDom.classList.remove('active')
    }

    // 批注
    commentDom
      .querySelectorAll<HTMLDivElement>('.comment-item')
      .forEach(commentItemDom => {
        commentItemDom.classList.remove('active')
      })
    if (payload.groupIds) {
      const [id] = payload.groupIds
      const activeCommentDom = commentDom.querySelector<HTMLDivElement>(
        `.comment-item[data-id='${id}']`
      )
      if (activeCommentDom) {
        activeCommentDom.classList.add('active')
        scrollIntoView(commentDom, activeCommentDom)
      }
    }

    // 행열 정보
    const rangeContext = instance.command.getRangeContext()
    if (rangeContext) {
      document.querySelector<HTMLSpanElement>('.row-no')!.innerText = `${
        rangeContext.startRowNo + 1
      }`
      document.querySelector<HTMLSpanElement>('.col-no')!.innerText = `${
        rangeContext.startColNo + 1
      }`
    }
  }

  instance.listener.visiblePageNoListChange = function (payload) {
    const text = payload.map(i => i + 1).join('、')
    document.querySelector<HTMLSpanElement>('.page-no-list')!.innerText = text
  }

  instance.listener.pageSizeChange = function (payload) {
    document.querySelector<HTMLSpanElement>('.page-size')!.innerText =
      `${payload}`
  }

  instance.listener.intersectionPageNoChange = function (payload) {
    document.querySelector<HTMLSpanElement>('.page-no')!.innerText = `${
      payload + 1
    }`
  }

  instance.listener.pageScaleChange = function (payload) {
    document.querySelector<HTMLSpanElement>(
      '.page-scale-percentage'
    )!.innerText = `${Math.floor(payload * 10 * 10)}%`
  }

  instance.listener.controlChange = function (payload) {
    const disableMenusInControlContext = [
      'table',
      'hyperlink',
      'separator',
      'page-break',
      'control'
    ]
    // 메뉴 작업 권한
    disableMenusInControlContext.forEach(menu => {
      const menuDom = document.querySelector<HTMLDivElement>(
        `.menu-item__${menu}`
      )!
      payload.state === ControlState.ACTIVE
        ? menuDom.classList.add('disable')
        : menuDom.classList.remove('disable')
    })
  }

  instance.listener.pageModeChange = function (payload) {
    const activeMode = pageModeOptionsDom.querySelector<HTMLLIElement>(
      `[data-page-mode='${payload}']`
    )!
    pageModeOptionsDom
      .querySelectorAll('li')
      .forEach(li => li.classList.remove('active'))
    activeMode.classList.add('active')
  }

  const handleContentChange = async function () {
    // 문자 수
    const wordCount = await instance.command.getWordCount()
    document.querySelector<HTMLSpanElement>('.word-count')!.innerText = `${
      wordCount || 0
    }`
    // 목차
    if (isCatalogShow) {
      nextTick(() => {
        updateCatalog()
      })
    }
    // 주석
    nextTick(() => {
      updateComment()
    })
  }
  instance.listener.contentChange = debounce(handleContentChange, 200)
  handleContentChange()

  instance.listener.saved = function (payload) {
    console.log('elementList: ', payload)
  }

  // 9. 右键菜单注册
  instance.register.contextMenuList([
    {
      name: '주석',
      when: payload => {
        return (
          !payload.isReadonly &&
          payload.editorHasSelection &&
          payload.zone === EditorZone.MAIN
        )
      },
      callback: (command: Command) => {
        new Dialog({
          title: '주석',
          data: [
            {
              type: 'textarea',
              label: '주석 내용',
              height: 100,
              name: 'value',
              required: true,
              placeholder: '주석 내용을 입력하세요'
            }
          ],
          onConfirm: payload => {
            const value = payload.find(p => p.name === 'value')?.value
            if (!value) return
            const groupId = command.executeSetGroup()
            if (!groupId) return
            commentList.push({
              id: groupId,
              content: value,
              userName: 'Hufe',
              rangeText: command.getRangeText(),
              createdDate: new Date().toLocaleString()
            })
          }
        })
      }
    },
    {
      name: '캡션 추가',
      icon: 'caption',
      when: payload => {
        return (
          !payload.isReadonly &&
          payload.startElement?.type === ElementType.IMAGE &&
          !payload.startElement?.imgCaption
        )
      },
      callback: (command: Command) => {
        new Dialog({
          title: '캡션 추가',
          data: [
            {
              type: 'text',
              label: '캡션 내용',
              name: 'value',
              required: true,
              placeholder: '캡션 내용을 입력하세요. {imageNo}는 이미지 번호를 나타냅니다.'
            }
          ],
          onConfirm: payload => {
            const value = payload.find(p => p.name === 'value')?.value
            if (!value) return
            command.executeSetImageCaption({
              value
            })
          }
        })
      }
    },
    {
      name: '캡션 수정',
      icon: 'caption',
      when: payload => {
        return (
          !payload.isReadonly &&
          payload.startElement?.type === ElementType.IMAGE &&
          !!payload.startElement?.imgCaption
        )
      },
      callback: (command: Command, context) => {
        const currentCaption = context.startElement?.imgCaption
        new Dialog({
          title: '캡션 수정',
          data: [
            {
              type: 'text',
              label: '캡션 내용',
              name: 'value',
              required: true,
              value: currentCaption?.value,
              placeholder: '캡션 내용을 입력하세요. {imageNo}는 이미지 번호를 나타냅니다.'
            }
          ],
          onConfirm: payload => {
            const value = payload.find(p => p.name === 'value')?.value
            command.executeSetImageCaption({
              ...currentCaption,
              value: value || ''
            })
          }
        })
      }
    },
    {
      name: '서명',
      icon: 'signature',
      when: payload => {
        return !payload.isReadonly && payload.editorTextFocus
      },
      callback: (command: Command) => {
        new Signature({
          onConfirm(payload) {
            if (!payload) return
            const { value, width, height } = payload
            if (!value || !width || !height) return
            command.executeInsertElementList([
              {
                value,
                width,
                height,
                type: ElementType.IMAGE
              }
            ])
          }
        })
      }
    },
    {
      name: '서식 정리',
      icon: 'word-tool',
      when: payload => {
        return !payload.isReadonly
      },
      callback: (command: Command) => {
        command.executeWordTool()
      }
    },
    {
      name: '낙서 초기화',
      when: payload => {
        return payload.options.mode === EditorMode.GRAFFITI
      },
      callback: (command: Command) => {
        command.executeClearGraffiti()
      }
    }
  ])

  // 10. 단축키 등록
  instance.register.shortcutList([
    {
      key: KeyMap.ONE,
      mod: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executeTitle(TitleLevel.JO)
      }
    },
    {
      key: KeyMap.P,
      mod: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePrint()
      }
    },
    {
      key: KeyMap.F,
      mod: true,
      isGlobal: true,
      callback: (command: Command) => {
        const text = command.getRangeText()
        searchDom.click()
        if (text) {
          searchInputDom.value = text
          instance.command.executeSearch(text)
          setSearchResult()
        }
      }
    },
    {
      key: KeyMap.MINUS,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePageScaleMinus()
      }
    },
    {
      key: KeyMap.EQUAL,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePageScaleAdd()
      }
    },
    {
      key: KeyMap.ZERO,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePageScaleRecovery()
      }
    }
  ])

  // ── postMessage 연동 ──────────────────────────────────────────
  // JSP에서 전달받은 식별자 값 (저장 시 서버로 함께 전송)
  let _editorSeqEw: number | null = null
  let _editorVersion: number | null = null

  // 부모 창(JSP)에서 데이터를 받아 에디터에 로드
  window.addEventListener('message', (evt) => {
    // 메시지 데이터 파싱: 문자열이면 JSON.parse, 객체면 그대로 사용
    let msgData: { type?: string; payload?: unknown } = {}
    try {
      msgData = typeof evt.data === 'string' ? JSON.parse(evt.data) : (evt.data || {})
    } catch (e) {
      console.warn('[canvas-editor] postMessage 데이터 파싱 실패:', e)
      return
    }

    const { type, payload } = msgData

    if (type === 'EDITOR_LOAD_DATA') {
      // header / main / footer 각 필드도 문자열(JSP EL 직렬화)이면 JSON.parse 처리
      const rawPayload = payload as Record<string, unknown> | null | undefined
      let header: unknown[] = []
      let main: unknown[]   = []
      let footer: unknown[] = []
      try {
        header = typeof rawPayload?.header === 'string'
          ? JSON.parse(rawPayload.header)
          : ((rawPayload?.header as unknown[]) || [])
        main = typeof rawPayload?.main === 'string'
          ? JSON.parse(rawPayload.main)
          : ((rawPayload?.main as unknown[]) || [])
        footer = typeof rawPayload?.footer === 'string'
          ? JSON.parse(rawPayload.footer)
          : ((rawPayload?.footer as unknown[]) || [])
      } catch (e) {
        console.warn('[canvas-editor] EDITOR_LOAD_DATA payload 파싱 실패:', e)
      }

      // JSP에서 전달한 seq_ew, version 저장
      if (rawPayload?.seq_ew != null) {
        _editorSeqEw = Number(rawPayload.seq_ew)
      }
      if (rawPayload?.version != null) {
        _editorVersion = Number(rawPayload.version)
      }
      console.log('[canvas-editor] EDITOR_LOAD_DATA 수신 - header:', header.length, 'main:', main.length, 'footer:', footer.length, '| seq_ew:', _editorSeqEw, 'version:', _editorVersion)

      instance.command.executeSetValue({
        header: header as IElement[],
        main: (main as IElement[]).length ? (main as IElement[]) : [{ value: '\n' }],
        footer: footer as IElement[]
      })
    }

    if (type === 'GET_EDITOR_DATA') {
      // 부모가 저장 요청 시 현재 에디터 값 반환
      const value = instance.command.getValue()
      const target = evt.source as Window
      target.postMessage(
        { type: 'EDITOR_DATA', payload: value },
        evt.origin || '*'
      )
    }

    if (type === 'TEMP_SAVE_REQUEST') {
      // JSP 임시저장 버튼 클릭 시: 에디터 데이터를 부모창으로 반환
      const value = instance.command.getValue()
      const editorData = {
        header: value.data.header || [],
        main: value.data.main || [],
        footer: value.data.footer || [],
        options: value.options,
        seq_ew: _editorSeqEw,
        version: _editorVersion
      }
      const target = evt.source as Window
      target.postMessage(
        { type: 'TEMP_SAVE_DATA', payload: editorData },
        evt.origin || '*'
      )
    }
  })

  // 에디터 준비 완료를 부모에 알림 (iframe 내에서 동작 중인 경우)
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'EDITOR_READY' }, '*')
    console.log('[canvas-editor] EDITOR_READY 신호 전송 완료')
  }
}
