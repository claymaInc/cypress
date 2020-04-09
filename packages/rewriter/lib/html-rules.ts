import _ from 'lodash'
import RewritingStream from 'parse5-html-rewriting-stream'
import * as js from './js'

export function install (rewriter: RewritingStream) {
  let currentlyInsideJsScriptTag = false

  rewriter.on('startTag', (startTag, raw) => {
    if (startTag.tagName !== 'script') {
      return rewriter.emitRaw(raw)
    }

    const typeAttr = _.find(startTag.attrs, { name: 'type' })

    if (typeAttr && typeAttr.value !== 'text/javascript') {
      // we don't care about intercepting non-JS <script> tags
      return rewriter.emitRaw(raw)
    }

    currentlyInsideJsScriptTag = true

    const sriAttr = _.find(startTag.attrs, { name: 'integrity' })

    if (sriAttr) {
      sriAttr.name = 'cypress:stripped-integrity'
    }

    return rewriter.emitStartTag(startTag)
  })

  rewriter.on('endTag', (_endTag, raw) => {
    currentlyInsideJsScriptTag = false

    return rewriter.emitRaw(raw)
  })

  rewriter.on('text', (_text, raw) => {
    if (!currentlyInsideJsScriptTag) {
      return rewriter.emitRaw(raw)
    }

    // rewrite inline JS in <script> tags
    return rewriter.emitRaw(js.rewriteJs(raw))
  })
}
