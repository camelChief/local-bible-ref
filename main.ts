import { Plugin } from 'obsidian';
import LocalBibleRefSettingTab, {
	BibleFormat,
} from 'src/local-bible-ref-setting-tab';
import { PassageFormat } from 'src/passage-reference';
import PassageSuggest from 'src/passage-suggest';
import LocalBibleRefSettings, {
	CalloutType,
	QuoteReferencePosition,
} from 'src/settings';

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

		const quoteSettings = {
			includeReference: true,
			referencePosition: QuoteReferencePosition.End,
			linkToPassage: true,
		};

		const calloutSettings = {
			type: CalloutType.Quote,
			linkToPassage: true,
			collapsible: true,
		};

		this.settings ??= {
			biblesPath: '',
			defaultVersionShorthand: '',
			defaultPassageFormat: PassageFormat.Callout,
			bibleFormat: BibleFormat.LocalBibleRef,
			quote: quoteSettings,
			callout: calloutSettings,
			fullSuggestion: true
		};

		if (!this.settings.quote) this.settings.quote = quoteSettings;
		if (!this.settings.callout) this.settings.callout = calloutSettings;

		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
