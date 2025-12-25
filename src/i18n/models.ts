export interface Book {
	id: string;
	name: string;
	aliases: string[];
}

export interface SettingsLabels {
	required: {
		name: string;
		controls: {
			biblesPath: ControlWithPlaceholder;
		};
	};

	optional: {
		name: string;
		controls: {
			defaultVersion: ControlWithPlaceholder;
			defaultPassageFormat: Control;
			bibleFormat: Control;
		};
	};

	quoteFormat: {
		name: string;
		description: string;
		controls: {
			includeReference: Control;
			referencePosition: Control;
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

interface ControlWithPlaceholder extends Control {
	placeholder: string;
}
