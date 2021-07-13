import * as vs from 'vscode';
import { OneDecorations } from './one';
import { ThreeDecorations } from './three';
import { TwoDecorations } from './two';

export function activate(context: vs.ExtensionContext) {
	new OneDecorations(context);
	new TwoDecorations(context);
	new ThreeDecorations(context);
}

export function deactivate() { }
