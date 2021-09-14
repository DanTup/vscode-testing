import * as vs from 'vscode';
import { FourDecorations } from './four';
import { OneDecorations } from './one';
import { ThreeDecorations } from './three';
import { TwoDecorations } from './two';

export function activate(context: vs.ExtensionContext) {
	new OneDecorations(context);
	new TwoDecorations(context);
	new ThreeDecorations(context);
	new FourDecorations(context);
}

export function deactivate() { }
