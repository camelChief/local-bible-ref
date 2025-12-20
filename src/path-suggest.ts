import { AbstractInputSuggest, App, TFolder } from "obsidian";

export default class PathSuggest extends AbstractInputSuggest<string> {
    private textInputEl: HTMLInputElement | HTMLDivElement;

    constructor(app: App, textInputEl: HTMLInputElement | HTMLDivElement) {
        super(app, textInputEl);
        this.textInputEl = textInputEl;
    }

    async getSuggestions(query: string): Promise<string[]> {
        query ||= '/';
        const folder = this.app.vault.getFolderByPath(query);
        if (!folder) return [];
        return folder.children
            .filter(c => c instanceof TFolder)
            .map(f => f.path);
    }

    renderSuggestion(item: string, el: HTMLElement): void {
        el.setText(item);
    }

    selectSuggestion(item: string, _: MouseEvent | KeyboardEvent): void {
        this.setValue(item);
        this.textInputEl.dispatchEvent(new Event('input'));
    }
}