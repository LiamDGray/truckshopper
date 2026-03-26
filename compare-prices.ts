import fs from 'fs';
import path from 'path';

interface Part {
    name: string;
    price: number;
    qty: number;
}

const AUTOZONE_CREDIT = 108.00;
const AUTOZONE_DISCOUNT_THRESHOLD = 100.00;
const AUTOZONE_DISCOUNT_RATE = 0.20;

function getLatestSnapshot(site: string) {
    const snapshotDir = path.join(process.cwd(), 'snapshots');
    if (!fs.existsSync(snapshotDir)) return null;
    const files = fs.readdirSync(snapshotDir)
        .filter(f => f.startsWith(`${site}_`))
        .sort()
        .reverse();
    if (files.length === 0) return null;
    return JSON.parse(fs.readFileSync(path.join(snapshotDir, files[0]), 'utf8'));
}

// Hardcoded for now based on the PDF OCR or user input
// Ideally we'd have a parser for the AutoZone PDF too
const autozoneCart: Part[] = [
    { name: "Water Pump", price: 65.99, qty: 1 },
    { name: "Radiator Hose (Upper)", price: 15.49, qty: 1 },
    { name: "Radiator Hose (Lower)", price: 18.99, qty: 1 },
    { name: "Thermostat", price: 12.99, qty: 1 },
    { name: "Fan Belt", price: 22.49, qty: 1 }
];

function analyze() {
    const amayamaData = getLatestSnapshot('amayama');
    if (!amayamaData) {
        console.log("No Amayama snapshot found. Run the proxy and visit your cart first.");
        return;
    }

    let azTotal = autozoneCart.reduce((sum, p) => sum + p.price * p.qty, 0);
    let azDiscounted = azTotal >= AUTOZONE_DISCOUNT_THRESHOLD ? azTotal * (1 - AUTOZONE_DISCOUNT_RATE) : azTotal;
    let azFinalCost = Math.max(0, azDiscounted - AUTOZONE_CREDIT);

    console.log(`--- AutoZone Analysis ---`);
    console.log(`Total: $${azTotal.toFixed(2)}`);
    if (azTotal >= AUTOZONE_DISCOUNT_THRESHOLD) {
        console.log(`Discount (20%): -$${(azTotal * AUTOZONE_DISCOUNT_RATE).toFixed(2)}`);
    }
    console.log(`Credit: -$${AUTOZONE_CREDIT.toFixed(2)}`);
    console.log(`Final Out-of-Pocket: $${azFinalCost.toFixed(2)}`);

    console.log(`\n--- Amayama Comparison ---`);
    // Amayama items are OEM.
    // We should compare item by item if possible.
    // For this demonstration, we'll just list them.
    console.log(`OEM Items available in Amayama cart:`);
    amayamaData.forEach((item: any) => {
        console.log(`- ${item.name || 'OEM Part'}: $${item.priceUSD} (Qty: ${item.qty})`);
    });

    console.log(`\n--- Strategy Advice ---`);
    if (azFinalCost === 0) {
        console.log(`Your AutoZone credit covers EVERYTHING. Buy the aftermarket parts there for $0.`);
        console.log(`Only buy from Amayama if you MUST have OEM quality for specific critical components.`);
    } else {
        console.log(`You are spending $${azFinalCost.toFixed(2)} at AutoZone.`);
        console.log(`Consider moving items to Amayama if (Amayama_Price + Shipping) < (AutoZone_Price * 0.8).`);
    }
}

analyze();
