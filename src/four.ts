import * as vs from 'vscode';

export class FourDecorations {
	constructor(context: vs.ExtensionContext) {

		context.subscriptions.push(vs.languages.registerCodeLensProvider({ language: "dart" }, this));
	}

	provideCodeLenses(doc: vs.TextDocument, token: vs.CancellationToken): vs.ProviderResult<vs.CodeLens[]> {
		const lenses: vs.CodeLens[] = [];

		const text = doc.getText();
		const jsonClasses = new RegExp("(@json\\nclass \\w+ {\\n)", "g");
		let result: RegExpExecArray | null;
		while ((result = jsonClasses.exec(text)) !== null) {
			lenses.push(
				new vs.CodeLens(
					new vs.Range(
						doc.positionAt(result.index + result[0].length),
						doc.positionAt(result.index + result[0].length),
					),
					{
						title: "(generated code)",
						command: "foo",
						tooltip: "Click to go to navigate to generated code"
					},
				)
			);
		}

		return lenses;
	}
}
