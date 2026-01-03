import { PassageFormat } from 'src/passage-reference';
import { SettingsLabels } from '../models';
import { QuoteReferencePosition } from 'src/settings';

export const SETTINGS_LABELS: SettingsLabels = {
	required: {
		name: '필수 설정',
		controls: {
			biblesPath: {
				name: '성경의 길',
				description: '성경책이 들어 있는 폴더의 경로입니다.',
				placeholder: '예: 데이터/성경',
			},
		},
	},

	optional: {
		name: '선택적 설정',
		controls: {
			defaultVersion: {
				name: '기본 버전',
				description:
					'기본적으로 사용할 버전(약어). 이는 위에서 선택한 성경 폴더 내의 하위 폴더에 해당해야 합니다.',
				placeholder: '예: 개역개정',
			},
			defaultPassageFormat: {
				name: '기본 구절 형식',
				description: '기본적으로 문단에 사용할 마크다운 형식입니다.',
				options: {
					[PassageFormat.Manuscript]: '원고',
					[PassageFormat.Paragraph]: '절',
					[PassageFormat.Quote]: '인용하다',
					[PassageFormat.Callout]: '호출',
				},
			},
			bibleFormat: {
				name: '성경 형식',
				description:
					'보관된 성경에 사용하는 서식 스타일입니다. Local Bible Ref는 이 스타일을 기반으로 구절을 정확하게 분석합니다.',
			},
		},
	},

	quoteFormat: {
		name: '견적 형식 설정',
		description: '인용구 형식 설정입니다.',
		controls: {
			includeReference: {
				name: '참조 포함',
				description: '해당 구절을 참조로 포함할지 여부.',
			},
			referencePosition: {
				name: '기준 위치',
				description: '인용된 텍스트에 대한 참조의 위치.',
				options: {
					[QuoteReferencePosition.Beginning]: '시작',
					[QuoteReferencePosition.End]: '끝',
				},
			},
			linkToPassage: {
				name: '통로 바로가기',
				description: '보관된 성경의 해당 구절에 참조를 연결할지 여부.',
			},
		},
	},

	calloutFormat: {
		name: '콜아웃 형식 설정',
		description: '설명문 형식 설정입니다.',
		controls: {
			calloutType: {
				name: '콜아웃 유형',
				description: '본문에 사용할 콜아웃 유형입니다.',
			},
			linkToPassage: {
				name: '통로 바로가기',
				description: '보관된 성경의 해당 구절에 참조를 연결할지 여부.',
			},
		},
	},

	issues: {
		before:
			'Local Bible Ref에 문제가 있거나 개선 사항에 대한 제안이 있는 경우, ',
		link: 'GitHub에서 이슈를 열어주세요',
		after: '.',
	},
};
