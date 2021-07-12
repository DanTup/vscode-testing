import * as vs from 'vscode';
import { OneDecorations } from './one';
import { TwoDecorations } from './two';

export function activate(context: vs.ExtensionContext) {
	new OneDecorations(context);
	new TwoDecorations(context);
}

export function deactivate() { }
