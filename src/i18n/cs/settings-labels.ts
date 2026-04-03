import { PassageFormat } from 'src/passage-reference';
import { SettingsLabels } from '../models';
import { QuoteReferencePosition } from 'src/settings';

export const SETTINGS_LABELS: SettingsLabels = {
	required: {
		name: 'Požadovaný',
		controls: {
			biblesPath: {
				name: 'Biblická cesta',
				description: 'Cesta ke složce obsahující vaše bible.',
				placeholder: 'např. Data/Bible',
			},
		},
	},

	optional: {
		name: 'Volitelný',
		controls: {
			defaultVersion: {
				name: 'Výchozí verze',
				description:
					'Verze, která se má používat ve výchozím nastavení – zkrácená verze. Měla by odpovídat složce ve výše vybrané složce bible.',
				placeholder: 'např. CSP',
			},
			defaultPassageFormat: {
				name: 'Výchozí formát pasáže',
				description:
					'Formát markdownu, který se má ve výchozím nastavení použít pro pasáže.',
				options: {
					[PassageFormat.Manuscript]: 'Rukopis',
					[PassageFormat.Paragraph]: 'Odstavec',
					[PassageFormat.Quote]: 'Citovat',
					[PassageFormat.Callout]: 'Popisek',
				},
			},
			bibleFormat: {
				name: 'Biblický formát',
				description:
					'Styl formátování, který používáte pro své bible v úložišti. Local Bible Ref se na něj spoléhá pro správnou analýzu pasáží.',
			},
			fullPreview: {
				name: 'Náhled celé pasáže',
				description:
					'Zda se v náhledu má zobrazit celá pasáž, a ne jen její úryvek.',
			},
		},
	},

	quoteFormat: {
		name: 'Formát citace',
		controls: {
			includeReference: {
				name: 'Zahrnout odkaz',
				description: 'Zda zahrnout odkaz na danou pasáž.',
			},
			referencePosition: {
				name: 'Referenční pozice',
				description: 'Pozice odkazu vzhledem k citovanému textu.',
				options: {
					[QuoteReferencePosition.Beginning]: 'Začátek',
					[QuoteReferencePosition.End]: 'Konec',
				},
			},
			linkToPassage: {
				name: 'Odkaz na pasáž',
				description: 'Zda odkazovat na pasáž ve vaší Bibli v trezoru.',
			},
		},
	},

	calloutFormat: {
		name: 'Formát popisku',
		controls: {
			calloutType: {
				name: 'Typ volání',
				description: 'Typ popisu, který se má pro daný text použít.',
			},
			linkToPassage: {
				name: 'Odkaz na pasáž',
				description: 'Zda odkazovat na pasáž ve vaší Bibli v trezoru.',
			},
			collapsible: {
				name: 'Skládací',
				description:
					'Zda je popis, který se má pro daný text použít, sbalitelný.',
			},
		},
	},

	issues: {
		before:
			'Pokud narazíte na nějaké problémy s Local Bible Ref nebo máte návrhy na vylepšení, ',
		link: 'otevřete prosím problém na GitHubu',
		after: '.',
	},
};
