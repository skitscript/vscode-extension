import { identifierIsValid, parse } from '@skitscript/parser-nodejs'
import type {
  ExtensionContext,
  RenameProvider,
  TextDocument,
  Position,
  CancellationToken,
  WorkspaceEdit,
  ProviderResult,
  Range,
  DocumentSelector,
  ReferenceProvider,
  ReferenceContext,
  Location,
  DefinitionProvider,
  Definition,
  DefinitionLink,
  Diagnostic,
  TextEditor
} from 'vscode'
import { optionalRequire } from 'optional-require'
import type { Warning, Error } from '@skitscript/types-nodejs'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const vscode = optionalRequire('vscode')

const documentSelector: DocumentSelector = {
  scheme: 'file',
  language: 'skitscript'
}

const renameProvider: RenameProvider = {
  provideRenameEdits (
    document: TextDocument,
    position: Position,
    newName: string,
    _token: CancellationToken
  ): ProviderResult<WorkspaceEdit> {
    newName = newName.trim()

    if (identifierIsValid(newName)) {
      const parsed = parse(document.getText())

      if (parsed.type === 'valid') {
        const line = position.line + 1
        const column = position.character + 1

        const identifierInstance = parsed.identifierInstances.find(
          (identifierInstance) =>
            identifierInstance.line === line &&
            identifierInstance.fromColumn <= column &&
            identifierInstance.toColumn + 1 >= column
        )

        if (identifierInstance === undefined) {
          return null
        } else {
          const workspaceEdit = new vscode.WorkspaceEdit()

          for (const otherIdentifierInstance of parsed.identifierInstances) {
            if (
              otherIdentifierInstance.type === identifierInstance.type &&
              otherIdentifierInstance.normalized ===
                identifierInstance.normalized
            ) {
              const line = otherIdentifierInstance.line - 1

              workspaceEdit.replace(
                document.uri,
                new vscode.Range(
                  new vscode.Position(
                    line,
                    otherIdentifierInstance.fromColumn - 1
                  ),
                  new vscode.Position(line, otherIdentifierInstance.toColumn)
                ),
                newName
              )
            }
          }

          return workspaceEdit
        }
      } else {
        return null
      }
    } else {
      return null
    }
  },

  prepareRename (
    document: TextDocument,
    position: Position,
    _token: CancellationToken
  ): ProviderResult<Range | { range: Range, placeholder: string }> {
    const parsed = parse(document.getText())

    if (parsed.type === 'valid') {
      const line = position.line + 1
      const column = position.character + 1

      const identifierInstance = parsed.identifierInstances.find(
        (identifierInstance) =>
          identifierInstance.line === line &&
          identifierInstance.fromColumn <= column &&
          identifierInstance.toColumn + 1 >= column
      )

      if (identifierInstance === undefined) {
        return null
      } else {
        const line = identifierInstance.line - 1

        return {
          range: new vscode.Range(
            new vscode.Position(line, identifierInstance.fromColumn - 1),
            new vscode.Position(line, identifierInstance.toColumn)
          ),
          placeholder: identifierInstance.verbatim
        }
      }
    } else {
      return null
    }
  }
}

