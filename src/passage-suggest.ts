import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFolder,
} from "obsidian";
import { PassageFormat, PassageReference } from "./passage-reference";
import { LocalBibleRefSettings } from "./settings";

export class PassageSuggest extends EditorSuggest<PassageSuggestion> {
	private settings: LocalBibleRefSettings;

	constructor(app: App, settings: LocalBibleRefSettings) {
		super(app);
		this.settings = settings;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_: any
	): EditorSuggestTriggerInfo | null {
		// min ref length is 6 ('--gen1')
		if (cursor.ch < 6) return null;

		// line must start with '--'
		const line = editor.getLine(cursor.line);
		if (!line.startsWith("--")) return null;

		// must be a passage ref
		const isPassage = PassageReference.regExp.test(line);
		if (!isPassage) return null;

		// trigger info
		return {
			end: cursor,
			query: line,
			start: {
				ch: 0,
				line: cursor.line,
			},
		};
	}

	async getSuggestions(
		context: EditorSuggestContext
	): Promise<PassageSuggestion[]> {
		const passageRef = PassageReference.parse(
			context.query,
			this.settings.defaultVersionShorthand,
			this.settings.defaultPassageFormat,
		);
		if (!passageRef) return [];

		// grab all chapters in the range
		let texts = await this.getChapterTexts(passageRef);
		if (!texts) return [];

		// split first chapter by start verse
		const textFromVerse = this.getTextFromStartVerse(
			texts[0],
			passageRef
		);
		if (!textFromVerse) return [];
		texts[0] = textFromVerse;

		// split last chapter by end verse
		const lastIndex = texts.length - 1;
		const textToVerse = this.getTextToEndVerse(
			texts[lastIndex],
			passageRef
		);
		if (!textToVerse) return [];
		texts[lastIndex] = textToVerse;

		// clean up chapter texts
		const multipleChapters = texts.length > 1;
		texts = texts.map((text, i) => {
			const chapterNumber = passageRef.startChapter + i;
			return this.cleanText(text, chapterNumber, multipleChapters);
		});

		// suggest
        const excerpt = this.generateExcerpt(texts[0]);
		const text = this.formatTexts(texts, passageRef, context);
		return [{ excerpt, text }];
	}

	renderSuggestion(item: PassageSuggestion, el: HTMLElement): void {
		el.innerText = item.excerpt;
	}

	selectSuggestion(
		item: PassageSuggestion,
		_: MouseEvent | KeyboardEvent
	): void {
		if (!this.context) return;
		this.context.editor.replaceRange(
			item.text,
			this.context.start,
			this.context.end
		);
	}

	/** Retrieves the texts of the chapters within a passage ref. */
	private async getChapterTexts(
		ref: PassageReference
	): Promise<string[] | null> {
		let basePath = "";
		for (let alias of [ref.book.name, ...ref.book.aliases]) {
			basePath = [this.settings.biblesPath, ref.version, alias].join("/");

			// if the book exists at this alias, use the alias instead
			// and add the previous book name to the aliases
			if (await this.app.vault.adapter.exists(basePath)) {
				ref.book.aliases.push(ref.book.name);
				ref.book.aliases.remove(alias);
				ref.book.name = alias;
				break;
			}
		}

		const texts: string[] = [];

		// collect chapter texts
		for (let ch = ref.startChapter; ch <= ref.endChapter; ch++) {
			const path = basePath + `/${ref.book.name} ${ch}.md`;
			const file = this.app.vault.getFileByPath(path);
			if (!file) return null;

			texts.push(await this.app.vault.cachedRead(file));
		}

		return texts;
	}

	/** Extracts the text in the chapter from the start verse to the end. */
	private getTextFromStartVerse(
		text: string,
		ref: PassageReference
	): string | null {
		const regExp = new RegExp(
			`(?:[>-] )*(?:\\*\\*\\d{1,3}\\*\\* )?<sup>${ref.startVerse}</sup>`
		);
		const match = text.match(regExp);
		if (!match) return null;

		const verseLabel = match[0];
		const parts = text.split(regExp);
		return verseLabel + parts[1];
	}

	/** Extracts the text in the chapter from the start to the end verse. */
	private getTextToEndVerse(
		text: string,
		ref: PassageReference
	): string | null {
		if (ref.endVerse === -1) return text;
		const regex = new RegExp(
			`(?:^(?:> |- )*)?<sup>${ref.endVerse + 1}</sup>`,
			"m"
		);
		return text.split(regex, 1)[0].trim();
	}

