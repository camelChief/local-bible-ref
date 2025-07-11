import { Plugin } from 'obsidian';
import LocalBibleRefSettingTab from 'src/local-bible-ref-setting-tab';
import { PassageFormat } from 'src/passage-reference';
import { PassageSuggest } from 'src/passage-suggest';
import { LocalBibleRefSettings } from 'src/settings';

export default class LocalBibleRefPlugin extends Plugin {
	settings: LocalBibleRefSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new LocalBibleRefSettingTab(this.app, this));
		this.registerEditorSuggest(new PassageSuggest(this.app, this.settings));
	}

	onunload() {}

	async loadSettings() {
		this.settings = await this.loadData();
		this.settings ??= {
			biblesPath: '',
			defaultVersionShorthand: '',
			defaultPassageFormat: PassageFormat.Callout
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}