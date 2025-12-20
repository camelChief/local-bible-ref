import { BibleFormat } from "./local-bible-ref-setting-tab";
import { PassageFormat } from "./passage-reference";

export interface LocalBibleRefSettings {
    biblesPath: string;
    defaultVersionShorthand: string;
    defaultPassageFormat: PassageFormat;
    bibleFormat: BibleFormat;
}
