import fs from 'fs';
import path from 'path';
import util from 'util';
import googleapis from 'googleapis';
import googleAuth from './google-auth';

const CACHE_PATH = './calls';
const { google } = googleapis;
const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
let _api;

async function init() {
    if (!_api) {
        _api = google.photoslibrary({
            version: 'v1',
            auth: await googleAuth(),
        });
    }

    return _api;
}

export function getDownloadLink(media) {
    return media.mediaMetadata.video ?
        getVideoUrl(media) :
        getFullResolutionUrl(media);
}

export function getFullResolutionUrl(media) {
    const { baseUrl, mediaMetadata } = media;
    const { width, height } = mediaMetadata;
    return `${baseUrl}=w${width}-h${height}`;
}

export function getVideoUrl(media) {
    return `${media.baseUrl}=dv`;
}

export function getApi() {
    return init();
}

export async function getAllMedia() {
    return getIterator(await init());
}

function* getIterator(api) {
    let nextPage = null;
    let iteration = 0;

    do {
        yield getPage(api, nextPage, iteration).then(({ nextPageToken, mediaItems }) => {
            nextPage = nextPageToken;
            return mediaItems;
        });

        iteration++;
    } while (nextPage);
}

async function getPage(api, token, iteration) {
    console.log(`CALLING ${token}`);

    const response = await api.mediaItems.search({
        pageSize: 500,
        pageToken: token,
    });

    await writeFile(
        `./calls/${iteration++}.json`,
        JSON.stringify(response.data, null, 2)
    );

    return response.data;
}

export async function getAllMediaCached() {
    return getIteratorCached(await readDir(CACHE_PATH));
}

function* getIteratorCached(list) {
    for (const file of list) {
        const route = path.join(CACHE_PATH, file);

        yield readFile(route).then(buffer => {
            const content = buffer.toString();
            const json = JSON.parse(content);
            return json.mediaItems;
        });
    }
}
