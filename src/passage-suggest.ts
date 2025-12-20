import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	normalizePath,
	Notice,
	TFile,
	TFolder,
} from "obsidian";
import { BibleFormat } from "./local-bible-ref-setting-tab";
import PassageReference, { PassageFormat } from "./passage-reference";
import LocalBibleRefSettings, { QuoteReferencePosition } from "./settings";

export default class PassageSuggest extends EditorSuggest<PassageSuggestion> {
	private settings: LocalBibleRefSettings;
	private noSettingsNotice: Notice;

	constructor(app: App, settings: LocalBibleRefSettings) {
		super(app);
		this.settings = settings;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_: TFile | null
	): EditorSuggestTriggerInfo | null {
		// line must start with '--'
		const line = editor.getLine(cursor.line);
		if (!line.startsWith("--")) return null;

		// if no settings, alert user
		if (!this.settings.biblesPath) {
			if (!this.noSettingsNotice?.messageEl.isShown()) {
				const noticeText = "Local Bible Ref settings are not " +
					"configured. Please set the bibles path before " +
					"attempting to reference passages.";
				this.noSettingsNotice = new Notice(noticeText);
			}

			return null;
		}

		// min ref length is 6 ('--gen1')
		if (cursor.ch < 6) return null;

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
		let version = this.settings.defaultVersionShorthand;
		if (!version) {
			const folder = this.app.vault.getFolderByPath(this.settings.biblesPath);
			version = folder?.children?.filter(c => c instanceof TFolder)?.first()?.name ?? '';
		}
		const passageRef = PassageReference.parse(
			context.query,
			version,
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
		el.setText(item.excerpt);
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
		for (const alias of [ref.book.name, ...ref.book.aliases]) {
			basePath = [this.settings.biblesPath, ref.version, alias].join("/");
			basePath = normalizePath(basePath);

			// if the book exists at this alias, use the alias instead
			// and add the previous book name to the aliases
			if (this.app.vault.getFolderByPath(basePath)) {
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
			const file = this.app.vault.getFileByPath(normalizePath(path));
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
		let pattern = '';
		if (this.settings.bibleFormat === BibleFormat.BibleLinker) {
			pattern = `#{1,6} [a-zA-Z]*${ref.startVerse}[a-zA-Z]*\\n\\w+`;
		} else {
			const quoteOrList = '(?:[>-] )*';
			const chapterNum = '(?:\\*\\*\\d{1,3}\\*\\* )?';
			const verseNum = `<sup>${ref.startVerse}</sup>`;
			pattern = quoteOrList + chapterNum + verseNum;
		}
		
		const regExp = new RegExp(pattern);
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

		let pattern = '';
		if (this.settings.bibleFormat === BibleFormat.BibleLinker) {
			pattern = `#{1,6} [a-zA-Z]*${ref.endVerse + 1}[a-zA-Z]*\\n\\w+`;
		} else {
			const quoteOrList = '(?:[>-] )*';
			const verseNum = `<sup>${ref.endVerse + 1}</sup>`;
			pattern = quoteOrList + verseNum;
		}

		const regex = new RegExp(pattern);
		return text.split(regex, 1)[0].trim();
	}

	private cleanText(
		text: string,
		chapterNumber: number,
		multipleChapters: boolean
	): string {
		if (this.settings.bibleFormat === BibleFormat.BibleLinker) {
			text = this.formatBibleLinkerVerses(text);
		}

		text = this.removeChapterNumbers(text);
		text = this.removeHeadings(text);
		text = this.removeFootnoteRefs(text);
		text = this.removeBOF(text);
		text = this.removeEOF(text);

		if (this.settings.bibleFormat === BibleFormat.BibleLinker) {
			text = this.removeVerseSpacing(text);
		}

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

	/** Formats verses that use Bible Linker formatting. */
	private formatBibleLinkerVerses(text: string): string {
		return text.replace(
			/#{1,6} [a-zA-Z]*(\d{1,3})[a-zA-Z]*\n(\w+)/g,
			"<sup>$1</sup> $2",
		);
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
		const split = text.split(/^---$/m);
		return split[2].trim();
	}

	/** Removes the end-of-file content from the given text. */
	private removeEOF(text: string): string {
		// split at chapter divider
		let split = text.split(/^---$/m);
		// split at footnotes
		split = split[0].split(/^\[\^\d+\]:/m, 1);
		return split[0].trim();
	}

	/** Removes extra spacing between verses in Bible Linker formatting. */
	private removeVerseSpacing(text: string): string {
		return text.replace(/\n{2,}/g, " ");
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
			case PassageFormat.Quote: {
				const {
					includeReference,
					referencePosition,
					linkToPassage
				} = this.settings.quote;

				let stringRef = '';
				if (includeReference) {
					if (linkToPassage) stringRef = this.generatePassageLink(passageRef, context);
					else stringRef = passageRef.stringify();
					if (referencePosition === QuoteReferencePosition.Beginning) stringRef += "\n";
					else stringRef = `\n> ${stringRef}`;
				}

				formatted = "> ";
				if (referencePosition === QuoteReferencePosition.Beginning) formatted += stringRef;
				formatted += texts.join("\n\n").trim();
				formatted = formatted.replace(/\n/gm, "\n> ");
				if (referencePosition === QuoteReferencePosition.End) formatted += stringRef;
				formatted += "\n\n";
				break;
			}
			case PassageFormat.Callout: {
				const { type, linkToPassage } = this.settings.callout;

				let stringRef = '';
				if (linkToPassage) stringRef = this.generatePassageLink(passageRef, context);
				else stringRef = passageRef.stringify();

				formatted = `> [!${type}] ${stringRef}\n`;
				formatted += texts.join("\n\n").trim();
				formatted = formatted.replace(/\n/gm, "\n> ");
				formatted += "\n\n";
				break;
			}
		}

		return formatted;
	}

    /** Generates a link to the passage within the vault. */
	private generatePassageLink(
		ref: PassageReference,
		context: EditorSuggestContext
	): string {
		const { version, book, startChapter, startVerse } = ref;
		const path = `${this.settings.biblesPath}/${version}/${book.name}/${book.name} ${startChapter}.md`;
		const file = this.app.vault.getFileByPath(normalizePath(path));
		if (!file) return ref.stringify();

		return this.app.fileManager.generateMarkdownLink(
			file,
			context.file.path,
			this.settings.bibleFormat === BibleFormat.BibleLinker
				? `#${startVerse}`
				: undefined,
			ref.stringify(),
		);
	}
}

interface PassageSuggestion {
	excerpt: string;
	text: string;
}
