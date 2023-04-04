const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const oauth2Client = new OAuth2Client(

    '993579746539-m4hn94d7qnbrqelp6dd3uc5gc41lm9he.apps.googleusercontent.com',


    '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',


    'urn:ietf:wg:oauth:2.0:oob'
);

const REFRESH_TOKEN = '1//04eO1mAUUgXmUCgYIARAAGAQSNwF-L9IrbEPNEYelGALD9vABu6WX2RoZ4o4E3ZDzg_QidELXsLHSWHmoYqOh-M0wbKlGE8L-UpU';

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const LABEL_NAME = 'ListedAssesment';
const LABEL_COLOR = {
    backgroundColor: { rgbColor: { red: 1, green: 0.8, blue: 0 } }
};

async function listMessages() {
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: `label:inbox -label:${LABEL_NAME}`,
        maxResults: 1
    });

    const messages = res.data.messages;

    if (messages) {
        const { id, threadId } = messages[0];

        const message = await gmail.users.messages.get({
            userId: 'me',
            id
        });

        const { historyId, snippet } = message.data;
        const thread = await gmail.users.threads.get({ userId: 'me', id: threadId });

        if (thread.data.messages.length === 1) {
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    threadId,
                    labelIds: [await createLabelIfNeeded(), 'SENT'],
                    raw: message.data.raw
                }
            });

            console.log(`Sent response to message with snippet: ${snippet}`);
        } else {
            console.log(`Not sending response to message with snippet: ${snippet}. Thread has more than one message.`);
        }
    }
}

async function createLabelIfNeeded() {
    try {
        const res = await gmail.users.labels.create({
            userId: 'me',
            requestBody: {
                name: LABEL_NAME,
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show',
                color: LABEL_COLOR
            }
        });

        console.log(`Created label with name: ${res.data.name}`);
        return res.data.id;
    } catch (err) {
        if (err.code === 409) {
            console.log(`Label with name ${LABEL_NAME} already exists.`);
            const res = await gmail.users.labels.list({ userId: 'me' });
            const label = res.data.labels.find(l => l.name === LABEL_NAME);
            return label.id;
        }

        console.error(err);
    }
}

(async function () {
    try {
        await listMessages();
    } catch (err) {
        console.error(err);
    } finally {
        setTimeout(() => {
            console.log('Checking for new messages...');
            process.exit(0);
        }, Math.floor(Math.random() * (120 - 45 + 1)) + 45);
    }
})();
