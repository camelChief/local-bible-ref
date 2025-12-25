import { AbstractInputSuggest, App, TFolder } from 'obsidian';
import LocalBibleRefSettings from './settings';

export default class VersionSuggest extends AbstractInputSuggest<string> {
	private settings: LocalBibleRefSettings;
	private textInputEl: HTMLInputElement | HTMLDivElement;

	constructor(
		app: App,
		textInputEl: HTMLInputElement | HTMLDivElement,
		settings: LocalBibleRefSettings
	) {
		super(app, textInputEl);
		this.textInputEl = textInputEl;
		this.settings = settings;
	}

	async getSuggestions(): Promise<string[]> {
		const folder = this.app.vault.getFolderByPath(this.settings.biblesPath);
		if (!folder) return [];
		return folder.children
			.filter((c) => c instanceof TFolder)
			.map((f) => f.name);
	}

	renderSuggestion(item: string, el: HTMLElement): void {
		el.setText(item);
	}

	selectSuggestion(item: string, _: MouseEvent | KeyboardEvent): void {
		this.setValue(item);
		this.textInputEl.dispatchEvent(new Event('input'));
	}
}
