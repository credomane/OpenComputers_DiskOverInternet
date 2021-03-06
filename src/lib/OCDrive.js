const fs = require("fs");

class OCDrive {
    constructor(disk, sourcePath) {
        disk = disk.toLowerCase();
        if (!disk.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            throw new Error("Invalid Disk UUID: " + disk);
        }

        if (!sourcePath.endsWith("/")) {
            sourcePath += "/";
        }

        if (!fs.existsSync(sourcePath + disk + "/disk.json")) {
            throw new Error("Invalid disk: " + sourcePath + disk + "/disk.json");
        }

        this.disk = disk;
        this.sourcePath = sourcePath;
        this.diskJson = this.sourcePath + this.disk + "/disk.json";
        this.diskData = this.sourcePath + this.disk + "/disk.bin";

        this.info = JSON.parse(fs.readFileSync(this.diskJson, "utf8"))
    }

    _commit() {
        fs.writeFileSync(this.diskJson, JSON.stringify(this.info, null, 2), "utf8")
    }

    /**
     * Gets the disk's UUID.
     * @returns string uuid
     */
    getUUID() {
        return this.disk;
    }

    /**
     * Get the current label of the disk.
     */
    getLabel() {
        return this.info.label;
    }

    /**
     * Set the current label of the disk.
     */
    setLabel(newLabel = "") {
        this.info.label = newLabel;
        this._commit();
        return this.info.label;
    }

    /**
     * Returns the total bytes read from the drive.
     */
    getBytesRead() {
        return this.info.bytesRead;
    }

    /**
     * Returns the total bytes written to the drive.
     */
    getBytesWritten() {
        return this.info.bytesWritten;
    }

    /**
     * Returns the total space of the drive, in bytes.
     */
    getCapacity() {
        return this.info.capacity;
    }

    /**
     * Returns the number of platters.
     */
    getPlatterCount() {
        return this.info.platterCount;
    }

    /**
     * Returns the size of a single sector, in bytes.
     */
    getSectorSize() {
        return this.info.sectorSize;
    }

    /**
     * Read a single byte at the specified offset.
     */
    readByte(offset) {
        let data = Buffer.allocUnsafe(1);
        let f = fs.openSync(this.diskData, "r+");
        fs.readSync(f, data, 0, 1, offset);
        fs.closeSync(f);
        this.info.bytesRead++;
        this._commit();
        return data.toString("utf8");
    }

    /**
     * Write a single byte to the specified offset.
     */
    writeByte(offset, value) {
        let data = Buffer.from(value.substring(0, 1));
        let f = fs.openSync(this.diskData, "r+");
        fs.writeSync(f, data, offset);
        fs.closeSync(f);
        this.info.bytesWritten++;
        this._commit();
    }

    /**
     * Read the current contents of the specified sector.
     */
    readSector(sector) {
        let data = Buffer.allocUnsafe(1);
        let offset = sector * this.sectorSize();
        let f = fs.openSync(this.diskData, "r+");
        fs.readSync(f, data, 0, this.sectorSize(), offset);
        fs.closeSync(f);
        this.info.bytesRead += this.sectorSize();
        this._commit();
        return data.toString("utf8");
    }

    /**
     * Write the specified contents to the specified sector.
     */
    writeSector(sector, value) {
        let f = fs.openSync(this.diskData, "r+");
        let data = Buffer.from(value.substring(0, this.sectorSize()));
        let offset = sector * this.sectorSize();
        fs.writeSync(f, data, offset);
        fs.closeSync(f);
        this.info.bytesWritten += this.sectorSize();
        this._commit();
    }
}


module.exports = OCDrive;
