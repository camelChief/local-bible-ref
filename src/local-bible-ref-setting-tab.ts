import LocalBibleRefPlugin from 'main';
import {
	App,
	getLanguage,
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
import { SettingsLabels } from './i18n/models';
import { I18N } from './i18n';

export default class LocalBibleRefSettingTab extends PluginSettingTab {
	private readonly hiddenClass = 'local-bible-ref-hidden';

	private plugin: LocalBibleRefPlugin;
	private folderDoesNotExistText = '';
	private settingsLabels: SettingsLabels;

	constructor(app: App, plugin: LocalBibleRefPlugin) {
		super(app, plugin);
		this.plugin = plugin;

		switch (getLanguage()) {
			case 'de':
				this.folderDoesNotExistText = I18N.DE.COMMON.folderDoesNotExist;
				this.settingsLabels = I18N.DE.SETTINGS;
				break;
			case 'ko':
				this.folderDoesNotExistText = I18N.KO.COMMON.folderDoesNotExist;
				this.settingsLabels = I18N.KO.SETTINGS;
				break;
			case 'en':
			default:
				this.folderDoesNotExistText = I18N.EN.COMMON.folderDoesNotExist;
				this.settingsLabels = I18N.EN.SETTINGS;
				break;
		}
	}

	display(): void {
		const { containerEl } = this;
		const { required, optional, quoteFormat, calloutFormat, issues } =
			this.settingsLabels;
		containerEl.empty();

		new Setting(containerEl).setName(required.name).setHeading();

		let biblesPathTimeout: number;
		new Setting(containerEl)
			.setName(required.controls.biblesPath.name)
			.setDesc(required.controls.biblesPath.description)
			.addText((text) => {
				text
					.setPlaceholder(required.controls.biblesPath.placeholder)
					.setValue(this.plugin.settings.biblesPath)
					.onChange(async (value) => {
						// toggle visibility of default version setting
						if (value) {
							defaultVersionSetting.settingEl.removeClass(this.hiddenClass);
						} else {
							defaultVersionSetting.settingEl.addClass(this.hiddenClass);
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
							if (!exists)
								new Notice(`${this.folderDoesNotExistText} ${path}.`);
						}, 1000);
					});

				new PathSuggest(this.app, text.inputEl);
			});


		// optional settings ---
		new Setting(containerEl).setName(optional.name).setHeading();

		let defaultVersionTimeout: number;
		const defaultVersionSetting = new Setting(containerEl)
			.setName(optional.controls.defaultVersion.name)
			.setDesc(optional.controls.defaultVersion.description)
			.addText((text) => {
				text
					.setPlaceholder(optional.controls.defaultVersion.placeholder)
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
							if (!exists)
								new Notice(`${this.folderDoesNotExistText} ${path}.`);
						}, 1000);
					});

				new VersionSuggest(this.app, text.inputEl, this.plugin.settings);
			});

		if (this.plugin.settings.biblesPath) {
			defaultVersionSetting.settingEl.removeClass(this.hiddenClass);
		} else {
			defaultVersionSetting.settingEl.addClass(this.hiddenClass);
		}

		new Setting(containerEl)
			.setName(optional.controls.defaultPassageFormat.name)
			.setDesc(optional.controls.defaultPassageFormat.description)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(optional.controls.defaultPassageFormat.options)
					.setValue(this.plugin.settings.defaultPassageFormat)
					.onChange(async (value) => {
						this.plugin.settings.defaultPassageFormat = value as PassageFormat;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(optional.controls.bibleFormat.name)
			.setDesc(optional.controls.bibleFormat.description)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						[BibleFormat.LocalBibleRef]: 'Local Bible Ref',
						[BibleFormat.BibleLinker]: 'Bible Linker',
					})
					.setValue(this.plugin.settings.bibleFormat)
					.onChange(async (value) => {
						this.plugin.settings.bibleFormat = value as BibleFormat;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(optional.controls.fullPreview.name)
			.setDesc(optional.controls.fullPreview.description)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.fullPreview)
					.onChange(async (value) => {
						this.plugin.settings.fullPreview = value;
						await this.plugin.saveSettings();
					})
			);


		// quote format settings ---
		new Setting(containerEl)
			.setName(quoteFormat.name)
			.setDesc(quoteFormat.description)
			.setHeading();

		new Setting(containerEl)
			.setName(quoteFormat.controls.includeReference.name)
			.setDesc(quoteFormat.controls.includeReference.description)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.quote.includeReference)
					.onChange(async (value) => {
						// toggle visibility of other paragraph reference settings
						if (value) {
							quoteRefPositionSetting.settingEl.removeClass(this.hiddenClass);
							quoteRefLinkSetting.settingEl.removeClass(this.hiddenClass);
						} else {
							quoteRefPositionSetting.settingEl.addClass(this.hiddenClass);
							quoteRefLinkSetting.settingEl.addClass(this.hiddenClass);
						}

						this.plugin.settings.quote.includeReference = value;
						await this.plugin.saveSettings();
					})
			);

		const quoteRefPositionSetting = new Setting(containerEl)
			.setName(quoteFormat.controls.referencePosition.name)
			.setDesc(quoteFormat.controls.referencePosition.description)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(quoteFormat.controls.referencePosition.options)
					.setValue(this.plugin.settings.quote.referencePosition)
					.onChange(async (value) => {
						this.plugin.settings.quote.referencePosition =
							value as QuoteReferencePosition;
						await this.plugin.saveSettings();
					})
			);

		const quoteRefLinkSetting = new Setting(containerEl)
			.setName(quoteFormat.controls.linkToPassage.name)
			.setDesc(quoteFormat.controls.linkToPassage.description)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.quote.linkToPassage)
					.onChange(async (value) => {
						this.plugin.settings.quote.linkToPassage = value;
						await this.plugin.saveSettings();
					})
			);

		if (this.plugin.settings.quote.includeReference) {
			quoteRefPositionSetting.settingEl.removeClass(this.hiddenClass);
			quoteRefLinkSetting.settingEl.removeClass(this.hiddenClass);
		} else {
			quoteRefPositionSetting.settingEl.addClass(this.hiddenClass);
			quoteRefLinkSetting.settingEl.addClass(this.hiddenClass);
		}


		// callout format settings ---
		new Setting(containerEl)
			.setName(calloutFormat.name)
			.setDesc(calloutFormat.description)
			.setHeading();

		new Setting(containerEl)
			.setName(calloutFormat.controls.calloutType.name)
			.setDesc(calloutFormat.controls.calloutType.description)
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
			.setName(calloutFormat.controls.linkToPassage.name)
			.setDesc(calloutFormat.controls.linkToPassage.description)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.callout.linkToPassage)
					.onChange(async (value) => {
						this.plugin.settings.callout.linkToPassage = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(calloutFormat.controls.collapsible.name)
			.setDesc(calloutFormat.controls.collapsible.description)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.callout.collapsible)
					.onChange(async (value) => {
						this.plugin.settings.callout.collapsible = value;
						await this.plugin.saveSettings();
					})
			);

		const issuesLink = document.createElement('a');
		issuesLink.href = 'https://github.com/camelChief/local-bible-ref/issues';
		issuesLink.textContent = issues.link;

		const issuesNote = new Setting(containerEl)
			.setDesc(issues.before)
			.setHeading().descEl;
		issuesNote.append(issuesLink);
		issuesNote.append(issues.after ?? '');
	}
}

export enum BibleFormat {
	LocalBibleRef = 'localBibleRef',
	BibleLinker = 'bibleLinker',
}
