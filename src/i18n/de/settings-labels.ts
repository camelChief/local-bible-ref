import { PassageFormat } from 'src/passage-reference';
import { SettingsLabels } from '../models';
import { QuoteReferencePosition } from 'src/settings';

export const SETTINGS_LABELS: SettingsLabels = {
	required: {
		name: 'Erforderliche Einstellungen',
		controls: {
			biblesPath: {
				name: 'Bibeldateien',
				description: 'Pfad zu den Bibeldateien',
				placeholder: 'z.B. Dateien/Bibel',
			},
		},
	},

	optional: {
		name: 'Optionale Einstellungen',
		controls: {
			defaultVersion: {
				name: 'Standardversion',
				description:
					'Welche Bibelversion soll als Standardversion verwendet werden? Diese Abkürzung muss mit einem Ordner in dem oben angegebenen Pfad übereinstimmen.',
				placeholder: 'z.B. Schl2000',
			},
			defaultPassageFormat: {
				name: 'Standard Bibelstellenformat',
				description:
					'Welches Markdownformat soll für einen Bibelstelle standardmäßig ausgewählt werden?',
				options: {
					[PassageFormat.Manuscript]: 'Manuskript',
					[PassageFormat.Paragraph]: 'Abschnitt',
					[PassageFormat.Quote]: 'Zitat',
					[PassageFormat.Callout]: 'Callout',
				},
			},
			bibleFormat: {
				name: 'Bibelformat',
				description:
					'Der Formatierungsstil, den Sie für Ihre Vault-Bibeln verwenden. Local Bible Ref benötigt diesen, um Textpassagen korrekt zu analysieren.',
			},
		},
	},

	quoteFormat: {
		name: 'Einstellungen für das Angebotsformat',
		description: 'Einstellungen für das Zitatpassageformat.',
		controls: {
			includeReference: {
				name: 'Referenz angeben',
				description: 'Ob ein Verweis auf die Passage aufgenommen werden soll.',
			},
			referencePosition: {
				name: 'Referenzposition',
				description:
					'Die Position der Bezugnahme im Verhältnis zum zitierten Text.',
				options: {
					[QuoteReferencePosition.Beginning]: 'Anfang',
					[QuoteReferencePosition.End]: 'Ende',
				},
			},
			linkToPassage: {
				name: 'Link zur Passage',
				description:
					'Ob Sie den Verweis auf die Passage in Ihrer Tresorbibel verlinken möchten.',
			},
		},
	},

	calloutFormat: {
		name: 'Einstellungen für das Callout-Format',
		description: 'Einstellungen für das Format des Callout-Passages.',
		controls: {
			calloutType: {
				name: 'Callout-Typ',
				description:
					'Die Art des Verweises, der für die Passage verwendet werden soll.',
			},
			linkToPassage: {
				name: 'Link zur Passage',
				description:
					'Ob Sie den Verweis auf die Passage in Ihrer Tresorbibel verlinken möchten.',
			},
			collapsible: {
				name: 'Zusammenklappbar',
				description:
					'Ob der für die Passage zu verwendende Hinweis einklappbar ist.',
			},
		},
	},

	suggestionFormat: {
		name: 'Einstellungen für das Vorschlagsformat',
		description: 'Einstellungen für das Format des Hinweistextes.',
		controls: {
			full: {
				name: 'Vollständiger Vorschlag',
				description:
					'Ob der für die Passage vorgeschlagene Hinweis vollständig ist.',
			},
		},
	},

	issues: {
		before:
			'Falls Sie Probleme mit Local Bible Ref feststellen oder Verbesserungsvorschläge haben, ',
		link: 'eröffne Sie bitte ein Issue auf GitHub',
		after: '.',
	},
};
