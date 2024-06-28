import { Plugin } from 'obsidian';
import LocalBibleRefSettingTab from 'src/LocalBibleRefSettingTab';
import { PassageSuggester } from 'src/PassageSuggester';
import { LocalBibleRefSettings } from 'src/config/settings';

export default class LocalBibleRefPlugin extends Plugin {
	settings: LocalBibleRefSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new LocalBibleRefSettingTab(this.app, this));
		this.registerEditorSuggest(new PassageSuggester(this.app, this.settings));
	}

	onunload() {}

	async loadSettings() {
		this.settings = await this.loadData();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}