const {join} = require('path');

const PROJECT_ID = process.env.PI;
const SERVICE_ACCOUNT = join('../accounts', (process.env.SV || process.env.PI) + '.account.json');
const BUCKET_NAME = (process.env.BN || process.env.PI) + '.appspot.com';

function filter(file) {
    return file.metadata.metadata.generated === 'true';
}

async function run() {
    const {Storage} = require('@google-cloud/storage');
    const storage = new Storage({projectId: PROJECT_ID, keyFilename: SERVICE_ACCOUNT});
    const storageBucket = await storage.bucket(BUCKET_NAME);
    const [files] = await storageBucket.getFiles({autoPaginate: true});
    const toRemove = [];

    for (const file of files) {
        if (filter(file)) {
            toRemove.push(new Promise(resolve =>
                file.delete()
                    .then(resolve)
                    .catch(error => {
                        console.error(error);
                        resolve();
                    })
            ))
        }
    }

    await Promise.all(toRemove);
}

run()
    .then(() =>
        console.log('Files removed successfully.')
    )
    .catch(error =>
        console.error(error)
    );