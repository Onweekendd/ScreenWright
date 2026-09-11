export const buildScreenVersionKey = (screenId: string | number, versionCode: string | number) =>
  `${screenId}_${versionCode}`;

export const buildScreenWorkspaceDir = (screenId: string | number, versionCode: string | number) =>
  `screen_${buildScreenVersionKey(screenId, versionCode)}`;
