// One-off: applies the v2 naming convention by renaming property folders.
// Renaming does not change a folder's ID, so nothing downstream breaks.
//
//   vercel env pull .env.tmp --environment=development --yes
//   node --env-file=.env.tmp server/rename-drive-folders.mjs
//   rm -f .env.tmp

import { JWT } from "google-auth-library";

const SUBJECT = "able@ablebuyshomes.com";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Drive name -> [current name, v2 name] for folders at the drive root. */
const RENAMES = {
    "10-ABLE-CONGLOMERATE": [["50-Justiceburg-75", "Justiceburg-75"]],
    "20-KUBERA-HOMES": [
        ["10-Hometown-Meadows-MHP", "Hometown-Meadows-MHP"],
        ["20-106-Fox-Run", "106-Fox-Run"],
        ["30-406-408-Harrison-St", "406-408-Harrison-St"],
    ],
    "30-AHTX": [
        ["10-4821-24th-St-Lubbock", "4821-24th-St-Lubbock"],
        ["20-3416-39th-St-Lubbock", "3416-39th-St-Lubbock"],
        ["30-2816-41st-St-Lubbock", "2816-41st-St-Lubbock"],
        ["40-1690-W-US-Hwy-70-Plainview", "1690-W-US-Hwy-70-Plainview"],
        ["50-11507-Topeka-Ave-Lubbock", "11507-Topeka-Ave-Lubbock"],
        ["60-1920-27th-St-Duplex", "1920-27th-St-Duplex"],
    ],
};

const key = JSON.parse(
    Buffer.from(process.env.GOOGLE_SA_KEY_B64, "base64").toString(),
);

const auth = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
    subject: SUBJECT,
});

const { access_token: token } = await auth.authorize();

async function api(path, options = {}) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });

    if (!res.ok) throw new Error(`${res.status} ${path} - ${await res.text()}`);
    return res.json();
}

async function findAtRoot(driveId, name) {
    const query = encodeURIComponent(
        `'${driveId}' in parents and name='${name}' and mimeType='${FOLDER_MIME}' and trashed=false`,
    );

    const data = await api(
        `files?q=${query}&corpora=drive&driveId=${driveId}` +
        `&includeItemsFromAllDrives=true&supportsAllDrives=true` +
        `&fields=files(id,name)&pageSize=10`,
    );

    return data.files?.[0] ?? null;
}

const drives = (await api("drives?pageSize=100&fields=drives(id,name)")).drives;
const driveByName = new Map(drives.map((drive) => [drive.name, drive.id]));

let renamed = 0;
let skipped = 0;

for (const [driveName, pairs] of Object.entries(RENAMES)) {
    const driveId = driveByName.get(driveName);

    if (!driveId) {
        console.error(`MISSING DRIVE  ${driveName}`);
        continue;
    }

    for (const [oldName, newName] of pairs) {
        const existing = await findAtRoot(driveId, oldName);

        if (!existing) {
            const already = await findAtRoot(driveId, newName);
            console.log(
                already
                    ? `already v2     ${driveName}/${newName}`
                    : `NOT FOUND      ${driveName}/${oldName}`,
            );
            skipped += 1;
            continue;
        }

        await api(`files/${existing.id}?supportsAllDrives=true&fields=id,name`, {
            method: "PATCH",
            body: JSON.stringify({ name: newName }),
        });

        renamed += 1;
        console.log(`renamed        ${driveName}/${oldName}  ->  ${newName}`);
    }
}

console.log(`\nRenamed ${renamed}, skipped ${skipped}`);