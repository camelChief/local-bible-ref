import LocalBibleRefPlugin from 'main';
import { App, normalizePath, Notice, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { PassageFormat } from './passage-reference';
import { PathSuggest } from './path-suggest';
import { VersionSuggest } from './version-suggest';

export default class LocalBibleRefSettingTab extends PluginSettingTab {
	private plugin: LocalBibleRefPlugin;

	constructor(app: App, plugin: LocalBibleRefPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

        new Setting(containerEl)
            .setName('Configurations')
            .setHeading();

        let biblesPathTimeout: number;
        new Setting(containerEl)
			.setName('Bibles path')
			.setDesc('The path to the folder containing your bibles.')
			.addText(text => {
                text.setPlaceholder('e.g. Data/Bibles')
                    .setValue(this.plugin.settings.biblesPath)
                    .onChange(async (value) => {
                        // toggle visibility of default version setting
                        if (value) {
                            defaultVersionSetting.settingEl.removeClass('local-bible-ref-hidden');
                        } else {
                            defaultVersionSetting.settingEl.addClass('local-bible-ref-hidden');
                            (defaultVersionSetting.components[0] as TextComponent).inputEl.value = '';
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

        new Setting(containerEl)
            .setName('Defaults')
            .setHeading();

        let defaultVersionTimeout: number;
        const defaultVersionSetting = new Setting(containerEl)
            .setName('Default version shorthand')
            .setDesc('The version to use by default - shorthand. This should correspond to a folder in the bibles folder selected above.')
            .addText(text => {
                text.setPlaceholder('e.g. NIV')
                    .setValue(this.plugin.settings.defaultVersionShorthand)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultVersionShorthand = value;
                        await this.plugin.saveSettings();

                        clearTimeout(defaultVersionTimeout);
                        defaultVersionTimeout = window.setTimeout(async () => {
                            const path = `${this.plugin.settings.biblesPath}/${value}`;
                            const exists = this.app.vault.getFolderByPath(normalizePath(path));
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
            .addDropdown(dropdown => dropdown
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
                }));

        new Setting(containerEl)
            .setName('Bible Format')
            .setDesc('The formatting style you use for your vault bibles. Local Bible Ref relies on this to parse passages correctly.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    localBibleRef: 'Local Bible Ref',
                    bibleLinker: 'Bible Linker',
                })
                .setValue(this.plugin.settings.bibleFormat)
                .onChange(async (value) => {
                    this.plugin.settings.bibleFormat = value as BibleFormat;
                    await this.plugin.saveSettings();
                }));
	}
}

export enum BibleFormat {
    LocalBibleRef = 'localBibleRef',
    BibleLinker = 'bibleLinker',
}