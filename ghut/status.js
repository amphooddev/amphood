/* Prints what the amp holds and what it has done. Read-only. Usage: node status.js [ampAddress] */
import { getAddress } from 'viem';
import { CFG, balance, fmt, readLedger } from './lib.js';
const amp = process.argv[2] || process.env.amp_ADDRESS;
if (!amp) { console.log('pass the amp address or set amp_ADDRESS in .env'); process.exit(1); }
const usdg = await balance(CFG.quote.address, amp), fly = await balance(CFG.flybrain.address, amp);
console.log(`amp ${getAddress(amp)}`);
console.log(`  USDG      ${fmt(usdg, 6)}`);
console.log(`  FLYBRAIN  ${fmt(fly)}`);
const l = readLedger();
console.log(`ledger: ${l.epochs.length} epochs, ${l.buys.length} buys, ${l.drops.length} drops`);
console.log(`  fly bought ${fmt(BigInt(l.totals.flyBought))} · fly dropped ${fmt(BigInt(l.totals.flyDropped))} · amphood burned ${fmt(BigInt(l.totals.amphoodBurned))} · last recipients ${l.totals.recipients}`);
