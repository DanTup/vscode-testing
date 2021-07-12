import * as vs from 'vscode';

export class OneDecorations {
	private readonly decorationType = vs.window.createTextEditorDecorationType({
		rangeBehavior: vs.DecorationRangeBehavior.OpenOpen,
	});

	constructor(context: vs.ExtensionContext) {
		context.subscriptions.push(vs.workspace.onDidOpenTextDocument((e) => this.updateIfFile(e)));
		context.subscriptions.push(vs.workspace.onDidChangeTextDocument((e) => this.updateIfFile(e.document), this));
		for (const doc of vs.workspace.textDocuments)
			this.updateIfFile(doc);
	}

	private updateIfFile(doc: vs.TextDocument): void {
		if (!doc.uri.path.endsWith('one.dart'))
			return;

		this.update(doc);
	}

	private async update(doc: vs.TextDocument): Promise<void> {
		const decorations: vs.DecorationOptions[] = [];

		const text = doc.getText();
		const jsonClasses = new RegExp("@json\\nclass \\w+ {\\n(?:  .*\\n)*}", "g");
		const dummyJson = `  Map<String, Object?> toJson() {\n  }\n`;
		let result: RegExpExecArray | null;
		while ((result = jsonClasses.exec(text)) !== null) {
			decorations.push({
				range: new vs.Range(
					doc.positionAt(result.index),
					doc.positionAt(result.index + result[0].length - 1),
				),
				renderOptions: {
					after: {
						contentText: dummyJson,
					},
				},
			});
		}

		const editor = await vs.window.showTextDocument(doc);
		editor.setDecorations(this.decorationType, decorations);
	}
}
