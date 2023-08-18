import * as fs from 'fs'

export const checkExistFolder = (checkPath: string) => {
	!fs.existsSync(checkPath) && fs.mkdir(checkPath, (err) => err);
};