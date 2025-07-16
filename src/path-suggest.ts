import { AbstractInputSuggest, App } from "obsidian";

export class PathSuggest extends AbstractInputSuggest<string> {
    private textInputEl: HTMLInputElement | HTMLDivElement;

    constructor(app: App, textInputEl: HTMLInputElement | HTMLDivElement) {
        super(app, textInputEl);
        this.textInputEl = textInputEl;
    }

    async getSuggestions(query: string): Promise<string[]> {
        let searchPath = '';
        if (await this.app.vault.adapter.exists(query)) searchPath = query;
        let folders = (await this.app.vault.adapter.list(searchPath)).folders;
        folders = folders.filter(folder => !folder.startsWith('.') && folder.startsWith(query));
        return folders;
    }

    renderSuggestion(item: string, el: HTMLElement): void {
        el.setText(item);
    }

    selectSuggestion(item: string, _: MouseEvent | KeyboardEvent): void {
        this.setValue(item);
        this.textInputEl.dispatchEvent(new Event('input'));
    }
}