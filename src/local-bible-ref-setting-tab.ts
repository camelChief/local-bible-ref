import LocalBibleRefPlugin from 'main';
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { PassageFormat } from './passage-reference';
import { PathSuggest } from './path-suggest';

export default class LocalBibleRefSettingTab extends PluginSettingTab {
	private plugin: LocalBibleRefPlugin;

	constructor(app: App, plugin: LocalBibleRefPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

        let biblesPathTimeout: NodeJS.Timeout;
        new Setting(containerEl)
			.setName('Bibles Path')
			.setDesc('The path to the folder containing your bibles.')
			.addText(text => {
                text.setPlaceholder('e.g. Data/Bibles')
                    .setValue(this.plugin.settings.biblesPath)
                    .onChange(async (value) => {
                        this.plugin.settings.biblesPath = value;
                        await this.plugin.saveSettings();

                        clearTimeout(biblesPathTimeout);
                        biblesPathTimeout = setTimeout(async () => {
                            const exists = await this.app.vault.adapter.exists(value);
                            if (!exists) new Notice(`Bibles folder doesn't exist at path: ${value}.`);
                        }, 1000);
                    });
                
                new PathSuggest(this.app, text.inputEl);
            });

        let defaultVersionTimeout: NodeJS.Timeout;
        new Setting(containerEl)
            .setName('Default Version Shorthand')
            .setDesc('The version to use by default - shorthand.')
            .addText(text => text
                .setPlaceholder('e.g. NIV')
                .setValue(this.plugin.settings.defaultVersionShorthand)
                .onChange(async (value) => {
                    this.plugin.settings.defaultVersionShorthand = value;
                    await this.plugin.saveSettings();

                    clearTimeout(defaultVersionTimeout);
                    defaultVersionTimeout = setTimeout(async () => {
                        const path = `${this.plugin.settings.biblesPath}/${value}`;
                        const exists = await this.app.vault.adapter.exists(path);
                        if (!exists) new Notice(`Version folder doesn't exist at path: ${path}.`);
                    }, 1000);
                }));

        new Setting(containerEl)
            .setName('Default Passage Format')
            .setDesc('The markdown format to use for passages by default.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    paragraph: 'Paragraph',
                    quote: 'Quote',
                    callout: 'Callout',
                })
                .setValue(this.plugin.settings.defaultPassageFormat)
                .onChange(async (value) => {
                    this.plugin.settings.defaultPassageFormat = value as PassageFormat;
                    await this.plugin.saveSettings();
                }));
	}
}