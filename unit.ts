import type * as vscode from "vscode";
import rewire = require("rewire");

class Range {
  constructor(readonly start: Position, readonly end: Position) {}
}

class Disposable {
  static from(...disposableLikes: { dispose: () => unknown }[]): Disposable {
    return {
      mockedDisposableOf: [...disposableLikes],
    };
  }
}

class Position {
  constructor(readonly line: number, readonly character: number) {}
}

class Location {
  constructor(readonly uri: string, readonly range: Range) {}
}

class WorkspaceEdit {
  readonly mockedReplacements: {
    readonly uri: string;
    readonly range: Range;
    readonly newName: string;
  }[] = [];

  replace(uri: string, range: Range, newName: string): void {
    this.mockedReplacements.push({ uri, range, newName });
  }
}

const createTextDocument = (text: string): vscode.TextDocument => ({
  uri: `Example Text Document Uri` as unknown as vscode.Uri,
  fileName: `Example File Name`,
  isUntitled: false,
  languageId: `skitscript`,
  version: 1234,
  isDirty: true,
  isClosed: false,
  async save() {
    fail(`Unexpected call to TextDocument.save.`);
    throw new Error(`Unexpected call to TextDocument.save.`);
  },
  eol: 2,
  lineCount: 1234,
  lineAt() {
    fail(`Unexpected call to TextDocument.lineAt.`);
    throw new Error(`Unexpected call to TextDocument.lineAt.`);
  },
  offsetAt() {
    fail(`Unexpected call to TextDocument.offsetAt.`);
    throw new Error(`Unexpected call to TextDocument.offsetAt.`);
  },
  positionAt() {
    fail(`Unexpected call to TextDocument.positionAt.`);
    throw new Error(`Unexpected call to TextDocument.positionAt.`);
  },
  getText(range?: Range) {
    if (range === undefined) {
      return text;
    } else {
      fail(`Unexpected Range in call to TextDocument.getText.`);
      throw new Error(`Unexpected Range in call to TextDocument.getText.`);
    }
  },
  getWordRangeAtPosition() {
    fail(`Unexpected call to TextDocument.getWordRangeAtPosition.`);
    throw new Error(`Unexpected call to TextDocument.getWordRangeAtPosition.`);
  },
  validateRange() {
    fail(`Unexpected call to TextDocument.validateRange.`);
    throw new Error(`Unexpected call to TextDocument.validateRange.`);
  },
  validatePosition() {
    fail(`Unexpected call to TextDocument.validatePosition.`);
    throw new Error(`Unexpected call to TextDocument.validatePosition.`);
  },
});

