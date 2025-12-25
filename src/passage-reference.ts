import { I18N } from './i18n';
import { Book } from './i18n/models';

export default class PassageReference
	implements ChapterReference, PassageOptions
{
	startChapter: number;
	startVerse: number;
	endChapter: number;
	endVerse: number;
	book: Book;
	version: string;
	format: PassageFormat;

	constructor(
		chapterRef: ChapterReference,
		book: Book,
		passageOptions: PassageOptions
	) {
		this.startChapter = chapterRef.startChapter;
		this.startVerse = chapterRef.startVerse;
		this.endChapter = chapterRef.endChapter;
		this.endVerse = chapterRef.endVerse;
		this.book = book;
		this.version = passageOptions.version;
		this.format = passageOptions.format;
	}

	/** Parses a passage reference from the given text. */
	static parse(
		text: string,
		defaultVersionShorthand: string,
		defaultPassageFormat: PassageFormat
	): PassageReference | null {
		const match = text.match(this.regExp);
		if (!match) return null;

		let chapterRef = this.parseMultiChapterRef(match[2]);
		if (!chapterRef) chapterRef = this.parseMultiChapterVerseRef(match[2]);
		if (!chapterRef) chapterRef = this.parseMultiVerseRef(match[2]);
		if (!chapterRef) return null;

		const book = this.getBook(match[1]);
		if (!book) return null;

		const options = this.parseOptions(
			match[3],
			defaultVersionShorthand,
			defaultPassageFormat
		);

		return new PassageReference(chapterRef, book, options);
	}

	/** Builds the passage matching regular expression. */
	static get regExp(): RegExp {
		let regExpString = '^\\-\\- ?(';
		regExpString += I18N.EN.BOOKS.map(
			(b) => `${b.name}|${b.aliases.join('|')}`
		).join('|');
		regExpString +=
			') ?(\\d{1,3}(?::\\d{1,3})?' +
			'(?: ?\\- ?\\d{1,3}(?::\\d{1,3})?)?)' +
			'((?: ?\\+[a-z]+(?::[a-z]+)?){0,2})$';

		return new RegExp(regExpString, 'i');
	}

	/** Stringifies the passage reference back into text. */
	stringify(): string {
		// multi-chapter ref
		if (this.startVerse === 1 && this.endVerse === -1) {
			if (this.startChapter === this.endChapter)
				return this.book.name + ` ${this.startChapter} - ${this.version}`;
			return (
				`${this.book.name} ${this.startChapter}-` +
				`${this.endChapter} - ${this.version}`
			);
		}

		// multi-verse ref
		if (this.startChapter === this.endChapter) {
			if (this.startVerse === this.endVerse)
				return (
					this.book.name +
					` ${this.startChapter}:${this.startVerse} - ${this.version}`
				);
			return (
				`${this.book.name} ${this.startChapter}:` +
				`${this.startVerse}-${this.endVerse} - ${this.version}`
			);
		}

		// multi-chapter-and-verse ref
		const a = `${this.startChapter}:${this.startVerse}`;
		const b = `${this.endChapter}:${this.endVerse}`;
		return `${this.book.name} ${a}-${b} - ${this.version}`;
	}

	/**
	 * Parses a multi-chapter reference from the given text.
	 * Reference format: `startChapter[[ ]-[ ]endChapter]`.
	 */
	private static parseMultiChapterRef(text: string): ChapterReference | null {
		const regExp = /^(\d{1,3})(?: ?- ?(\d{1,3}))?$/i;
		const match = text.match(regExp);
		if (!match) return null;

		return {
			startChapter: +match[1],
			startVerse: 1,
			endChapter: match[2] ? +match[2] : +match[1],
			endVerse: -1,
		};
	}

	/**
	 * Parses a multi-chapter-and-verse reference from the given text.
	 * Reference format: `startChapter:startVerse[ ]-[ ]endChapter:endVerse`.
	 */
	private static parseMultiChapterVerseRef(
		text: string
	): ChapterReference | null {
		const regex = /^(\d{1,3}):(\d{1,3}) ?- ?(\d{1,3}):(\d{1,3})$/i;
		const match = text.match(regex);
		if (!match) return null;

		return {
			startChapter: +match[1],
			startVerse: +match[2],
			endChapter: +match[3],
			endVerse: +match[4],
		};
	}

	/**
	 * Parses a multi-verse reference from the given text.
	 * Reference format: `startChapter:startVerse[-endVerse]`.
	 */
	private static parseMultiVerseRef(text: string): ChapterReference | null {
		const regex = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/i;
		const match = text.match(regex);
		if (!match) return null;

		return {
			startChapter: +match[1],
			startVerse: +match[2],
			endChapter: +match[1],
			endVerse: match[3] ? +match[3] : +match[2],
		};
	}

	/** Retrieves a book based on its alias. */
	private static getBook(alias: string): Book | undefined {
		alias = alias.toLowerCase();
		return I18N.EN.BOOKS.find((book) => {
			const aliases = book.aliases.map((a) => a.toLowerCase());
			if (book.name.toLowerCase() === alias) return book;
			if (aliases.includes(alias)) return book;
		});
	}

	/** Parses passage options from the given text. */
	private static parseOptions(
		text: string,
		defaultVersionShorthand: string,
		defaultPassageFormat: PassageFormat
	): PassageOptions {
		const optionArgs = text
			.toLowerCase()
			.split('+')
			.filter(Boolean)
			.map((x) => x.trim());

		const options: PassageOptions = {
			version: defaultVersionShorthand,
			format: defaultPassageFormat,
		};

		// there are special keywords for formatting (m or manuscript, for
		// example) - anything else is treated as a Bible version code
		for (const option of optionArgs) {
			switch (option) {
				case 'm':
				case 'manuscript':
					options.format = PassageFormat.Manuscript;
					break;
				case 'p':
				case 'paragraph':
					options.format = PassageFormat.Paragraph;
					break;
				case 'q':
				case 'quote':
					options.format = PassageFormat.Quote;
					break;
				case 'c':
				case 'callout':
					options.format = PassageFormat.Callout;
					break;
				default:
					options.version = option.toUpperCase();
					break;
			}
		}

		return options;
	}
}

export enum PassageFormat {
	Manuscript = 'manuscript',
	Paragraph = 'paragraph',
	Quote = 'quote',
	Callout = 'callout',
}

interface ChapterReference {
	startChapter: number;
	startVerse: number;
	endChapter: number;
	endVerse: number;
}

interface PassageOptions {
	version: string;
	format: PassageFormat;
}
