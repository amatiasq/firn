import child_process from 'child_process';
import fs from 'fs';
import util from 'util';
import cached from '../photos.json';
import { getDownloadLink, getAllMediaCached as getAllMedia } from './google-photos';
import { forAwait } from './util';

const exec = util.promisify(child_process.exec);
const writeFile = util.promisify(fs.writeFile);

export default async function main() {
    const photos = cached; // await loadPhotos();

    for (const photo of photos.slice(0, 3)) {
        // console.log({ ...photo, link: getDownloadLink(photo) })
        console.log(getDownloadLink(photo));
        await exec(`open '${getDownloadLink(photo)}'`);
    }
}

async function loadPhotos() {
    const list = [];
    await forAwait(await getAllMedia(), page => list.push(...page));
    writeFile('./photos.json', JSON.stringify(list, null, 2));
    return list;
}
