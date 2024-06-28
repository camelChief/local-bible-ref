import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    Notice,
    TFile
} from "obsidian";
import { BOOKS, Book } from "./data/books";
import { LocalBibleRefSettings } from "./config/settings";

interface ChapterReference {
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
}

interface PassageReference extends ChapterReference {
    book: Book;
}

interface PassageSuggestion {
    passageRef: string;
    suggestText: string;
    fullText: string;
}

export class PassageSuggester extends EditorSuggest<PassageSuggestion> {
    private settings: LocalBibleRefSettings;
    private passageRegex: RegExp;

    constructor(app: App, settings: LocalBibleRefSettings) {
        super(app);
        this.settings = settings;

        // builds the book matching regex
        let regexString = BOOKS.reduce((string, book) => {
            return `${string}${book.name}|${book.aliases.join("|")}|`;
        }, "^\\-\\- ?(");
        regexString = regexString.slice(0, -1);
        regexString += ") ?(\\d{1,3}(?::\\d{1,3})?(?: ?\\- ?\\d{1,3}(?::\\d{1,3})?)?)$";
        this.passageRegex = new RegExp(regexString, "i");
    }

    onTrigger(cursor: EditorPosition, editor: Editor, _: TFile | null) {
        // min ref length is 6 ("--gen1")
        if (cursor.ch < 6) return null;

        // line must start with "--"
        const line = editor.getLine(cursor.line);
        if (!line.startsWith("--")) return null;

        // must be a passage ref
        const isPassage = this.passageRegex.test(line);
        if (!isPassage) return null;

        // trigger info
        return { end: cursor, query: line, start: { ch: 0, line: cursor.line } };
    }

    async getSuggestions(context: EditorSuggestContext): Promise<PassageSuggestion[]> {
        const passageRef = this.parsePassageRef(context.query);
        if (!passageRef) return [];
        
        // grab all chapters in the range
        let chapterTexts = await this.getChapterTexts(passageRef);
        console.log(passageRef);
        console.log(BOOKS);
        if (!chapterTexts) return [];

        // split first chapter by start verse
        const chapterFromVerse = this.getChapterFromStartVerse(chapterTexts[0], passageRef);
        if (!chapterFromVerse) return [];
        chapterTexts[0] = chapterFromVerse;

        // split last chapter by end verse
        const lastIndex = chapterTexts.length - 1;
        const chapterToVerse = this.getChapterToEndVerse(chapterTexts[lastIndex], passageRef);
        if (!chapterToVerse) return [];
        chapterTexts[lastIndex] = chapterToVerse;

        // clean up chapter texts
        chapterTexts = chapterTexts.map((text, i) => {
            text = this.removeHeadings(text);
            text = this.removeFootnoteRefs(text);
            text = this.removeEOF(text);

            const chapter = passageRef.startChapter + i;
            if (text.startsWith("> ")) {
                const quoteMd = text.match(/^(?:> )+/)![0];
                return text.replace(quoteMd, `${quoteMd}**${chapter}.** `);
            }

            if (text.startsWith("- ")) {
                const listMd = text.match(/^(?:- )+/)![0];
                return text.replace(listMd, `${listMd}**${chapter}.** `);
            }
            
            return text = `**${chapter}.** ${text}`;
        });

        // suggest
        return [{
            passageRef: this.encodePassageRef(passageRef),
            suggestText: this.generateSuggestText(chapterTexts[0]),
            fullText: chapterTexts.join("\n\n")
        }];
    }

    renderSuggestion(item: PassageSuggestion, el: HTMLElement): void {
        el.innerText = item.suggestText;
    }

    selectSuggestion(item: PassageSuggestion, _: MouseEvent | KeyboardEvent): void {
        if (!this.context) return;
        let text = item.fullText.replace(/\n/gm, "\n> ");
        text = `> [!bible]+ ${item.passageRef}\n> ${text}`;
        this.context.editor.replaceRange(text, this.context.start, this.context.end);
    }

