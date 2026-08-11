// Builds the whole Drive folder structure from the authoritative paths list.
// Safe to re-run: it looks up each folder before creating it.
//
//   vercel env pull .env.tmp --environment=development --yes
//   node --env-file=.env.tmp server/build-drive-tree.mjs
//   rm -f .env.tmp

import { JWT } from "google-auth-library";

const SUBJECT = "able@ablebuyshomes.com";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/** From the certified rent roll. Change if the roll says otherwise. */
const HOMETOWN_LOTS = 36;

const TEMPLATE = [
    "01-Acquisition-and-Title",
    "02-Financing-and-Lender",
    "03-Insurance",
    "04-Leases-and-Tenants",
    "05-Rehab-and-Maintenance",
    "06-Financials",
    "07-Photos-and-Media",
];

/** Standard 01-07 under a property. */
const property = (base) => TEMPLATE.map((folder) => `${base}/${folder}`);

const lots = Array.from({ length: HOMETOWN_LOTS }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `20-KUBERA-HOMES/10-Hometown-Meadows-MHP/04-Leases-and-Tenants/Lot-${number}`;
});

const PATHS = [
    // ---- Drive 1 ----
    "00-ABLE-MAIN-BRAIN/00-Doctrine-and-Playbooks",
    "00-ABLE-MAIN-BRAIN/00-Doctrine-and-Playbooks/Buy-Box",
    "00-ABLE-MAIN-BRAIN/00-Doctrine-and-Playbooks/SOPs",
    "00-ABLE-MAIN-BRAIN/00-Doctrine-and-Playbooks/Brand-Assets",
    "00-ABLE-MAIN-BRAIN/01-People-and-Counterparties",
    "00-ABLE-MAIN-BRAIN/01-People-and-Counterparties/Partners",
    "00-ABLE-MAIN-BRAIN/01-People-and-Counterparties/Lenders",
    "00-ABLE-MAIN-BRAIN/01-People-and-Counterparties/Sellers",
    "00-ABLE-MAIN-BRAIN/01-People-and-Counterparties/Vendors",

    // ---- Drive 2 ----
    "10-ABLE-CONGLOMERATE/00-Entity-Docs",
    "10-ABLE-CONGLOMERATE/00-Entity-Docs/Operating-Agreement",
    "10-ABLE-CONGLOMERATE/00-Entity-Docs/Tax",
    "10-ABLE-CONGLOMERATE/00-Entity-Docs/Banking",
    "10-ABLE-CONGLOMERATE/10-Able-Buys-Homes",
    "10-ABLE-CONGLOMERATE/20-Able-Can-Help",
    "10-ABLE-CONGLOMERATE/20-Able-Can-Help/Surplus-Funds",
    "10-ABLE-CONGLOMERATE/20-Able-Can-Help/Tenant-Placement",
    "10-ABLE-CONGLOMERATE/20-Able-Can-Help/OaaS",
    "10-ABLE-CONGLOMERATE/30-Able-Has-Deals",
    "10-ABLE-CONGLOMERATE/40-Able-Builds",
    "10-ABLE-CONGLOMERATE/50-Justiceburg-75",
    ...property("10-ABLE-CONGLOMERATE/50-Justiceburg-75"),

    // ---- Drive 3 ----
    "20-KUBERA-HOMES/00-Entity-Docs",
    "20-KUBERA-HOMES/00-Entity-Docs/Operating-Agreement",
    "20-KUBERA-HOMES/00-Entity-Docs/Tax",
    "20-KUBERA-HOMES/00-Entity-Docs/Banking",

    "20-KUBERA-HOMES/10-Hometown-Meadows-MHP",
    ...property("20-KUBERA-HOMES/10-Hometown-Meadows-MHP"),
    "20-KUBERA-HOMES/10-Hometown-Meadows-MHP/01-Acquisition-and-Title/Home-Titles",
    "20-KUBERA-HOMES/10-Hometown-Meadows-MHP/02-Financing-and-Lender/Refi-Oct-2026",
    ...lots,
    "20-KUBERA-HOMES/10-Hometown-Meadows-MHP/05-Rehab-and-Maintenance/HTM-Duplex-Build",
    "20-KUBERA-HOMES/10-Hometown-Meadows-MHP/06-Financials/Rent-Roll",

    "20-KUBERA-HOMES/20-106-Fox-Run",
    ...property("20-KUBERA-HOMES/20-106-Fox-Run"),
    "20-KUBERA-HOMES/20-106-Fox-Run/02-Financing-and-Lender/VAS-Refi-2026",

    "20-KUBERA-HOMES/30-406-408-Harrison-St",
    ...property("20-KUBERA-HOMES/30-406-408-Harrison-St"),
    "20-KUBERA-HOMES/30-406-408-Harrison-St/04-Leases-and-Tenants/Unit-406",
    "20-KUBERA-HOMES/30-406-408-Harrison-St/04-Leases-and-Tenants/Unit-408",

    // ---- Drive 4 ----
    "30-AHTX/00-Entity-Docs",
    "30-AHTX/00-Entity-Docs/Operating-Agreement",
    "30-AHTX/00-Entity-Docs/83b-Elections",
    "30-AHTX/00-Entity-Docs/Tax",
    "30-AHTX/00-Entity-Docs/Banking",

    "30-AHTX/10-4821-24th-St-Lubbock",
    ...property("30-AHTX/10-4821-24th-St-Lubbock"),
    "30-AHTX/20-3416-39th-St-Lubbock",
    ...property("30-AHTX/20-3416-39th-St-Lubbock"),
    "30-AHTX/30-2816-41st-St-Lubbock",
    ...property("30-AHTX/30-2816-41st-St-Lubbock"),
    "30-AHTX/40-1690-W-US-Hwy-70-Plainview",
    ...property("30-AHTX/40-1690-W-US-Hwy-70-Plainview"),
    "30-AHTX/50-11507-Topeka-Ave-Lubbock",
    ...property("30-AHTX/50-11507-Topeka-Ave-Lubbock"),

    "30-AHTX/60-1920-27th-St-Duplex",
    ...property("30-AHTX/60-1920-27th-St-Duplex"),
    "30-AHTX/60-1920-27th-St-Duplex/04-Leases-and-Tenants/Unit-A",
    "30-AHTX/60-1920-27th-St-Duplex/04-Leases-and-Tenants/Unit-B",

    // ---- Drive 5 ----
    "40-MINE-CREEK/00-Entity-Docs",
    "40-MINE-CREEK/00-Entity-Docs/Operating-Agreement",
    "40-MINE-CREEK/00-Entity-Docs/Tax",
    "40-MINE-CREEK/00-Entity-Docs/Banking",
];

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

