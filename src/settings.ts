import { PassageFormat } from "./passage-reference";

export interface LocalBibleRefSettings {
    biblesPath: string;
    defaultVersionShorthand: string;
    defaultPassageFormat: PassageFormat;
}