import { ExtensionContext, window, commands } from 'vscode'
import { uniq } from 'lodash'
import { EXT_NAMESPACE } from '../../meta'
import { KeyDetector, LocaleNode, Global } from '../../core'
import { LocaleTreeItem } from '../items/LocaleTreeItem'
import { LocalesTreeProvider } from './LocalesTreeProvider'

export class FileLocalesTreeProvider extends LocalesTreeProvider {
  protected name = 'FileLocalesTreeProvider'

  constructor (
    ctx: ExtensionContext,
  ) {
    super(ctx, [], true)
    this.loadCurrentDocument()
    window.onDidChangeActiveTextEditor(() => this.loadCurrentDocument())
    window.onDidChangeTextEditorSelection(() => this.loadCurrentDocument())
  }

  loadCurrentDocument () {
    const editor = window.activeTextEditor

    if (!editor || !Global.isLanguageIdSupported(editor.document.languageId)) {
      commands.executeCommand('setContext', `${EXT_NAMESPACE}-supported-file`, false)
      this.includePaths = []
    }
    else {
      commands.executeCommand('setContext', `${EXT_NAMESPACE}-supported-file`, true)
      this.includePaths = uniq(KeyDetector.getKeys(editor.document).map(i => i.key))
    }

    this.refresh()
  }

  getRoots () {
    const roots = super.getRoots()
    const realPaths = roots.map(i => i.node.keypath)
    if (!this.includePaths)
      return roots

    // create shadow nodes
    const shadowPaths = this.includePaths
      .filter(path => !realPaths.includes(path))

    for (const keypath of shadowPaths) {
      let node = this.loader.getTreeNodeByKey(keypath)
      if (node && node.type === 'tree') {
        roots.push(new LocaleTreeItem(this.ctx, node))
      }
      else {
        node = new LocaleNode({ keypath, shadow: true })
        roots.push(new LocaleTreeItem(this.ctx, node))
      }
    }

    return this.sort(roots)
  }
}