	private cleanText(
		text: string,
		chapterNumber: number,
		multipleChapters: boolean
	): string {
		text = this.removeChapterNumbers(text);
		text = this.removeHeadings(text);
		text = this.removeFootnoteRefs(text);
		text = this.removeBOF(text);
		text = this.removeEOF(text);

		const chapterMd = multipleChapters ? `**${chapterNumber}**` : "";
		if (text.startsWith("> ")) {
			const quoteMd = text.match(/^(?:> )+/)![0];
			return text.replace(quoteMd, `${quoteMd}${chapterMd} `);
		}

		if (text.startsWith("- ")) {
			const listMd = text.match(/^(?:- )+/)![0];
			return text.replace(listMd, `${listMd}${chapterMd} `);
		}

		return (text = `${chapterMd} ${text}`);
	}

	/** Removes chapter numbers from the given text. */
	private removeChapterNumbers(text: string): string {
		return text.replace(/\*\*\d{1,3}\*\* /g, "");
	}

	/** Removes headings from the given text. */
	private removeHeadings(text: string): string {
		return text.replace(/^#.*[\n\r\f]*/gm, "");
	}

	/** Removes footnote refs from the given text. */
	private removeFootnoteRefs(text: string): string {
		return text.replace(/ \[\^\w{1,9}\]/g, "");
	}

	/** Removes the beginning-of-file content from the given text. */
	private removeBOF(text: string): string {
		if (!text.startsWith("---")) return text;
		// split at YAML front matter
		let split = text.split(/^\-\-\-$/m);
		return split[2].trim();
	}

	/** Removes the end-of-file content from the given text. */
	private removeEOF(text: string): string {
		// split at chapter divider
		let split = text.split(/^\-\-\-$/m);
		// split at footnotes
		split = split[0].split(/^\[\^\d+\]:/m, 1);
		return split[0].trim();
	}

	/** Generates an excerpt for the suggestion. */
	private generateExcerpt(text: string): string {
		text = text.split(/<\/sup>/, 2)[1];
		text = text.replace(/(?:<sup>\d+<\/sup>|> |- )/g, "");
		text = text.replace(
			/<span style='font-variant: small-caps;'>Lord<\/span>/g,
			"Lord"
		);
		text = text.replace(/\n/g, " ");
		text = text.replace(/ {2,}/g, " ");
		return text.slice(0, 45) + "...";
	}

    /** Formats the final text for suggestion. */
    private formatTexts(
        texts: string[],
        passageRef: PassageReference,
        context: EditorSuggestContext
    ): string {
        let formatted = "";
		switch (passageRef.format) {
			case PassageFormat.Manuscript:
				formatted = texts.join(" ").trim();
				formatted = formatted.replace(/\n+/g, " ");
				formatted = formatted.replace(/\*\*\d{1,3}\*\*/g, "");
				formatted = formatted.replace(/<sup>\d{1,3}<\/sup> /g, "");
				formatted = formatted.replace(/(?:^[>-] | [>-] )/g, " ");
				formatted = formatted.trim() + "\n\n";
				break;
			case PassageFormat.Paragraph:
				formatted = texts.join("\n\n").trim();
				formatted += "\n\n";
				break;
			case PassageFormat.Quote:
				formatted = "> ";
				formatted += texts.join("\n\n").trim();
				formatted = formatted.replace(/\n/gm, "\n> ");
				formatted += "\n\n";
				break;
			case PassageFormat.Callout:
                const passageReference = passageRef.stringify();
                const passageLink = this.generatePassageLink(passageRef, context);
				formatted = `> [!quote] [${passageReference}](${passageLink})\n`;
				formatted += texts.join("\n\n").trim();
				formatted = formatted.replace(/\n/gm, "\n> ");
				formatted += "\n\n";
				break;
		}

        return formatted;
    }

    /** Generates a link to the passage within the vault. */
	private generatePassageLink(
		ref: PassageReference,
		context: EditorSuggestContext
	): string {
		let link = "";
		let folder: TFolder | null = context.file.parent;
		while (folder?.parent) {
			link += "../";
			folder = folder.parent;
		}

		const { version, book, startChapter } = ref;
		link += `${this.settings.biblesPath}/${version}/` +
			`${book.name}/${book.name} ${startChapter}.md`;
		return link.replace(/ /g, "%20");
	}
}

interface PassageSuggestion {
	excerpt: string;
	text: string;
}