const referenceProvider: ReferenceProvider = {
  provideReferences (
    document: TextDocument,
    position: Position,
    context: ReferenceContext,
    _token: CancellationToken
  ): ProviderResult<Location[]> {
    const parsed = parse(document.getText())

    if (parsed.type === 'valid') {
      const line = position.line + 1
      const column = position.character + 1

      const identifierInstance = parsed.identifierInstances.find(
        (identifierInstance) =>
          identifierInstance.line === line &&
          identifierInstance.fromColumn <= column &&
          identifierInstance.toColumn + 1 >= column
      )

      if (identifierInstance === undefined) {
        return null
      } else {
        let identifierInstances = parsed.identifierInstances.filter(
          (otherIdentifierInstance) =>
            otherIdentifierInstance.type === identifierInstance.type &&
            otherIdentifierInstance.normalized === identifierInstance.normalized
        )

        if (!context.includeDeclaration) {
          identifierInstances = [
            ...identifierInstances
              .filter(
                (identifierInstance) =>
                  identifierInstance.context === 'implicitDeclaration'
              )
              .slice(1),
            ...identifierInstances.filter(
              (identifierInstance) => identifierInstance.context === 'reference'
            )
          ]
        }

        return identifierInstances.map(
          (identifierInstance) =>
            new vscode.Location(
              document.uri,
              new vscode.Range(
                new vscode.Position(
                  identifierInstance.line - 1,
                  identifierInstance.fromColumn - 1
                ),
                new vscode.Position(
                  identifierInstance.line - 1,
                  identifierInstance.toColumn
                )
              )
            )
        )
      }
    } else {
      return null
    }
  }
}

const definitionProvider: DefinitionProvider = {
  provideDefinition (
    document: TextDocument,
    position: Position,
    _token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    const parsed = parse(document.getText())

    if (parsed.type === 'valid') {
      const line = position.line + 1
      const column = position.character + 1

      const identifierInstance = parsed.identifierInstances.find(
        (identifierInstance) =>
          identifierInstance.line === line &&
          identifierInstance.fromColumn <= column &&
          identifierInstance.toColumn + 1 >= column
      )

      if (identifierInstance === undefined) {
        return null
      } else {
        const identifierInstances = parsed.identifierInstances.filter(
          (otherIdentifierInstance) =>
            otherIdentifierInstance.type === identifierInstance.type &&
            otherIdentifierInstance.normalized === identifierInstance.normalized
        )

        return [
          ...identifierInstances.filter(
            (otherIdentifierInstance) =>
              otherIdentifierInstance.context === 'declaration'
          ),
          ...identifierInstances.filter(
            (otherIdentifierInstance) =>
              otherIdentifierInstance.context === 'implicitDeclaration'
          )
        ].map(
          (identifierInstance) =>
            new vscode.Location(
              document.uri,
              new vscode.Range(
                new vscode.Position(
                  identifierInstance.line - 1,
                  identifierInstance.fromColumn - 1
                ),
                new vscode.Position(
                  identifierInstance.line - 1,
                  identifierInstance.toColumn
                )
              )
            )
        )[0] as Location
      }
    } else {
      return null
    }
  }
}

