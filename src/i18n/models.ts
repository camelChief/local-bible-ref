export interface Book {
  id: string;
	name: string;
	aliases: string[];
}

export interface Settings {
  [key: string]: SettingsGroup
}

interface SettingsGroup {
  name: string;
  description?: string;
  controls: { [key: string]: Control };
}

interface Control {
  name: string;
  description?: string;
  placeholder?: string;
}