/**
 * postbuild.js
 * 빌드 후 dist 폴더 내용을 정리하는 스크립트
 * - 현재는 단순히 빌드 완료 메시지만 출력
 */
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

async function getSize(dir) {
  let total = 0
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      total += await getSize(fullPath)
    } else {
      const s = await stat(fullPath)
      total += s.size
    }
  }
  return total
}

async function main() {
  const distDir = join(process.cwd(), 'dist')
  try {
    const bytes = await getSize(distDir)
    const kb = (bytes / 1024).toFixed(1)
    console.log(`\n✅ 빌드 완료! dist 폴더 총 크기: ${kb} KB`)
    console.log(`📁 dist 폴더 경로: ${distDir}`)
    console.log('\n📌 JSP 프로젝트 배포 방법:')
    console.log('   1. dist 폴더의 모든 파일을 웹 프로젝트의 /resources/canvas-editor/ 경로에 복사하세요.')
    console.log('   2. JSP에서 아래와 같이 iframe으로 사용하세요:\n')
    console.log('   <iframe id="editorFrame" src="/resources/canvas-editor/index.html" style="width:100%;height:800px;border:none;"></iframe>')
    console.log('\n   3. iframe이 로드되면 EDITOR_READY 메시지를 수신하고 EDITOR_LOAD_DATA로 데이터를 전달하세요.')
  } catch (e) {
    console.log('✅ 빌드 완료!')
  }
}

main()

