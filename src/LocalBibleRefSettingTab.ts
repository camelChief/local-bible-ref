import LocalBibleRefPlugin from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";

export default class LocalBibleRefSettingTab extends PluginSettingTab {
	plugin: LocalBibleRefPlugin;

	constructor(app: App, plugin: LocalBibleRefPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

        this.containerEl.createEl('h1', { text: 'Local Bible Ref' });

        let biblesPathTimeout: NodeJS.Timeout;
        new Setting(containerEl)
			.setName("Bibles Path")
			.setDesc("The path to the folder containing your bibles.")
			.addText(text => text
				.setPlaceholder("e.g. Data/Bibles")
				.onChange(async (value) => {
					this.plugin.settings.biblesPath = value;
					await this.plugin.saveSettings();

                    clearTimeout(biblesPathTimeout);
                    biblesPathTimeout = setTimeout(async () => {
                        const exists = await this.app.vault.adapter.exists(value);
                        if (!exists) new Notice(`Bibles folder doesn't exist at path: ${value}.`);
                    }, 500);
				}));

        let defaultVersionTimeout: NodeJS.Timeout;
        new Setting(containerEl)
            .setName("Default Version Shorthand")
            .setDesc("The version to use by default - shorthand.")
            .addText(text => text
                .setPlaceholder("e.g. ESV")
                .onChange(async (value) => {
                    this.plugin.settings.defaultVersionShorthand = value;
                    await this.plugin.saveSettings();

                    clearTimeout(defaultVersionTimeout);
                    defaultVersionTimeout = setTimeout(async () => {
                        const path = `${this.plugin.settings.biblesPath}/${value}`;
                        const exists = await this.app.vault.adapter.exists(path);
                        if (!exists) new Notice(`Version folder doesn't exist at path: ${path}.`);
                    }, 500);
                }));
	}
}