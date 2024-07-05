import type * as vscode from 'vscode'
import rewire = require('rewire')

const cancellationToken: vscode.CancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: () => {
    throw new Error('Unexpected call to cancellationToken.onCancellationRequested.')
  }
}

class Range {
  constructor (readonly start: Position, readonly end: Position) { }
}

class Disposable {
  constructor (public readonly mockedDisposableOf: ReadonlyArray<{ dispose: () => unknown }>) { }

  static from (...disposableLikes: Array<{ dispose: () => unknown }>): Disposable {
    return new Disposable(
      [...disposableLikes]
    )
  }
}

class Position {
  constructor (readonly line: number, readonly character: number) { }
}

class Location {
  constructor (readonly uri: string, readonly range: Range) { }
}

class WorkspaceEdit {
  readonly mockedReplacements: Array<{
    readonly uri: string
    readonly range: Range
    readonly newName: string
  }> = []

  replace (uri: string, range: Range, newName: string): void {
    this.mockedReplacements.push({ uri, range, newName })
  }
}

class DiagnosticRelatedInformation {
  constructor (public location: Location, public message: string) { }
}

class Diagnostic {
  source?: string

  code?:
  | string
  | number
  | {
    value: string | number
    target: vscode.Uri
  }

  relatedInformation?: DiagnosticRelatedInformation[]

  tags?: vscode.DiagnosticTag[]

  constructor (
    public range: Range,
    public message: string,
    public severity?:
    | 'Test Warning DiagnosticSeverity'
    | 'Test Error DiagnosticSeverity'
  ) { }
}

const createDiagnostic = (
  range: Range,
  message: string,
  severity: 'Test Warning DiagnosticSeverity' | 'Test Error DiagnosticSeverity',
  source?: string,
  code?:
  | string
  | number
  | {
    value: string | number
    target: vscode.Uri
  },
  relatedInformation?: DiagnosticRelatedInformation[],
  tags?: vscode.DiagnosticTag[]
): vscode.Diagnostic => {
  const output = new Diagnostic(range, message, severity)

  if (source !== undefined) {
    output.source = source
  }

  if (code !== undefined) {
    output.code = code
  }

  if (relatedInformation !== undefined) {
    output.relatedInformation = relatedInformation
  }

  if (tags !== undefined) {
    output.tags = tags
  }

  return output as unknown as vscode.Diagnostic
}

const createTextDocument = (
  text: string,
  languageId: string
): vscode.TextDocument => ({
  uri: 'Example Text Document Uri' as unknown as vscode.Uri,
  fileName: 'Example File Name',
  isUntitled: false,
  languageId,
  version: 1234,
  isDirty: true,
  isClosed: false,
  async save () {
    fail('Unexpected call to TextDocument.save.')
    throw new Error('Unexpected call to TextDocument.save.')
  },
  eol: 2,
  lineCount: 1234,
  lineAt () {
    fail('Unexpected call to TextDocument.lineAt.')
    throw new Error('Unexpected call to TextDocument.lineAt.')
  },
  offsetAt () {
    fail('Unexpected call to TextDocument.offsetAt.')
    throw new Error('Unexpected call to TextDocument.offsetAt.')
  },
  positionAt () {
    fail('Unexpected call to TextDocument.positionAt.')
    throw new Error('Unexpected call to TextDocument.positionAt.')
  },
  getText (range?: Range) {
    if (range === undefined) {
      return text
    } else {
      fail('Unexpected Range in call to TextDocument.getText.')
      throw new Error('Unexpected Range in call to TextDocument.getText.')
    }
  },
  getWordRangeAtPosition () {
    fail('Unexpected call to TextDocument.getWordRangeAtPosition.')
    throw new Error('Unexpected call to TextDocument.getWordRangeAtPosition.')
  },
  validateRange () {
    fail('Unexpected call to TextDocument.validateRange.')
    throw new Error('Unexpected call to TextDocument.validateRange.')
  },
  validatePosition () {
    fail('Unexpected call to TextDocument.validatePosition.')
    throw new Error('Unexpected call to TextDocument.validatePosition.')
  }
})

