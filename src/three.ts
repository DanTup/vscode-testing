import * as vs from 'vscode';
import * as fs from 'fs';

export class ThreeDecorations {
	private readonly decorationType = vs.window.createTextEditorDecorationType({
		rangeBehavior: vs.DecorationRangeBehavior.OpenOpen,
		// opacity: "0.8",
		backgroundColor: "#333"
	});

	constructor(context: vs.ExtensionContext) {
		context.subscriptions.push(vs.window.onDidChangeActiveTextEditor(this.editorChanged, this));
		context.subscriptions.push(vs.window.onDidChangeTextEditorVisibleRanges(this.syncScrolling, this));
		context.subscriptions.push(vs.workspace.registerTextDocumentContentProvider("dart-gen", new DartGenProvider()));
	}

	private async editorChanged(editor: vs.TextEditor | undefined) {
		if (!editor)
			return;
		// If this file is generated code, open the real file to the left.
		// Otherwise, open the generated code to the right.
		const doc = editor.document;

		const newDoc = doc.uri.scheme === 'dart-gen'
			? await vs.workspace.openTextDocument(doc.uri.with({ scheme: 'file' }))
			: doc.uri.scheme === 'file'
				? await vs.workspace.openTextDocument(doc.uri.with({ scheme: 'dart-gen' }))
				: undefined;

		if (!newDoc)
			return;

		if (doc.uri.scheme === 'file') {
			// Open generated file to side.
			await vs.window.showTextDocument(newDoc, vs.ViewColumn.Beside, true);
		} else {
			// TODO(dantup): Can we do this reliably??
			// // If the normal file is not already open, open it here and then the code gen
			// // to the side.
			// const existingRealEditor = vs.window.visibleTextEditors.find((e) => e.document.uri.toString() === newDoc.uri.toString());
			// if (existingRealEditor)
			// 	return;
			// await vs.window.showTextDocument(newDoc, vs.ViewColumn.Active);
			// await vs.window.showTextDocument(doc, vs.ViewColumn.Beside);
		}
	}

	private async syncScrolling(event: vs.TextEditorVisibleRangesChangeEvent) {
		const thisEditor = event.textEditor;
		const thisDoc = thisEditor.document;

		const expectedOtherEditorUri = thisDoc.uri.scheme === 'dart-gen'
			? thisDoc.uri.with({ scheme: 'file' })
			: thisDoc.uri.scheme === 'file'
				? thisDoc.uri.with({ scheme: 'dart-gen' })
				: undefined;

		// HACK: Avoid recursing back and forth.. need better way.
		if (thisDoc.uri.scheme !== 'file')
			return;

		if (!expectedOtherEditorUri)
			return;

		const otherEditor = vs.window.visibleTextEditors.find((e) => e.document.uri.toString() === expectedOtherEditorUri.toString());
		if (!otherEditor)
			return;

		// Sync top visible lines
		const topVisibleLine = new vs.Range(thisEditor.visibleRanges[0].start, thisEditor.visibleRanges[0].start);
		otherEditor.revealRange(topVisibleLine, vs.TextEditorRevealType.AtTop);
	}
}


class DartGenProvider implements vs.TextDocumentContentProvider {
	private onDidChangeEmitter = new vs.EventEmitter<vs.Uri>();
	public readonly onDidChange = this.onDidChangeEmitter.event;

	constructor() {
		vs.workspace.onDidChangeTextDocument(this.didChangeDocument, this);
	}

	private didChangeDocument(event: vs.TextDocumentChangeEvent) {
		const uri = event.document.uri;
		if (uri.scheme !== 'file')
			return;

		this.onDidChangeEmitter.fire(uri.with({ scheme: 'dart-gen' }));
	}

	public provideTextDocumentContent(uri: vs.Uri, token: vs.CancellationToken): vs.ProviderResult<string> {
		const fileUri = uri.with({ scheme: 'file' });
		const filePath = fileUri.fsPath;
		const existingEditor = vs.window.visibleTextEditors.find((e) => e.document.uri.toString() === fileUri.toString());
		const content = existingEditor?.document?.getText() ?? fs.readFileSync(filePath).toString();

		const jsonClasses = new RegExp("\\n@json\\nclass \\w+ {\\n(?:  .*)*\\n}", "g");
		const generatedContent = content.replace(jsonClasses, (matched, b, c) => {
			return matched.substring(0, matched.length - 1) + "\n  Map<String, Object?> toJson() {\n    // Generated code...\n  }\n}";
		});

		return generatedContent;
	}
}