function convertWarningOrErrorToDiagnostic (
  warningOrError: Warning | Error
): Diagnostic {
  switch (warningOrError.type) {
    case 'duplicateIdentifierInList':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.second.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.second.toColumn
          )
        ),
        'This item appears more than once in this list; this is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'emptyLabel':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.label.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.label.toColumn
          )
        ),
        'This label immediately leads elsewhere; this is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'flagNeverReferenced':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.flag.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.flag.toColumn
          )
        ),
        'This flag is never used; this is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'flagNeverSet':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.flag.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.flag.toColumn
          )
        ),
        'This flag is never set; this is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'inconsistentIdentifier':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.second.line - 1,
            warningOrError.second.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.second.line - 1,
            warningOrError.second.toColumn
          )
        ),
        'This is written differently earlier in this document; this is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'unreachable':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.fromColumn - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.toColumn)
        ),
        'This line (and every line following until the next label or the end of the file) are impossible to reach, which is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'unreferencedLabel':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.label.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.label.toColumn
          )
        ),
        'This label is never referenced; this is likely to be a mistake.',
        vscode.DiagnosticSeverity.Warning
      )

    case 'duplicateLabel':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.second.line - 1,
            warningOrError.second.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.second.line - 1,
            warningOrError.second.toColumn
          )
        ),
        'This label has the same (normalized) name as another previously declared.',
        vscode.DiagnosticSeverity.Error
      )

    case 'incompleteEscapeSequence':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.column - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.column)
        ),
        'This formatted text ends with a backslash; if you meant to insert a literal backslash, enter two (\\\\).',
        vscode.DiagnosticSeverity.Error
      )

    case 'invalidEscapeSequence':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.fromColumn - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.toColumn)
        ),
        'This pair of characters resemble an escape sequence, but this is not a supported escape sequence; if you meant to insert a literal backslash, enter two (\\\\).',
        vscode.DiagnosticSeverity.Error
      )

    case 'undefinedLabel':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.label.fromColumn - 1
          ),
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.label.toColumn
          )
        ),
        'This label has not been declared.',
        vscode.DiagnosticSeverity.Error
      )

    case 'unparsable':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.fromColumn - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.toColumn)
        ),
        'This line\'s format was not understood.  If it is intended to be dialog, indent it.  Otherwise, ensure that no identifiers include keywords, that the line ends with a full stop and that its grammar is correct.',
        vscode.DiagnosticSeverity.Error
      )

    case 'unterminatedBold':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.fromColumn - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.toColumn)
        ),
        'A run of bold text is started using two asterisks (**) but is never ended.  If you did not intend to start a run of bold text, escape the asterisks with backslashes (\\*\\*).  Otherwise, end the bold text before the end of the line with two asterisks (**).',
        vscode.DiagnosticSeverity.Error
      )

    case 'unterminatedCode':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.fromColumn - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.toColumn)
        ),
        'A run of code is started using a backtick (`) but is never ended.  If you did not intend to start a run of bold text, escape the backtick with a backslash (\\`).  Otherwise, end the code before the end of the line with a backtick (`).',
        vscode.DiagnosticSeverity.Error
      )

    case 'unterminatedItalic':
      return new vscode.Diagnostic(
        new vscode.Range(
          new vscode.Position(
            warningOrError.line - 1,
            warningOrError.fromColumn - 1
          ),
          new vscode.Position(warningOrError.line - 1, warningOrError.toColumn)
        ),
        'A run of italic text is started using an asterisk (*) but is never ended.  If you did not intend to start a run of italic text, escape the asterisk with backslashes (\\*).  Otherwise, end the bold text before the end of the line with an asterisk (*).',
        vscode.DiagnosticSeverity.Error
      )
  }
}

export function activate (context: ExtensionContext): void {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection('skitscript')

  const refreshDiagnostics = (document: TextDocument): void => {
    if (document.languageId === 'skitscript') {
      const parsed = parse(document.getText())

      if (parsed.type === 'valid') {
        diagnosticCollection.set(
          document.uri,
          parsed.warnings.map(convertWarningOrErrorToDiagnostic)
        )
      } else {
        diagnosticCollection.set(document.uri, parsed.errors.map(error =>
          convertWarningOrErrorToDiagnostic(error)
        ))
      }
    } else {
      diagnosticCollection.delete(document.uri)
    }
  }

  if (vscode.window.activeTextEditor !== undefined) {
    refreshDiagnostics(vscode.window.activeTextEditor.document)
  }

  context.subscriptions.push(
    vscode.Disposable.from(
      vscode.languages.registerRenameProvider(documentSelector, renameProvider),
      vscode.languages.registerReferenceProvider(
        documentSelector,
        referenceProvider
      ),
      vscode.languages.registerDefinitionProvider(
        documentSelector,
        definitionProvider
      ),
      diagnosticCollection,
      vscode.workspace.onDidChangeTextDocument((textEditor: TextEditor) => {
        refreshDiagnostics(textEditor.document)
      }),
      vscode.workspace.onDidCloseTextDocument((document: TextDocument) => {
        diagnosticCollection.delete(document.uri)
      }),
      vscode.window.onDidChangeActiveTextEditor((textEditor?: TextEditor) => {
        if (textEditor !== undefined) {
          refreshDiagnostics(textEditor.document)
        }
      })
    )
  )
}