    /**
     * Parses a passage reference from the given text.
     * 
     * @param text the text to parse.
     * @returns a parsed PassageReference or null.
     */
    private parsePassageRef(text: string): PassageReference | null {
        const passageRefMatch = text.match(this.passageRegex);
        if (!passageRefMatch) return null;

        let chapterRef = this.parseMultiChapterRef(passageRefMatch[2]);
        if (!chapterRef) chapterRef = this.parseMultiPartChapterRef(passageRefMatch[2]);
        if (!chapterRef) chapterRef = this.parsePartChapterRef(passageRefMatch[2]);
        if (!chapterRef) return null;

        const book = this.getBook(passageRefMatch[1]);
        if (!book) return null;

        return { book, ...chapterRef };
    }

    /**
     * Parses a multi-chapter reference from the given text.
     * Reference is in the format: `startChapter[ - endChapter]`.
     * 
     * @param text the text to parse.
     * @returns a parsed ChapterReference or null.
     */
    private parseMultiChapterRef(text: string): ChapterReference | null {
        const regex = /^(\d{1,3})(?: ?- ?(\d{1,3}))?$/i;
        const match = text.match(regex);
        if (!match) return null;

        const startChapter = parseInt(match[1]);
        return {
            startChapter,
            startVerse: 1,
            endChapter: match[2] ? parseInt(match[2]) : startChapter,
            endVerse: -1,
        };
    }

    /**
     * Parses a multi-(part)-chapter reference from the given text.
     * Reference is in the format: `startChapter:startVerse - endChapter:endVerse`.
     * 
     * @param text the text to parse.
     * @returns a parsed ChapterReference or null.
     */
    private parseMultiPartChapterRef(text: string): ChapterReference | null {
        const regex = /^(\d{1,3}):(\d{1,3}) ?- ?(\d{1,3}):(\d{1,3})$/i;
        const match = text.match(regex);
        if (!match) return null;

        return {
            startChapter: parseInt(match[1]),
            startVerse: parseInt(match[2]),
            endChapter: parseInt(match[3]),
            endVerse: parseInt(match[4]),
        };
    }

    /**
     * Parses a part-chapter reference from the given text.
     * Reference is in the format: `startChapter:startVerse[-endVerse]`.
     * 
     * @param text the text to parse.
     * @returns a parsed ChapterReference or null.
     */
    private parsePartChapterRef(text: string): ChapterReference | null {
        const regex = /^(\d{1,3}):(\d{1,3})(?: ?- ?(\d{1,3}))?$/i;
        const match = text.match(regex);
        if (!match) return null;

        const startChapter = parseInt(match[1]);
        const startVerse = parseInt(match[2]);
        return {
            startChapter,
            startVerse,
            endChapter: startChapter,
            endVerse: match[3] ? parseInt(match[3]) : startVerse,
        };
    }

    /**
     * Retrieves a book based on it's alias.
     * @param alias the alias of the book.
     * @returns the book object if found, otherwise undefined.
     */
    private getBook(alias: string): Book | undefined {
        alias = alias.toLowerCase();
        return BOOKS.find((book) => {
            if (book.name.toLowerCase() === alias) return book;
            if (book.aliases.includes(alias)) return book;
        })
    }

    /**
     * Retrieves the texts of the chapters within the specified passage reference.
     * 
     * @param ref the passage reference.
     * @returns a promise - an array of chapter texts or null.
     */
    private async getChapterTexts(ref: PassageReference): Promise<string[] | null> {
        let basePath = "";
        for (let alias of [ref.book.name, ...ref.book.aliases]) {
            console.log(alias);
            basePath = [
                this.settings.biblesPath,
                this.settings.defaultVersionShorthand,
                alias
            ].join("/");
            console.log(basePath);
            if (await this.app.vault.adapter.exists(basePath)) {
                ref.book.aliases.push(ref.book.name);
                ref.book.aliases.remove(alias);
                ref.book.name = alias;
                console.log(ref);
                break;
            }
        }

        const chapterTexts: string[] = [];

        for (let ch = ref.startChapter; ch <= ref.endChapter; ch++) {
            const path = basePath + `/${ref.book.name} ${ch}.md`;
            const file = this.app.vault.getFileByPath(path);

            if (!file) {
                new Notice(`Could not find chapter at: ${path}`);
                return null;
            }

            chapterTexts.push(await this.app.vault.cachedRead(file));
        }

        return chapterTexts;
    }

