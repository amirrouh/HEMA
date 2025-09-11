/**
 * NRRD File Parser
 */
class NRRDParser {
    static parse(buffer) {
        const bytes = new Uint8Array(buffer);
        
        // Find header end (double newline)
        let headerEnd = 0;
        for (let i = 0; i < bytes.length - 1; i++) {
            if (bytes[i] === 10 && bytes[i + 1] === 10) {
                headerEnd = i + 2;
                break;
            }
        }

        // Parse header
        const headerString = new TextDecoder().decode(bytes.slice(0, headerEnd));
        const lines = headerString.split('\n');
        
        let sizes = null;
        let type = null;
        let encoding = null;
        
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            
            const field = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            
            switch (field) {
                case 'sizes':
                    sizes = value.split(' ').map(Number);
                    break;
                case 'type':
                    type = value;
                    break;
                case 'encoding':
                    encoding = value;
                    break;
            }
        }

        if (!sizes) {
            throw new Error('Invalid NRRD file - no sizes found');
        }

        // Parse data
        let dataBytes = bytes.slice(headerEnd);
        
        // Handle GZIP compression
        if (encoding === 'gzip' || encoding === 'gz') {
            try {
                dataBytes = pako.inflate(dataBytes);
            } catch (err) {
                throw new Error('Failed to decompress GZIP data: ' + err.message);
            }
        }

        // Create typed array based on type
        const totalVoxels = sizes.reduce((a, b) => a * b, 1);
        let data;
        
        switch (type) {
            case 'unsigned char':
            case 'uint8':
                data = new Uint8Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            case 'short':
            case 'int16':
                data = new Int16Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            case 'unsigned short':
            case 'uint16':
                data = new Uint16Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            case 'int':
            case 'signed int':
            case 'int32':
                data = new Int32Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            case 'unsigned int':
            case 'uint32':
                data = new Uint32Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            case 'float':
                data = new Float32Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            case 'double':
                data = new Float64Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                break;
            default:
                throw new Error(`Unsupported data type: ${type}`);
        }

        return { data, sizes, type };
    }
}