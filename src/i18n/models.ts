import { PassageFormat } from 'src/passage-reference';
import { QuoteReferencePosition } from 'src/settings';

export interface Book {
	id: string;
	name: string;
	aliases: string[];
}

export interface CommonLabels {
	folderDoesNotExist: string;
	settingsNotConfigured: string;
}

export interface SettingsLabels {
	required: {
		name: string;
		controls: {
			biblesPath: TextControl;
		};
	};

	optional: {
		name: string;
		controls: {
			defaultVersion: TextControl;
			defaultPassageFormat: Control & {
				options: {
					[PassageFormat.Manuscript]: string;
					[PassageFormat.Paragraph]: string;
					[PassageFormat.Quote]: string;
					[PassageFormat.Callout]: string;
				};
			};
			bibleFormat: Control;
		};
	};

	quoteFormat: {
		name: string;
		description: string;
		controls: {
			includeReference: Control;
			referencePosition: Control & {
				options: {
					[QuoteReferencePosition.Beginning]: string;
					[QuoteReferencePosition.End]: string;
				};
			};
			linkToPassage: Control;
		};
	};

	calloutFormat: {
		name: string;
		description: string;
		controls: {
			calloutType: Control;
			linkToPassage: Control;
		};
	};
}

interface Control {
	name: string;
	description: string;
}

interface TextControl extends Control {
	placeholder: string;
}