async function findFolder(driveId, parentId, name) {
    const escaped = name.replace(/'/g, "\\'");
    const query = encodeURIComponent(
        `'${parentId}' in parents and name='${escaped}' and mimeType='${FOLDER_MIME}' and trashed=false`,
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

console.log(`Signed in as ${SUBJECT}\n`);

const cache = new Map();
let created = 0;
let existed = 0;
let failed = 0;

for (const path of PATHS) {
    const [driveName, ...segments] = path.split("/");
    const driveId = driveByName.get(driveName);

    if (!driveId) {
        console.error(`MISSING DRIVE  ${driveName}`);
        failed += 1;
        continue;
    }

    let parentId = driveId;
    let walked = driveName;

    for (const segment of segments) {
        walked += `/${segment}`;

        if (cache.has(walked)) {
            parentId = cache.get(walked);
            continue;
        }

        let folder = await findFolder(driveId, parentId, segment);

        if (folder) {
            existed += 1;
        } else {
            folder = await api("files?supportsAllDrives=true&fields=id,name", {
                method: "POST",
                body: JSON.stringify({
                    name: segment,
                    mimeType: FOLDER_MIME,
                    parents: [parentId],
                }),
            });
            created += 1;
            console.log(`created  ${walked}`);
        }

        cache.set(walked, folder.id);
        parentId = folder.id;
    }
}

console.log(
    `\nDone. Created ${created}, already there ${existed}, failed ${failed}`,
);
console.log(`Total paths in list: ${PATHS.length}`);