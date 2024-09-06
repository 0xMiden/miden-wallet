export interface ChangelogItem {
  version: string;
  data?: Array<JSX.Element>;
}

export const changelogData: ChangelogItem[] = [];
