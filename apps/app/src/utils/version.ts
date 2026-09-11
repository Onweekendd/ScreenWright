const VERSION_CODE = "v3VersionCode";

const getVersionCode = () => {
  return localStorage.getItem(VERSION_CODE);
};

const setVersionCode = (versionCode: string) => {
  localStorage.setItem(VERSION_CODE, versionCode);
};

const removeVersionCode = () => {
  localStorage.removeItem(VERSION_CODE);
};

export { getVersionCode, removeVersionCode, setVersionCode };
