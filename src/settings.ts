import { BibleFormat } from "./local-bible-ref-setting-tab";
import { PassageFormat } from "./passage-reference";

export default interface LocalBibleRefSettings {
    biblesPath: string;
    defaultVersionShorthand: string;
    defaultPassageFormat: PassageFormat;
    bibleFormat: BibleFormat;
    quote: {
        includeReference: boolean;
        referencePosition: QuoteReferencePosition;
        linkToPassage: boolean;
    },
    callout: {
        type: CalloutType;
        linkToPassage: boolean;
    }
}

export enum QuoteReferencePosition {
	Beginning = "beginning",
	End = "end",
}

export enum CalloutType {
    Note = "note",
    Abstract = "abstract",
    Info = "info",
    Todo = "todo",
    Tip = "tip",
    Success = "success",
    Question = "question",
    Warning = "warning",
    Failure = "failure",
    Danger = "danger",
    Bug = "bug",
    Example = "example",
    Quote = "quote",
}