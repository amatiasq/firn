import child_process from 'child_process';
import http from 'http';
import util from 'util';
import querystring from 'querystring';
import url from 'url';
import googleapis from 'googleapis';
import stoppable from 'stoppable';
import credentials from './credentials.json';

const { google } = googleapis;
const exec = util.promisify(child_process.exec);
const PORT = 8080;
const SCOPES = [ 'https://www.googleapis.com/auth/photoslibrary.readonly' ];

export default async function loggedAuth() {
    process.stdout.write('Authenticating... ');
    const auth = await getAuth();
    console.log('Done.');
    return auth;
}

async function getAuth() {
    const oauth2Client = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        `http://localhost:${PORT}/oauth_callback`,
    );

    const url = oauth2Client.generateAuthUrl({ scope: SCOPES, });
    const onCodeReady = startServer();

    exec(`open "${url}"`);

    const code = await onCodeReady;
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    return oauth2Client;
}

function startServer() {
    let resolve;

    const server = stoppable(http.createServer((request, response) => {
        const parsed = url.parse(request.url);
        const query = querystring.parse(parsed.query);

        if (query && query.code) {
            resolve(query.code);
            response.write('Hello World!');
            server.stop();
        } else {
            response.write('Yu madafaka');
        }

        response.end();
    }));

    server.listen(PORT);

    return new Promise(_resolve => resolve = _resolve);
}
