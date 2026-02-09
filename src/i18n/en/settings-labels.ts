import { PassageFormat } from 'src/passage-reference';
import { SettingsLabels } from '../models';
import { QuoteReferencePosition } from 'src/settings';

export const SETTINGS_LABELS: SettingsLabels = {
	required: {
		name: 'Required Settings',
		controls: {
			biblesPath: {
				name: 'Bibles path',
				description: 'The path to the folder containing your bibles.',
				placeholder: 'e.g. Data/Bibles',
			},
		},
	},

	optional: {
		name: 'Optional Settings',
		controls: {
			defaultVersion: {
				name: 'Default version',
				description:
					'The version to use by default - shorthand. This should correspond to a folder in the bibles folder selected above.',
				placeholder: 'e.g. NIV',
			},
			defaultPassageFormat: {
				name: 'Default passage format',
				description: 'The markdown format to use for passages by default.',
				options: {
					[PassageFormat.Manuscript]: 'Manuscript',
					[PassageFormat.Paragraph]: 'Paragraph',
					[PassageFormat.Quote]: 'Quote',
					[PassageFormat.Callout]: 'Callout',
				},
			},
			bibleFormat: {
				name: 'Bible format',
				description:
					'The formatting style you use for your vault bibles. Local Bible Ref relies on this to parse passages correctly.',
			},
			fullPreview: {
				name: 'Full Passage Preview',
				description:
					'Whether to display the full passage in the preview rather than just a snippet.',
			},
		},
	},

	quoteFormat: {
		name: 'Quote Format Settings',
		description: 'Settings for the quote passage format.',
		controls: {
			includeReference: {
				name: 'Include reference',
				description: 'Whether to include a reference to the passage.',
			},
			referencePosition: {
				name: 'Reference position',
				description:
					'The position of the reference in relation to the quoted text.',
				options: {
					[QuoteReferencePosition.Beginning]: 'Beginning',
					[QuoteReferencePosition.End]: 'End',
				},
			},
			linkToPassage: {
				name: 'Link to passage',
				description:
					'Whether to link the reference to the passage in your vault Bible.',
			},
		},
	},

	calloutFormat: {
		name: 'Callout Format Settings',
		description: 'Settings for the callout passage format.',
		controls: {
			calloutType: {
				name: 'Callout type',
				description: 'The type of callout to use for the passage.',
			},
			linkToPassage: {
				name: 'Link to passage',
				description:
					'Whether to link the reference to the passage in your vault Bible.',
			},
			collapsible: {
				name: 'Collapsible',
				description:
					'Whether the callout to use for the passage is collapsible.',
			},
		},
	},

	issues: {
		before:
			'If you find any issues with Local Bible Ref or have suggestions for improvements, please ',
		link: 'open an issue on GitHub',
		after: '.',
	},
};
