import { Settings } from "../models";

export const SETTINGS: Settings = {
  required: {
    name: 'Required Settings',
    controls: {
      biblesPath: {
        name: 'Bibles path',
        description: 'The path to the folder containing your bibles.'
      },
    }
  },

  optional: {
    name: 'Optional Settings',
    controls: {
      defaultVersion: {
        name: 'Default version',
        description: 'The version to use by default - shorthand. This should correspond to a folder in the bibles folder selected above.'
      },
      defaultPassageFormat: {
        name: 'Default passage format',
        description: 'The markdown format to use for passages by default.'
      },
      bibleFormat: {
        name: 'Bible format',
        description: 'The formatting style you use for your vault bibles. Local Bible Ref relies on this to parse passages correctly.'
      }
    }
  },

  quoteFormat: {
    name: 'Quote Format Settings',
    description: 'Settings for the quote passage format.',
    controls: {
      includeReference: {
        name: 'Include reference',
        description: 'Whether to include a reference to the passage.'
      },
      referencePosition: {
        name: 'Reference position',
        description: 'The position of the reference in relation to the quoted text.'
      },
      linkToPassage: {
        name: 'Link to passage',
        description: 'Whether to link the reference to the passage in your vault Bible.'
      }
    }
  },

  calloutFormat: {
    name: 'Callout Format Settings',
    description: 'Settings for the callout passage format.',
    controls: {
      calloutType: {
        name: 'Callout type',
        description: 'The type of callout to use for the passage.'
      },
      linkToPassage: {
        name: 'Link to passage',
        description: 'Whether to link the reference to the passage in your vault Bible.'
      }
    }
  }
}