    /**
     * Retrieves the text in the chapter from the start verse to the end.
     * 
     * @param text the text to cut.
     * @param ref the passage reference.
     * @returns the text from the start verse or null.
     */
    private getChapterFromStartVerse(text: string, ref: PassageReference): string | null {
        const regex = new RegExp(`(?:> |- )*<sup>${ref.startVerse}</sup>`);
        const match = text.match(regex);
        if (!match) {
            const verse = ref.startVerse;
            const chapter = ref.startChapter;
            const book = ref.book.name;
            new Notice(`Could not find verse ${verse} in ${book} ${chapter}.`);
            return null;
        }

        const verseLabel = match[0];
        const parts = text.split(regex);
        return verseLabel + parts[1];
    };
    
    /**
     * Retrieves the text in the chapter from the start to the end verse.
     * 
     * @param text the text to cut.
     * @param ref the passage reference.
     * @returns the text up to the end verse or null.
     */
    private getChapterToEndVerse(text: string, ref: PassageReference): string | null {
        if (ref.endVerse === -1) return text;

        const regex = new RegExp(`(?:^(?:> |- )*)?<sup>${ref.endVerse + 1}</sup>`, "m");
        return text.split(regex, 1)[0].trim();
    };

    /** Removes headings from the given text. */
    private removeHeadings(text: string): string {
        return text.replace(/^#.*[\n\r\f]*/gm, "");
    }

    /** Removes footnote refs from the given text. */
    private removeFootnoteRefs(text: string): string {
        return text.replace(/ \[\^\d{1,4}\]/g, "");
    }

    /** Removes the end-of-file content from the given text. */
    private removeEOF(text: string): string {
        // split at chapter divider
        let split = text.split(/^\-\-\-$/m);
        // split at footnotes
        split = split[0].split(/^\[\^\d+\]:/m, 1);
        return split[0].trim();
    }

    /** Generates suggestion text. */
    private generateSuggestText(text: string): string {
        text = text.split(/<\/sup>/, 2)[1];
        text = text.replace(/(?:<sup>\d+<\/sup>|> |- )/g, "");
        text = text.replace(/<span style="font-variant: small-caps;">Lord<\/span>/g, "Lord");
        text = text.replace(/\n/g, " ");
        text = text.replace(/  /g, " ");
        return text.slice(0, 45) + "...";
    }

    /**
     * Encodes a PassageReference into a string representation.
     * 
     * @param ref the PassageReference to encode.
     * @returns the encoded string representation.
     */
    private encodePassageRef(ref: PassageReference): string {
        // whole chapter/s ref
        if (ref.startVerse === 1 && ref.endVerse === -1) {
            if (ref.startChapter === ref.endChapter) {
                return `${ref.book.name} ${ref.startChapter}`;
            }
            return `${ref.book.name} ${ref.startChapter}-${ref.endChapter}`;
        }

        // part chapter ref
        if (ref.startChapter === ref.endChapter) {
            if (ref.startVerse === ref.endVerse) {
                return `${ref.book.name} ${ref.startChapter}:${ref.startVerse}`;
            }
            return `${ref.book.name} ${ref.startChapter}:${ref.startVerse}-${ref.endVerse}`;
        }

        // part chapters ref
        const a = `${ref.startChapter}:${ref.startVerse}`;
        const b = `${ref.endChapter}:${ref.endVerse}`;
        return `${ref.book.name} ${a}-${b}`;
    }
}