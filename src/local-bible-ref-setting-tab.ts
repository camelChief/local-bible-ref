import LocalBibleRefPlugin from 'main';
import {
	App,
	normalizePath,
	Notice,
	PluginSettingTab,
	Setting,
	TextComponent,
} from 'obsidian';
import { PassageFormat } from './passage-reference';
import PathSuggest from './path-suggest';
import { CalloutType, QuoteReferencePosition } from './settings';
import VersionSuggest from './version-suggest';

export default class LocalBibleRefSettingTab extends PluginSettingTab {
	private plugin: LocalBibleRefPlugin;

	constructor(app: App, plugin: LocalBibleRefPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Required Settings').setHeading();

		let biblesPathTimeout: number;
		new Setting(containerEl)
			.setName('Bibles path')
			.setDesc('The path to the folder containing your bibles.')
			.addText((text) => {
				text
					.setPlaceholder('e.g. Data/Bibles')
					.setValue(this.plugin.settings.biblesPath)
					.onChange(async (value) => {
						// toggle visibility of default version setting
						if (value) {
							defaultVersionSetting.settingEl.removeClass(
								'local-bible-ref-hidden'
							);
						} else {
							defaultVersionSetting.settingEl.addClass(
								'local-bible-ref-hidden'
							);
							(
								defaultVersionSetting.components[0] as TextComponent
							).inputEl.value = '';
							this.plugin.settings.defaultVersionShorthand = '';
						}

						const path = value ? normalizePath(value) : '';
						this.plugin.settings.biblesPath = path;
						await this.plugin.saveSettings();

						clearTimeout(biblesPathTimeout);
						biblesPathTimeout = window.setTimeout(async () => {
							if (!path) return;
							const exists = this.app.vault.getFolderByPath(path);
							if (!exists) new Notice(`Folder doesn't exist at path: ${path}.`);
						}, 1000);
					});

				new PathSuggest(this.app, text.inputEl);
			});

		new Setting(containerEl).setName('Optional Settings').setHeading();

		let defaultVersionTimeout: number;
		const defaultVersionSetting = new Setting(containerEl)
			.setName('Default version')
			.setDesc(
				'The version to use by default - shorthand. This should correspond to a folder in the bibles folder selected above.'
			)
			.addText((text) => {
				text
					.setPlaceholder('e.g. NIV')
					.setValue(this.plugin.settings.defaultVersionShorthand)
					.onChange(async (value) => {
						this.plugin.settings.defaultVersionShorthand = value;
						await this.plugin.saveSettings();

						clearTimeout(defaultVersionTimeout);
						defaultVersionTimeout = window.setTimeout(async () => {
							const path = `${this.plugin.settings.biblesPath}/${value}`;
							const exists = this.app.vault.getFolderByPath(
								normalizePath(path)
							);
							if (!exists) new Notice(`Folder doesn't exist at path: ${path}.`);
						}, 1000);
					});

				new VersionSuggest(this.app, text.inputEl, this.plugin.settings);
			});

		if (this.plugin.settings.biblesPath) {
			defaultVersionSetting.settingEl.removeClass('local-bible-ref-hidden');
		} else {
			defaultVersionSetting.settingEl.addClass('local-bible-ref-hidden');
		}

		new Setting(containerEl)
			.setName('Default passage format')
			.setDesc('The markdown format to use for passages by default.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						manuscript: 'Manuscript',
						paragraph: 'Paragraph',
						quote: 'Quote',
						callout: 'Callout',
					})
					.setValue(this.plugin.settings.defaultPassageFormat)
					.onChange(async (value) => {
						this.plugin.settings.defaultPassageFormat = value as PassageFormat;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Bible Format')
			.setDesc(
				'The formatting style you use for your vault bibles. Local Bible Ref relies on this to parse passages correctly.'
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						localBibleRef: 'Local Bible Ref',
						bibleLinker: 'Bible Linker',
					})
					.setValue(this.plugin.settings.bibleFormat)
					.onChange(async (value) => {
						this.plugin.settings.bibleFormat = value as BibleFormat;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Quote Format Settings')
			.setDesc('Settings for the quote passage format.')
			.setHeading();

		new Setting(containerEl)
			.setName('Include reference')
			.setDesc('Whether to include a reference to the passage.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.quote.includeReference)
					.onChange(async (value) => {
						// toggle visibility of other paragraph reference settings
						if (value) {
							quoteRefPositionSetting.settingEl.removeClass(
								'local-bible-ref-hidden'
							);
							quoteRefLinkSetting.settingEl.removeClass(
								'local-bible-ref-hidden'
							);
						} else {
							quoteRefPositionSetting.settingEl.addClass(
								'local-bible-ref-hidden'
							);
							quoteRefLinkSetting.settingEl.addClass('local-bible-ref-hidden');
						}

						this.plugin.settings.quote.includeReference = value;
						await this.plugin.saveSettings();
					})
			);

		const quoteRefPositionSetting = new Setting(containerEl)
			.setName('Reference position')
			.setDesc('Where to position the reference.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						beginning: 'Beginning',
						end: 'End',
					})
					.setValue(this.plugin.settings.quote.referencePosition)
					.onChange(async (value) => {
						this.plugin.settings.quote.referencePosition =
							value as QuoteReferencePosition;
						await this.plugin.saveSettings();
					})
			);

		const quoteRefLinkSetting = new Setting(containerEl)
			.setName('Link to passage')
			.setDesc('Whether the reference should link to the passage in the Bible.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.quote.linkToPassage)
					.onChange(async (value) => {
						this.plugin.settings.quote.linkToPassage = value;
						await this.plugin.saveSettings();
					})
			);

		if (this.plugin.settings.quote.includeReference) {
			quoteRefPositionSetting.settingEl.removeClass('local-bible-ref-hidden');
			quoteRefLinkSetting.settingEl.removeClass('local-bible-ref-hidden');
		} else {
			quoteRefPositionSetting.settingEl.addClass('local-bible-ref-hidden');
			quoteRefLinkSetting.settingEl.addClass('local-bible-ref-hidden');
		}

		new Setting(containerEl)
			.setName('Callout Format Settings')
			.setDesc('Settings for the callout passage format.')
			.setHeading();

		new Setting(containerEl)
			.setName('Callout type')
			.setDesc('The type of callout to use for passages.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						note: 'Note',
						abstract: 'Abstract',
						info: 'Info',
						todo: 'Todo',
						tip: 'Tip',
						success: 'Success',
						question: 'Question',
						warning: 'Warning',
						failure: 'Failure',
						danger: 'Danger',
						bug: 'Bug',
						example: 'Example',
						quote: 'Quote',
					})
					.setValue(this.plugin.settings.callout.type)
					.onChange(async (value) => {
						this.plugin.settings.callout.type = value as CalloutType;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Link to passage')
			.setDesc('Whether the reference should link to the passage in the Bible.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.callout.linkToPassage)
					.onChange(async (value) => {
						this.plugin.settings.callout.linkToPassage = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

export enum BibleFormat {
	LocalBibleRef = 'localBibleRef',
	BibleLinker = 'bibleLinker',
}
