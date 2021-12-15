import { identifierIsValid, parse } from "@skitscript/parser-nodejs";
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
} from "vscode";
import { optionalRequire } from "optional-require";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const vscode = optionalRequire(`vscode`);

const documentSelector: DocumentSelector = {
  scheme: `file`,
  language: `skitscript`,
};

const renameProvider: RenameProvider = {
  provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
    token: CancellationToken
  ): ProviderResult<WorkspaceEdit> {
    token;

    newName = newName.trim();

    if (identifierIsValid(newName)) {
      const parsed = parse(document.getText());

      if (parsed.type === `valid`) {
        const line = position.line + 1;
        const column = position.character + 1;

        const identifierInstance = parsed.identifierInstances.find(
          (identifierInstance) =>
            identifierInstance.line === line &&
            identifierInstance.fromColumn <= column &&
            identifierInstance.toColumn >= column
        );

        if (identifierInstance === undefined) {
          return null;
        } else {
          const workspaceEdit = new vscode.WorkspaceEdit();

          for (const otherIdentifierInstance of parsed.identifierInstances) {
            if (
              otherIdentifierInstance.type === identifierInstance.type &&
              otherIdentifierInstance.normalized ===
                identifierInstance.normalized
            ) {
              const line = otherIdentifierInstance.line - 1;

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
              );
            }
          }

          return workspaceEdit;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  },

  prepareRename(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Range | { range: Range; placeholder: string }> {
    token;

    const parsed = parse(document.getText());

    if (parsed.type === `valid`) {
      const line = position.line + 1;
      const column = position.character + 1;

      const identifierInstance = parsed.identifierInstances.find(
        (identifierInstance) =>
          identifierInstance.line === line &&
          identifierInstance.fromColumn <= column &&
          identifierInstance.toColumn >= column
      );

      if (identifierInstance === undefined) {
        return null;
      } else {
        const line = identifierInstance.line - 1;

        return {
          range: new vscode.Range(
            new vscode.Position(line, identifierInstance.fromColumn - 1),
            new vscode.Position(line, identifierInstance.toColumn)
          ),
          placeholder: identifierInstance.verbatim,
        };
      }
    } else {
      return null;
    }
  },
};

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    vscode.Disposable.from(
      vscode.languages.registerRenameProvider(documentSelector, renameProvider)
    )
  );
}