describe(`on activation`, () => {
  let extension: {
    activate(context: vscode.ExtensionContext): void;
    __set__(attribute: string, value: unknown): void;
  };

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    extension = rewire(`.`);

    extension.__set__(`vscode`, {
      Range,
      Position,
      Disposable,
      WorkspaceEdit,
      Location,
      languages: {
        registerRenameProvider(
          documentSelector: vscode.DocumentSelector,
          renameProvider: vscode.RenameProvider
        ) {
          return {
            mockedRenameProvider: {
              documentSelector,
              renameProvider,
            },
          };
        },
        registerReferenceProvider(
          documentSelector: vscode.DocumentSelector,
          referenceProvider: vscode.ReferenceProvider
        ) {
          return {
            mockedReferenceProvider: {
              documentSelector,
              referenceProvider,
            },
          };
        },
        registerDefinitionProvider(
          documentSelector: vscode.DocumentSelector,
          definitionProvider: vscode.DefinitionProvider
        ) {
          return {
            mockedDefinitionProvider: {
              documentSelector,
              definitionProvider,
            },
          };
        },
      },
    });
  });

  const scenario = (
    description: string,
    then: (context: vscode.ExtensionContext) => void
  ): void => {
    it(description, () => {
      const context = {
        subscriptions: [],
        workspaceState: {
          keys() {
            fail(`Unexpected call to Memento.keys.`);
            throw new Error(`Unexpected call to Memento.keys.`);
          },
          get() {
            fail(`Unexpected call to Memento.get.`);
            throw new Error(`Unexpected call to Memento.get.`);
          },
          async update() {
            fail(`Unexpected call to Memento.update.`);
          },
        },
        globalState: {
          keys() {
            fail(`Unexpected call to Memento.keys.`);
            throw new Error(`Unexpected call to Memento.keys.`);
          },
          setKeysForSync() {
            fail(`Unexpected call to Memento.setKeysForSync.`);
          },
          get() {
            fail(`Unexpected call to Memento.get.`);
            throw new Error(`Unexpected call to Memento.get.`);
          },
          async update() {
            fail(`Unexpected call to Memento.update.`);
          },
        },
        extensionPath: `Example Extension Path`,
        asAbsolutePath(relativePath: string): string {
          fail(`Unexpected call to context.asAbsolutePath.`);
          return relativePath;
        },
        storagePath: `Example Storage Path`,
        globalStoragePath: `Example Global Storage Path`,
        logPath: `Example Log Path`,
        extensionUri: {} as unknown as vscode.Uri,
        secrets: {
          async get() {
            fail(`Unexpected call to secrets.get.`);
            return undefined;
          },
          async store() {
            fail(`Unexpected call to secrets.store.`);
          },
          async delete() {
            fail(`Unexpected call to secrets.delete.`);
          },
          onDidChange: () => {
            fail(`Unexpected call to secrets.onDidChange.`);
            throw new Error(`Unexpected call to secrets.onDidChange.`);
          },
        },
        environmentVariableCollection: {
          persistent: false,
          replace() {
            fail(`Unexpected call to environmentVariableCollection.replace.`);
          },
          append() {
            fail(`Unexpected call to environmentVariableCollection.append.`);
          },
          prepend() {
            fail(`Unexpected call to environmentVariableCollection.prepend.`);
          },
          get() {
            fail(`Unexpected call to environmentVariableCollection.get.`);
            return undefined;
          },
          forEach() {
            fail(`Unexpected call to environmentVariableCollection.forEach.`);
          },
          delete() {
            fail(`Unexpected call to environmentVariableCollection.delete.`);
          },
          clear() {
            fail(`Unexpected call to environmentVariableCollection.clear.`);
          },
        },
        globalStorageUri: {} as unknown as vscode.Uri,
        storageUri: {} as unknown as vscode.Uri,
        logUri: {} as unknown as vscode.Uri,
        extension: {
          id: `Example Extension Id`,
          extensionUri: {} as unknown as vscode.Uri,
          extensionPath: `Example Extension Path`,
          isActive: false,
          packageJSON: {},
          extensionKind: 1,
          exports: null,
          async activate() {
            fail(`Unexpected call to context.extension.activate.`);
          },
        },
        extensionMode: 3,
      };

      extension[`activate`](context);

      then(context);
    });
  };

  scenario(
    `adds one disposable item to the context with the expected number of providers`,
    (context) => {
      expect(context.subscriptions).toEqual([
        {
          mockedDisposableOf: [
            jasmine.anything(),
            jasmine.anything(),
            jasmine.anything(),
          ],
        },
      ]);
    }
  );

  describe(`rename provider`, () => {
    const renameProviderScenario = (
      description: string,
      then: (renameProvider: {
        readonly mockedRenameProvider: {
          readonly documentSelector: vscode.DocumentSelector;
          readonly renameProvider: vscode.RenameProvider;
        };
      }) => void
    ): void => {
      scenario(description, (context) => {
        const renameProvider = (
          context.subscriptions[0] as unknown as {
            readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>;
          }
        ).mockedDisposableOf.find((item) => `mockedRenameProvider` in item) as {
          readonly mockedRenameProvider: {
            readonly documentSelector: vscode.DocumentSelector;
            readonly renameProvider: vscode.RenameProvider;
          };
        };

        then(renameProvider);
      });
    };

    renameProviderScenario(`is included`, (renameProvider) => {
      expect(renameProvider).not.toBeUndefined();
    });

    renameProviderScenario(
      `uses the correct document selector`,
      (renameProvider) => {
        expect(renameProvider.mockedRenameProvider.documentSelector).toEqual({
          scheme: `file`,
          language: `skitscript`,
        });
      }
    );

    describe(`provideRenameEdits`, () => {
      renameProviderScenario(
        `when the document cannot be parsed`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              `Example Identifier`,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      renameProviderScenario(
        `when the cursor is before the first character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 9) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      renameProviderScenario(
        `when the cursor is after the last character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 30) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      renameProviderScenario(
        `when the cursor is on the first character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 10) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );

          const expected = new WorkspaceEdit();

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(1, 10), new Position(1, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(4, 10), new Position(4, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(6, 10), new Position(6, 30)),
            `Example Identifier C`
          );

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit);
        }
      );

      renameProviderScenario(
        `when the cursor is in the middle of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );

          const expected = new WorkspaceEdit();

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(1, 10), new Position(1, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(4, 10), new Position(4, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(6, 10), new Position(6, 30)),
            `Example Identifier C`
          );

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit);
        }
      );

      renameProviderScenario(
        `when the cursor is on the last character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 29) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );

          const expected = new WorkspaceEdit();

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(1, 10), new Position(1, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(4, 10), new Position(4, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(6, 10), new Position(6, 30)),
            `Example Identifier C`
          );

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit);
        }
      );

      renameProviderScenario(
        `when the identifier is invalid`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              ` \n \r \t Example (Invalid) Identifier \n \r \t `,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );
    });

    describe(`prepareRename`, () => {
      renameProviderScenario(
        `when the document cannot be parsed`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      renameProviderScenario(
        `when the cursor is before the first character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 9) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      renameProviderScenario(
        `when the cursor is after the last character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 30) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      renameProviderScenario(
        `when the cursor is on the first character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 10) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual({
            range: new Range(
              new Position(4, 10),
              new Position(4, 30)
            ) as unknown as vscode.Range,
            placeholder: `Example Identifier B`,
          });
        }
      );

      renameProviderScenario(
        `when the cursor is in the middle of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual({
            range: new Range(
              new Position(4, 10),
              new Position(4, 30)
            ) as unknown as vscode.Range,
            placeholder: `Example Identifier B`,
          });
        }
      );

      renameProviderScenario(
        `when the cursor is on the last character of an identifier`,
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
Location: Example Identifier A.`
              ),
              new Position(4, 29) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual({
            range: new Range(
              new Position(4, 10),
              new Position(4, 30)
            ) as unknown as vscode.Range,
            placeholder: `Example Identifier B`,
          });
        }
      );
    });
  });

  describe(`reference provider`, () => {
    const referenceProviderScenario = (
      description: string,
      then: (renameProvider: {
        readonly mockedReferenceProvider: {
          readonly documentSelector: vscode.DocumentSelector;
          readonly referenceProvider: vscode.ReferenceProvider;
        };
      }) => void
    ): void => {
      scenario(description, (context) => {
        const referenceProvider = (
          context.subscriptions[0] as unknown as {
            readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>;
          }
        ).mockedDisposableOf.find(
          (item) => `mockedReferenceProvider` in item
        ) as {
          readonly mockedReferenceProvider: {
            readonly documentSelector: vscode.DocumentSelector;
            readonly referenceProvider: vscode.ReferenceProvider;
          };
        };

        then(referenceProvider);
      });
    };

    referenceProviderScenario(`is included`, (referenceProvider) => {
      expect(referenceProvider).not.toBeUndefined();
    });

    referenceProviderScenario(
      `uses the correct document selector`,
      (referenceProvider) => {
        expect(
          referenceProvider.mockedReferenceProvider.documentSelector
        ).toEqual({
          scheme: `file`,
          language: `skitscript`,
        });
      }
    );

    describe(`provideReferences`, () => {
      describe(`when not including the definition`, () => {
        referenceProviderScenario(
          `when the document cannot be parsed`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toBeNull();
          }
        );

        referenceProviderScenario(
          `when the cursor is before the first character of an identifier`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 1) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toBeNull();
          }
        );

        referenceProviderScenario(
          `when the cursor is after the last character of an identifier`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 22) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toBeNull();
          }
        );

        referenceProviderScenario(
          `when the cursor is on the first character of a declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 2) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is in the middle of a declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the last character of a declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 21) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the first character of a reference`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(3, 8) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is in the middle of a reference`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(3, 12) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the last character of a reference`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(3, 27) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the first character of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(2, 24) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(6, 24), new Position(6, 44))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is in the middle of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(2, 30) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(6, 24), new Position(6, 44))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the last character of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(2, 43) as vscode.Position,
                { includeDeclaration: false },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(6, 24), new Position(6, 44))
              ),
            ] as unknown as vscode.Location[]);
          }
        );
      });

      describe(`when including the definition`, () => {
        referenceProviderScenario(
          `when the document cannot be parsed`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toBeNull();
          }
        );

        referenceProviderScenario(
          `when the cursor is before the first character of an identifier`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 1) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toBeNull();
          }
        );

        referenceProviderScenario(
          `when the cursor is after the last character of an identifier`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 22) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toBeNull();
          }
        );

        referenceProviderScenario(
          `when the cursor is on the first character of a declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 2) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is in the middle of a declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 6) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the last character of a declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(5, 21) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the first character of a reference`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(3, 8) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is in the middle of a reference`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(3, 12) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the last character of a reference`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(3, 27) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(3, 8), new Position(3, 28))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(5, 2), new Position(5, 22))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(8, 8), new Position(8, 28))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the first character of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(2, 24) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(2, 24), new Position(2, 44))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(6, 24), new Position(6, 44))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is in the middle of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(2, 30) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(2, 24), new Position(2, 44))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(6, 24), new Position(6, 44))
              ),
            ] as unknown as vscode.Location[]);
          }
        );

        referenceProviderScenario(
          `when the cursor is on the last character of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
                ),
                new Position(2, 43) as vscode.Position,
                { includeDeclaration: true },
                {} as vscode.CancellationToken
              );

            expect(output).toEqual([
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(2, 24), new Position(2, 44))
              ),
              new Location(
                `Example Text Document Uri`,
                new Range(new Position(6, 24), new Position(6, 44))
              ),
            ] as unknown as vscode.Location[]);
          }
        );
      });
    });
  });

  describe(`definition provider`, () => {
    const definitionProviderScenario = (
      description: string,
      then: (renameProvider: {
        readonly mockedDefinitionProvider: {
          readonly documentSelector: vscode.DocumentSelector;
          readonly definitionProvider: vscode.DefinitionProvider;
        };
      }) => void
    ): void => {
      scenario(description, (context) => {
        const definitionProvider = (
          context.subscriptions[0] as unknown as {
            readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>;
          }
        ).mockedDisposableOf.find(
          (item) => `mockedDefinitionProvider` in item
        ) as {
          readonly mockedDefinitionProvider: {
            readonly documentSelector: vscode.DocumentSelector;
            readonly definitionProvider: vscode.DefinitionProvider;
          };
        };

        then(definitionProvider);
      });
    };

    definitionProviderScenario(`is included`, (definitionProvider) => {
      expect(definitionProvider).not.toBeUndefined();
    });

    definitionProviderScenario(
      `uses the correct document selector`,
      (definitionProvider) => {
        expect(
          definitionProvider.mockedDefinitionProvider.documentSelector
        ).toEqual({
          scheme: `file`,
          language: `skitscript`,
        });
      }
    );

    describe(`provideReferences`, () => {
      definitionProviderScenario(
        `when the document cannot be parsed`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(5, 6) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      definitionProviderScenario(
        `when the cursor is before the first character of an identifier`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(5, 1) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      definitionProviderScenario(
        `when the cursor is after the last character of an identifier`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(5, 22) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toBeNull();
        }
      );

      definitionProviderScenario(
        `when the cursor is on the first character of a declaration`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(5, 2) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is in the middle of a declaration`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(5, 6) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is on the last character of a declaration`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(5, 21) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is on the first character of a reference`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(3, 8) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is in the middle of a reference`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(3, 12) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is on the last character of a reference`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(3, 27) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(5, 2), new Position(5, 22))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is on the first character of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(2, 24) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(2, 24), new Position(2, 44))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is in the middle of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(2, 30) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(2, 24), new Position(2, 44))
            ) as unknown as vscode.Location
          );
        }
      );

      definitionProviderScenario(
        `when the cursor is on the last character of an implicit declaration`,
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
Example Identifier A is Example Identifier B.`
              ),
              new Position(2, 43) as vscode.Position,
              {} as vscode.CancellationToken
            );

          expect(output).toEqual(
            new Location(
              `Example Text Document Uri`,
              new Range(new Position(2, 24), new Position(2, 44))
            ) as unknown as vscode.Location
          );
        }
      );
    });
  });
});
