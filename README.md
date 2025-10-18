# Local Bible Ref

Quickly and easily reference Bible passages stored locally in your vault.

## Basics

### Inspiration

This plugin takes heavy inspiration from the [Bible Reference](https://github.com/tim-hub/obsidian-bible-reference) and [Bible Linker](https://github.com/kuchejak/obsidian-bible-linker-plugin) plugins - please check them out! I've been using the *Bible Reference* plugin for a while (which has been great) and I love the simplicity of referencing passages using the `--` prefix. I also loved the idea of storing a Bible locally because then I can reference Bible passages even when I'm offline, as well as use my vault Bible for reading. Unfortunately, the markdown format of the *Bible Linker* local Bible is not great for reading, and I prefer the simplicity of using the `--` prefix to fetch Bible passages. There's also some referencing limitations in the *Bible Reference* plugin and occasionally some odd additions to passages returned from the [Boll's Life](https://bolls.life/) API. So, this is an amalgamation of those two plugins. 

### Getting Started

To start with, you will need to format a Bible for your own vault. Some instructions on this can be found [below](#bible-markdown-format) (this plugin uses a different markdown format to *Bible Linker*). I've also already formatted the Public Domain World English Bible so you can [download](https://github.com/camelChief/markdown-webp) that and just get started. Once you've done that, open up the *Local Bible Ref* settings and fill in at least the *Bibles path* field. Then, to use the plugin, simply open a new note and use the `--` reference prefix to grab a passage of scripture. There are also additional options (similar to terminal command options) you can provide to the reference to indicate which version to use and what markdown format to display the passage in. More information can be found [below](#usage).

![localBibleRef1](https://github.com/user-attachments/assets/b8b5440b-8f47-4462-987e-a52791d758be)

## Usage

### References

In order to fetch a Bible passage, simply type in a Bible reference prefixed with `--`: `--John 1:1`. *Local Bible Ref* currently supports Bible references in the form:

- Single verse: `--gen1:1`
- Multi verse: `--gen1:1-3`
- Single chapter: `--gen1`
- Multi chapter: `--gen1-3`
- Multi chapter & verse: `--gen1:3-3:9`

The referencing syntax also allows for a lot of flexibility:

- Short and full name references: `--gen1` + `--genesis1`
- Lowercase, uppercase and mixed-case references: ``--gEnEsis1``
- Spacing (not more than a single space): `-- Genesis 1:1 - 2:2`

### Options

Local Bible Ref also allows you to provide a few options to a reference to specify which version you would like to use as well as what markdown format to use. Add an option to a reference by adding a `+` followed by the option (in any order): `--gen1:1-5+esv`

You can also pass multiple options by simply chaining them: `-- John 1:1 +quote +esv`

Syntax: `--<reference>[+<option>]...`

| Option                | Usage                                                                                                                                             | Example                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `manuscript`, `m`     | Specifies that the passage should be displayed in "manuscript" format (without chapter numbers, verse numbers or other formatting like newlines). | ![localBibleRef3](https://github.com/user-attachments/assets/736e38e3-f05e-41c0-9d0a-d27145e50e30) |
| `paragraph`, `p`      | Specifies that the passage should be displayed in a standard paragraph.                                                                           | ![localBibleRef4](https://github.com/user-attachments/assets/d62dc0f0-4d4b-4468-b53a-b87a2f3b5384) |
| `quote`, `q`          | Specifies that the passage should be displayed in [quote](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Quotes) format. | ![localBibleRef5](https://github.com/user-attachments/assets/59cd0a61-de28-4c51-ac38-9faf71c2e391) |
| `callout`, `c`        | Specifies that the passage should be displayed in [callout](https://help.obsidian.md/Editing+and+formatting/Callouts) format.                     | ![localBibleRef6](https://github.com/user-attachments/assets/2256aa40-02cc-4f08-beec-e99c169855ce) |
| any other text, `niv` | Any other text besides the options listed above will be treated as a version code.                                                                | ![localBibleRef7](https://github.com/user-attachments/assets/a7c75752-6572-482d-a807-c2dc20f1ed28) |

## Bible Markdown Format

The Bible markdown format required for this plugin is slightly more complex than the format used for the *Bible Linker* plugin. I chose this particular format because it makes the Bible much nicer to read if you simply wanted to use your vault Bible for reading (as I do). It looks something like this:

![localBibleRef2](https://github.com/user-attachments/assets/e5fc4ca1-bc9d-4fbb-b20c-e94c693d0660)

Most of the formatting shown here is unnecessary. You really only need to ensure your Bible adheres to the following:

- Verses are denoted by the verse number wrapped in the `sup` tag: `<sup>1</sup>`
- Each chapter is a markdown file of it's own
- Chapters are named with the convention `<book name> <chapter>.md`: `Genesis 1.md`
- Chapters are grouped into folders with the full name of the book: `Genesis`
- Books are grouped into a folder with the version code of the Bible: `CSB`
- All versions are under the same folder

Doing things this way allows you to store and reference multiple different versions of the Bible:

<img width="253" height="379" alt="image" src="https://github.com/user-attachments/assets/5804ceab-e69d-4b7f-a58d-3f9b5a89e3fc" />

Beyond that, everything else (section headings, footnotes, links) is optional. Be careful not to add odd characters or extra text in the verses, or they will show up when you reference them. Currently, referencing will ignore YAML frontmatter, headings, chapter numbers (any bolded digits), footnotes and anything after a [horizontal rule](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Horizontal+rule).

If all of this seems a bit confusing, please check out the aforementioned [markdown formatted WEB](https://github.com/camelChief/markdown-webp) to help you understand the formatting requirements.

## Limitations

- Bible referencing **does not work** with the *Bible Linker* style of markdown Bible.
- Referencing does not yet support multiple passages: `Genesis 1:1; John 1:1`