describe('on activation', () => {
  const scenario = (
    description: string,
    activeTextEditorFactory: () => undefined | vscode.TextEditor,
    then: (
      diagnosticCollection: {
        set: jasmine.Spy
        delete: jasmine.Spy
      },
      context: vscode.ExtensionContext
    ) => void
  ): void => {
    it(description, () => {
      const extension = rewire('./index.js')

      const diagnosticCollection = {
        set: jasmine.createSpy('diagnosticCollection.set'),
        delete: jasmine.createSpy('diagnosticCollection.delete')
      }

      const createDiagnosticCollection = jasmine
        .createSpy('createDiagnosticCollection')
        .and.returnValue(diagnosticCollection)

      extension.__set__('vscode', {
        Range,
        Position,
        Disposable,
        WorkspaceEdit,
        Location,
        Diagnostic,
        DiagnosticSeverity: {
          Warning: 'Test Warning DiagnosticSeverity',
          Error: 'Test Error DiagnosticSeverity'
        },
        languages: {
          registerRenameProvider (
            documentSelector: vscode.DocumentSelector,
            renameProvider: vscode.RenameProvider
          ) {
            return {
              mockedRenameProvider: {
                documentSelector,
                renameProvider
              }
            }
          },
          registerReferenceProvider (
            documentSelector: vscode.DocumentSelector,
            referenceProvider: vscode.ReferenceProvider
          ) {
            return {
              mockedReferenceProvider: {
                documentSelector,
                referenceProvider
              }
            }
          },
          registerDefinitionProvider (
            documentSelector: vscode.DocumentSelector,
            definitionProvider: vscode.DefinitionProvider
          ) {
            return {
              mockedDefinitionProvider: {
                documentSelector,
                definitionProvider
              }
            }
          },
          createDiagnosticCollection
        },
        workspace: {
          onDidChangeTextDocument (
            callback: (textEditor: vscode.TextEditor) => void
          ) {
            return {
              mockedOnDidChangeTextDocument: {
                callback
              }
            }
          },
          onDidCloseTextDocument (
            callback: (textEditor: vscode.TextDocument) => void
          ) {
            return {
              mockedOnDidCloseTextDocument: {
                callback
              }
            }
          }
        },
        window: {
          activeTextEditor: activeTextEditorFactory(),
          onDidChangeActiveTextEditor (
            callback: (textEditor?: vscode.TextEditor) => void
          ) {
            return {
              mockedOnDidChangeActiveTextEditor: {
                callback
              }
            }
          }
        }
      })

      const context = {
        languageModelAccessInformation: {
          onDidChange (): vscode.Disposable {
            fail('Unexpected call to languageModelAccessInformation.canSendRequest.')
            throw new Error('Unexpected call to languageModelAccessInformation.canSendRequest.')
          },
          canSendRequest (): boolean | undefined {
            fail('Unexpected call to languageModelAccessInformation.canSendRequest.')
            throw new Error('Unexpected call to languageModelAccessInformation.canSendRequest.')
          }
        },
        subscriptions: [],
        workspaceState: {
          keys () {
            fail('Unexpected call to workspaceState.keys.')
            throw new Error('Unexpected call to workspaceState.keys.')
          },
          get () {
            fail('Unexpected call to workspaceState.get.')
            throw new Error('Unexpected call to workspaceState.get.')
          },
          async update () {
            fail('Unexpected call to workspaceState.update.')
          }
        },
        globalState: {
          keys () {
            fail('Unexpected call to globalState.keys.')
            throw new Error('Unexpected call to globalState.keys.')
          },
          setKeysForSync () {
            fail('Unexpected call to globalState.setKeysForSync.')
          },
          get () {
            fail('Unexpected call to globalState.get.')
            throw new Error('Unexpected call to globalState.get.')
          },
          async update () {
            fail('Unexpected call to globalState.update.')
          }
        },
        extensionPath: 'Example Extension Path',
        asAbsolutePath (relativePath: string): string {
          fail('Unexpected call to context.asAbsolutePath.')
          return relativePath
        },
        storagePath: 'Example Storage Path',
        globalStoragePath: 'Example Global Storage Path',
        logPath: 'Example Log Path',
        extensionUri: {} as unknown as vscode.Uri,
        secrets: {
          async get () {
            fail('Unexpected call to secrets.get.')
            throw new Error('Unexpected call to secrets.get.')
          },
          async store () {
            fail('Unexpected call to secrets.store.')
          },
          async delete () {
            fail('Unexpected call to secrets.delete.')
          },
          onDidChange: () => {
            fail('Unexpected call to secrets.onDidChange.')
            throw new Error('Unexpected call to secrets.onDidChange.')
          }
        },
        environmentVariableCollection: {
          persistent: false,
          replace () {
            fail('Unexpected call to environmentVariableCollection.replace.')
          },
          append () {
            fail('Unexpected call to environmentVariableCollection.append.')
          },
          prepend () {
            fail('Unexpected call to environmentVariableCollection.prepend.')
          },
          get () {
            fail('Unexpected call to environmentVariableCollection.get.')
            throw new Error('Unexpected call to environmentVariableCollection.get.')
          },
          forEach () {
            fail('Unexpected call to environmentVariableCollection.forEach.')
          },
          delete () {
            fail('Unexpected call to environmentVariableCollection.delete.')
          },
          clear () {
            fail('Unexpected call to environmentVariableCollection.clear.')
          },
          * [Symbol.iterator] () {
            fail('Unexpected call to environmentVariableCollection.[Symbol.iterator].')
          },
          getScoped (): vscode.EnvironmentVariableCollection {
            fail('Unexpected call to environmentVariableCollection.getScoped.')
            throw new Error('Unexpected call to environmentVariableCollection.getScoped.')
          },
          description: 'Example Environment Variable Collection Description'
        },
        globalStorageUri: {} as unknown as vscode.Uri,
        storageUri: {} as unknown as vscode.Uri,
        logUri: {} as unknown as vscode.Uri,
        extension: {
          id: 'Example Extension Id',
          extensionUri: {} as unknown as vscode.Uri,
          extensionPath: 'Example Extension Path',
          isActive: false,
          packageJSON: {},
          extensionKind: 1,
          exports: null,
          async activate () {
            fail('Unexpected call to context.extension.activate.')
          }
        },
        extensionMode: 3
      }

      extension['activate'](context)

      then(diagnosticCollection, context)

      expect(createDiagnosticCollection).toHaveBeenCalledTimes(1)
    })
  }

  scenario(
    'adds one disposable item to the context with the expected number of providers',
    () => undefined,
    (_, context) => {
      expect(context.subscriptions).toEqual([
        new Disposable([
          jasmine.anything() as unknown as { dispose: () => unknown },
          jasmine.anything() as unknown as { dispose: () => unknown },
          jasmine.anything() as unknown as { dispose: () => unknown },
          jasmine.anything() as unknown as { dispose: () => unknown },
          jasmine.anything() as unknown as { dispose: () => unknown },
          jasmine.anything() as unknown as { dispose: () => unknown },
          jasmine.anything() as unknown as { dispose: () => unknown }
        ]) as unknown as { dispose: () => any }
      ])
    }
  )

  describe('rename provider', () => {
    const renameProviderScenario = (
      description: string,
      then: (renameProvider: {
        readonly mockedRenameProvider: {
          readonly documentSelector: vscode.DocumentSelector
          readonly renameProvider: vscode.RenameProvider
        }
      }) => void
    ): void => {
      scenario(
        description,
        () => undefined,
        (diagnosticCollection, context) => {
          const renameProvider = (
            context.subscriptions[0] as unknown as {
              readonly mockedDisposableOf: ReadonlyArray<
              Record<string, unknown>
              >
            }
          ).mockedDisposableOf.find(
            (item) => 'mockedRenameProvider' in item
          ) as {
            readonly mockedRenameProvider: {
              readonly documentSelector: vscode.DocumentSelector
              readonly renameProvider: vscode.RenameProvider
            }
          }

          then(renameProvider)

          expect(diagnosticCollection.delete).not.toHaveBeenCalled()
          expect(diagnosticCollection.set).not.toHaveBeenCalled()
        }
      )
    }

    renameProviderScenario('is included', (renameProvider) => {
      expect(renameProvider).not.toBeUndefined()
    })

    renameProviderScenario(
      'uses the correct document selector',
      (renameProvider) => {
        expect(renameProvider.mockedRenameProvider.documentSelector).toEqual({
          scheme: 'file',
          language: 'skitscript'
        })
      }
    )

    describe('provideRenameEdits', () => {
      renameProviderScenario(
        'when the document cannot be parsed',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B isnt Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 24) as vscode.Position,
              'Example Identifier',
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      renameProviderScenario(
        'when the cursor is before the first character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 9) as vscode.Position,
              ' \n \r \t Example Identifier C \n \r \t ',
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      renameProviderScenario(
        'when the cursor is after the last character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 31) as vscode.Position,
              ' \n \r \t Example Identifier C \n \r \t ',
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      renameProviderScenario(
        'when the cursor is on the first character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 10) as vscode.Position,
              ' \n \r \t Example Identifier C \n \r \t ',
              cancellationToken
            )

          const expected = new WorkspaceEdit()

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(1, 10), new Position(1, 30)),
            'Example Identifier C'
          )

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(4, 10), new Position(4, 30)),
            'Example Identifier C'
          )

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(6, 10), new Position(6, 30)),
            'Example Identifier C'
          )

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit)
        }
      )

      renameProviderScenario(
        'when the cursor is in the middle of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 24) as vscode.Position,
              ' \n \r \t Example Identifier C \n \r \t ',
              cancellationToken
            )

          const expected = new WorkspaceEdit()

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(1, 10), new Position(1, 30)),
            'Example Identifier C'
          )

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(4, 10), new Position(4, 30)),
            'Example Identifier C'
          )

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(6, 10), new Position(6, 30)),
            'Example Identifier C'
          )

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit)
        }
      )

      renameProviderScenario(
        'when the cursor is on the last character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 30) as vscode.Position,
              ' \n \r \t Example Identifier C \n \r \t ',
              cancellationToken
            )

          const expected = new WorkspaceEdit()

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(1, 10), new Position(1, 30)),
            'Example Identifier C'
          )

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(4, 10), new Position(4, 30)),
            'Example Identifier C'
          )

          expected.replace(
            'Example Text Document Uri',
            new Range(new Position(6, 10), new Position(6, 30)),
            'Example Identifier C'
          )

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit)
        }
      )

      renameProviderScenario(
        'when the identifier is invalid',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 24) as vscode.Position,
              ' \n \r \t Example (Invalid) Identifier \n \r \t ',
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )
    })

    describe('prepareRename', () => {
      renameProviderScenario(
        'when the document cannot be parsed',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B isnt Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 24) as vscode.Position,
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      renameProviderScenario(
        'when the cursor is before the first character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 9) as vscode.Position,
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      renameProviderScenario(
        'when the cursor is after the last character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 31) as vscode.Position,
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      renameProviderScenario(
        'when the cursor is on the first character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 10) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual({
            range: new Range(
              new Position(4, 10),
              new Position(4, 30)
            ) as unknown as vscode.Range,
            placeholder: 'Example Identifier B'
          })
        }
      )

      renameProviderScenario(
        'when the cursor is in the middle of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 24) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual({
            range: new Range(
              new Position(4, 10),
              new Position(4, 30)
            ) as unknown as vscode.Range,
            placeholder: 'Example Identifier B'
          })
        }
      )

      renameProviderScenario(
        'when the cursor is on the last character of an identifier',
        (renameProvider) => {
          const output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`,
                'skitscript'
              ),
              new Position(4, 30) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual({
            range: new Range(
              new Position(4, 10),
              new Position(4, 30)
            ) as unknown as vscode.Range,
            placeholder: 'Example Identifier B'
          })
        }
      )
    })
  })

  describe('reference provider', () => {
    const referenceProviderScenario = (
      description: string,
      then: (renameProvider: {
        readonly mockedReferenceProvider: {
          readonly documentSelector: vscode.DocumentSelector
          readonly referenceProvider: vscode.ReferenceProvider
        }
      }) => void
    ): void => {
      scenario(
        description,
        () => undefined,
        (diagnosticCollection, context) => {
          const referenceProvider = (
            context.subscriptions[0] as unknown as {
              readonly mockedDisposableOf: ReadonlyArray<
              Record<string, unknown>
              >
            }
          ).mockedDisposableOf.find(
            (item) => 'mockedReferenceProvider' in item
          ) as {
            readonly mockedReferenceProvider: {
              readonly documentSelector: vscode.DocumentSelector
              readonly referenceProvider: vscode.ReferenceProvider
            }
          }

          then(referenceProvider)

          expect(diagnosticCollection.delete).not.toHaveBeenCalled()
          expect(diagnosticCollection.set).not.toHaveBeenCalled()
        }
      )
    }

    referenceProviderScenario('is included', (referenceProvider) => {
      expect(referenceProvider).not.toBeUndefined()
    })

    referenceProviderScenario(
      'uses the correct document selector',
      (referenceProvider) => {
        expect(
          referenceProvider.mockedReferenceProvider.documentSelector
        ).toEqual({
          scheme: 'file',
          language: 'skitscript'
        })
      }
    )

    describe('provideReferences', () => {
      describe('when not including the definition', () => {
        referenceProviderScenario(
          'when the document cannot be parsed',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A isnt Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toBeNull()
          }
        )

        referenceProviderScenario(
          'when the cursor is before the first character of an identifier',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 1) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toBeNull()
          }
        )

        referenceProviderScenario(
          'when the cursor is after the last character of an identifier',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 23) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toBeNull()
          }
        )

        referenceProviderScenario(
          'when the cursor is on the first character of a declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 2) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is in the middle of a declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the last character of a declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 22) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the first character of a reference',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(3, 8) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is in the middle of a reference',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(3, 12) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the last character of a reference',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(3, 28) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the first character of an implicit declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(2, 24) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(6, 24), new Position(6, 44))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is in the middle of an implicit declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(2, 30) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(6, 24), new Position(6, 44))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the last character of an implicit declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(2, 44) as vscode.Position,
                { includeDeclaration: false },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(6, 24), new Position(6, 44))
              )
            ] as unknown as vscode.Location[])
          }
        )
      })

      describe('when including the definition', () => {
        referenceProviderScenario(
          'when the document cannot be parsed',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A isnt Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toBeNull()
          }
        )

        referenceProviderScenario(
          'when the cursor is before the first character of an identifier',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 1) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toBeNull()
          }
        )

        referenceProviderScenario(
          'when the cursor is after the last character of an identifier',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 23) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toBeNull()
          }
        )

        referenceProviderScenario(
          'when the cursor is on the first character of a declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 2) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is in the middle of a declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the last character of a declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(5, 22) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the first character of a reference',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(3, 8) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is in the middle of a reference',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(3, 12) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the last character of a reference',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(3, 28) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(8, 8), new Position(8, 28))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the first character of an implicit declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(2, 24) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(2, 24), new Position(2, 44))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(6, 24), new Position(6, 44))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is in the middle of an implicit declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(2, 30) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(2, 24), new Position(2, 44))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(6, 24), new Position(6, 44))
              )
            ] as unknown as vscode.Location[])
          }
        )

        referenceProviderScenario(
          'when the cursor is on the last character of an implicit declaration',
          (referenceProvider) => {
            const output =
              referenceProvider.mockedReferenceProvider.referenceProvider.provideReferences(
                createTextDocument(
                  `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                  'skitscript'
                ),
                new Position(2, 44) as vscode.Position,
                { includeDeclaration: true },
                cancellationToken
              )

            expect(output).toEqual([
              new Location(
                'Example Text Document Uri',
                new Range(new Position(2, 24), new Position(2, 44))
              ),
              new Location(
                'Example Text Document Uri',
                new Range(new Position(6, 24), new Position(6, 44))
              )
            ] as unknown as vscode.Location[])
          }
        )
      })
    })
  })

  describe('definition provider', () => {
    const definitionProviderScenario = (
      description: string,
      then: (renameProvider: {
        readonly mockedDefinitionProvider: {
          readonly documentSelector: vscode.DocumentSelector
          readonly definitionProvider: vscode.DefinitionProvider
        }
      }) => void
    ): void => {
      scenario(
        description,
        () => undefined,
        (diagnosticCollection, context) => {
          const definitionProvider = (
            context.subscriptions[0] as unknown as {
              readonly mockedDisposableOf: ReadonlyArray<
              Record<string, unknown>
              >
            }
          ).mockedDisposableOf.find(
            (item) => 'mockedDefinitionProvider' in item
          ) as {
            readonly mockedDefinitionProvider: {
              readonly documentSelector: vscode.DocumentSelector
              readonly definitionProvider: vscode.DefinitionProvider
            }
          }

          then(definitionProvider)

          expect(diagnosticCollection.delete).not.toHaveBeenCalled()
          expect(diagnosticCollection.set).not.toHaveBeenCalled()
        }
      )
    }

    definitionProviderScenario('is included', (definitionProvider) => {
      expect(definitionProvider).not.toBeUndefined()
    })

    definitionProviderScenario(
      'uses the correct document selector',
      (definitionProvider) => {
        expect(
          definitionProvider.mockedDefinitionProvider.documentSelector
        ).toEqual({
          scheme: 'file',
          language: 'skitscript'
        })
      }
    )

    describe('provideReferences', () => {
      definitionProviderScenario(
        'when the document cannot be parsed',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A isnt Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(5, 6) as vscode.Position,
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      definitionProviderScenario(
        'when the cursor is before the first character of an identifier',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(5, 1) as vscode.Position,
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      definitionProviderScenario(
        'when the cursor is after the last character of an identifier',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(5, 23) as vscode.Position,
              cancellationToken
            )

          expect(output).toBeNull()
        }
      )

      definitionProviderScenario(
        'when the cursor is on the first character of a declaration',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(5, 2) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is in the middle of a declaration',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(5, 6) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is on the last character of a declaration',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(5, 22) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is on the first character of a reference',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(3, 8) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is in the middle of a reference',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(3, 12) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is on the last character of a reference',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(3, 28) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is on the first character of an implicit declaration',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(2, 24) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(2, 24), new Position(2, 44))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is in the middle of an implicit declaration',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(2, 30) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(2, 24), new Position(2, 44))
            ) as unknown as vscode.Location
          )
        }
      )

      definitionProviderScenario(
        'when the cursor is on the last character of an implicit declaration',
        (definitionProvider) => {
          const output =
            definitionProvider.mockedDefinitionProvider.definitionProvider.provideDefinition(
              createTextDocument(
                `Example Identifier A is Example Identifier B.
~ Example Identifier B ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.
~ Example Identifier A ~
Example Identifier B is Example Identifier A.
Jump to Example Identifier B.
Jump to Example Identifier A.
Example Identifier A is Example Identifier B.`,
                'skitscript'
              ),
              new Position(2, 44) as vscode.Position,
              cancellationToken
            )

          expect(output).toEqual(
            new Location(
              'Example Text Document Uri',
              new Range(new Position(2, 24), new Position(2, 44))
            ) as unknown as vscode.Location
          )
        }
      )
    })
  })

  scenario(
    'includes the created diagnostic collection',
    () => undefined,
    (diagnosticCollection, context) => {
      const disposables = context.subscriptions[0] as unknown as {
        readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>
      }

      expect(disposables.mockedDisposableOf).toContain(diagnosticCollection)

      expect(diagnosticCollection.delete).not.toHaveBeenCalled()
      expect(diagnosticCollection.set).not.toHaveBeenCalled()
    }
  )

  const diagnosticCollectionChangeScenario = (
    description: string,
    activeTextEditorFactory: (
      text: string,
      languageId: string
    ) => undefined | vscode.TextEditor,
    then: (
      context: vscode.ExtensionContext,
      text: string,
      languageId: string
    ) => void
  ): void => {
    describe(description, () => {
      const subScenario = (
        description: string,
        text: string,
        diagnostics: readonly vscode.Diagnostic[]
      ): void => {
        scenario(
          description,
          () => activeTextEditorFactory(text, 'skitscript'),
          (diagnosticCollection, context) => {
            then(context, text, 'skitscript')

            expect(diagnosticCollection.delete).not.toHaveBeenCalled()
            expect(diagnosticCollection.set).toHaveBeenCalledTimes(1)
            expect(diagnosticCollection.set).toHaveBeenCalledWith(
              'Example Text Document Uri',
              diagnostics
            )
          }
        )
      }

      scenario(
        'non-skitscript',
        () => activeTextEditorFactory('Example Text', 'non-skitscript'),
        (diagnosticCollection, context) => {
          then(context, 'Example Text', 'non-skitscript')

          expect(diagnosticCollection.delete).toHaveBeenCalledTimes(1)
          expect(diagnosticCollection.delete).toHaveBeenCalledWith(
            'Example Text Document Uri'
          )
          expect(diagnosticCollection.set).not.toHaveBeenCalled()
        }
      )

      subScenario(
        'valid',
        `Set Example Flag and Example Flag.
~ Unreferenced ~
Clear Example FLAG and Other.
Jump to EOF.
Location: Example Background.
~ EOF ~`,
        [
          createDiagnostic(
            new Range(new Position(0, 21), new Position(0, 33)),
            'This item appears more than once in this list; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(2, 6), new Position(2, 18)),
            'This is written differently earlier in this document; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(4, 0), new Position(4, 29)),
            'This line (and every line following until the next label or the end of the file) are impossible to reach, which is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(1, 2), new Position(1, 14)),
            'This label is never referenced; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(0, 4), new Position(0, 16)),
            'This flag is never used; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(2, 23), new Position(2, 28)),
            'This flag is never set; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(2, 23), new Position(2, 28)),
            'This flag is never used; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          ),
          createDiagnostic(
            new Range(new Position(5, 2), new Position(5, 5)),
            'This label immediately leads elsewhere; this is likely to be a mistake.',
            'Test Warning DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          )
        ]
      )

      subScenario(
        'duplicate label',
        `~ Duplicate ~
~ Duplicate ~`,
        [
          createDiagnostic(
            new Range(new Position(1, 2), new Position(1, 11)),
            'This label has the same (normalized) name as another previously declared.',
            'Test Error DiagnosticSeverity',
            undefined,
            undefined,
            undefined,
            undefined
          )
        ]
      )

      subScenario('incomplete escape sequence', '  \\', [
        createDiagnostic(
          new Range(new Position(0, 2), new Position(0, 3)),
          'This formatted text ends with a backslash; if you meant to insert a literal backslash, enter two (\\\\).',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])

      subScenario('invalid escape sequence', '  \\?', [
        createDiagnostic(
          new Range(new Position(0, 2), new Position(0, 4)),
          'This pair of characters resemble an escape sequence, but this is not a supported escape sequence; if you meant to insert a literal backslash, enter two (\\\\).',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])

      subScenario('undefined label', 'Jump to undefined.', [
        createDiagnostic(
          new Range(new Position(0, 8), new Position(0, 17)),
          'This label has not been declared.',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])

      subScenario('unparsable', 'Something invalid.', [
        createDiagnostic(
          new Range(new Position(0, 0), new Position(0, 18)),
          'This line\'s format was not understood.  If it is intended to be dialog, indent it.  Otherwise, ensure that no identifiers include keywords, that the line ends with a full stop and that its grammar is correct.',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])

      subScenario('unterminated bold', '  **', [
        createDiagnostic(
          new Range(new Position(0, 2), new Position(0, 4)),
          'A run of bold text is started using two asterisks (**) but is never ended.  If you did not intend to start a run of bold text, escape the asterisks with backslashes (\\*\\*).  Otherwise, end the bold text before the end of the line with two asterisks (**).',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])

      subScenario('unterminated code', '  `', [
        createDiagnostic(
          new Range(new Position(0, 2), new Position(0, 3)),
          'A run of code is started using a backtick (`) but is never ended.  If you did not intend to start a run of bold text, escape the backtick with a backslash (\\`).  Otherwise, end the code before the end of the line with a backtick (`).',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])

      subScenario('unterminated italic', '  *', [
        createDiagnostic(
          new Range(new Position(0, 2), new Position(0, 3)),
          'A run of italic text is started using an asterisk (*) but is never ended.  If you did not intend to start a run of italic text, escape the asterisk with backslashes (\\*).  Otherwise, end the bold text before the end of the line with an asterisk (*).',
          'Test Error DiagnosticSeverity',
          undefined,
          undefined,
          undefined,
          undefined
        )
      ])
    })
  }

  diagnosticCollectionChangeScenario(
    'active text editor set during activation',
    (text, languageId) =>
      ({
        document: createTextDocument(text, languageId)
      } as unknown as vscode.TextEditor),
    () => {
      // Empty.
    }
  )

  scenario(
    'active text editor changed to undefined',
    () => undefined,
    (diagnosticCollection, context) => {
      const onDidChangeActiveTextEditor = (
        context.subscriptions[0] as unknown as {
          readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>
        }
      ).mockedDisposableOf.find(
        (item) => 'mockedOnDidChangeActiveTextEditor' in item
      ) as {
        readonly mockedOnDidChangeActiveTextEditor: {
          callback: (textEditor?: vscode.TextEditor) => void
        }
      }

      onDidChangeActiveTextEditor.mockedOnDidChangeActiveTextEditor.callback(
        undefined
      )

      expect(diagnosticCollection.delete).not.toHaveBeenCalled()
      expect(diagnosticCollection.set).not.toHaveBeenCalled()
    }
  )

  diagnosticCollectionChangeScenario(
    'active text editor changed to non-undefined',
    () => undefined,
    (context, text, languageId) => {
      const onDidChangeActiveTextEditor = (
        context.subscriptions[0] as unknown as {
          readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>
        }
      ).mockedDisposableOf.find(
        (item) => 'mockedOnDidChangeActiveTextEditor' in item
      ) as {
        readonly mockedOnDidChangeActiveTextEditor: {
          callback: (textEditor?: vscode.TextEditor) => void
        }
      }

      onDidChangeActiveTextEditor.mockedOnDidChangeActiveTextEditor.callback({
        document: createTextDocument(text, languageId)
      } as unknown as vscode.TextEditor)
    }
  )

  diagnosticCollectionChangeScenario(
    'text document changed',
    () => undefined,
    (context, text, languageId) => {
      const onDidChangeTextDocument = (
        context.subscriptions[0] as unknown as {
          readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>
        }
      ).mockedDisposableOf.find(
        (item) => 'mockedOnDidChangeTextDocument' in item
      ) as {
        readonly mockedOnDidChangeTextDocument: {
          callback: (textEditor: vscode.TextEditor) => void
        }
      }

      onDidChangeTextDocument.mockedOnDidChangeTextDocument.callback({
        document: createTextDocument(text, languageId)
      } as unknown as vscode.TextEditor)
    }
  )

  scenario(
    'text document closed',
    () => undefined,
    (diagnosticCollection, context) => {
      const onDidCloseTextDocument = (
        context.subscriptions[0] as unknown as {
          readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>
        }
      ).mockedDisposableOf.find(
        (item) => 'mockedOnDidCloseTextDocument' in item
      ) as {
        readonly mockedOnDidCloseTextDocument: {
          callback: (textEditor: vscode.TextDocument) => void
        }
      }

      onDidCloseTextDocument.mockedOnDidCloseTextDocument.callback(
        createTextDocument('Example Text', 'skitscript')
      )

      expect(diagnosticCollection.delete).toHaveBeenCalledTimes(1)
      expect(diagnosticCollection.delete).toHaveBeenCalledWith(
        'Example Text Document Uri'
      )
      expect(diagnosticCollection.set).not.toHaveBeenCalled()
    }
  )
})
