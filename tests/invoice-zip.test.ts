import test from "node:test";
import assert from "node:assert/strict";
import { createZip } from "../lib/zip";
test("creates a ZIP containing separate XML invoices",()=>{const zip=createZip([{name:"001.ubl.xml",data:"<Invoice>1</Invoice>"},{name:"002.ubl.xml",data:"<Invoice>2</Invoice>"}]);assert.equal(zip.readUInt32LE(0),0x04034b50);assert.ok(zip.includes(Buffer.from("001.ubl.xml")));assert.ok(zip.includes(Buffer.from("002.ubl.xml")));assert.equal(zip.readUInt32LE(zip.length-22),0x06054b50);assert.equal(zip.readUInt16LE(zip.length-14),2);});
