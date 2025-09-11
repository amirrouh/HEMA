/**
 * NIFTI File Parser
 */
class NIFTIParser {
    static parse(buffer) {
        const dataView = new DataView(buffer);
        
        // Check for NIFTI magic number
        const magic = dataView.getUint32(344, true);
        if (magic !== 0x2B31696E) { // "ni1\0" in little endian
            throw new Error('Not a valid NIFTI file');
        }
        
        // Parse header dimensions
        const dims = [];
        for (let i = 0; i < 8; i++) {
            dims.push(dataView.getUint16(40 + i * 2, true));
        }
        
        const ndim = dims[0];
        const sizes = dims.slice(1, ndim + 1);
        
        // Get data type
        const datatype = dataView.getUint16(70, true);
        const bitpix = dataView.getUint16(72, true);
        
        // Get voxel offset (where data starts)
        const voxOffset = dataView.getFloat32(108, true);
        
        // Get scale slope and intercept for intensity scaling
        const sclSlope = dataView.getFloat32(112, true);
        const sclInter = dataView.getFloat32(116, true);
        
        // Calculate data start position
        const headerSize = 348;
        const dataStart = voxOffset > 0 ? Math.floor(voxOffset) : headerSize;
        
        // Parse data based on datatype
        const totalVoxels = sizes.reduce((a, b) => a * b, 1);
        let data;
        
        switch (datatype) {
            case 2: // DT_UNSIGNED_CHAR / UINT8
                data = new Uint8Array(buffer, dataStart, totalVoxels);
                break;
            case 4: // DT_SIGNED_SHORT / INT16
                data = new Int16Array(buffer, dataStart, totalVoxels);
                break;
            case 8: // DT_SIGNED_INT / INT32
                data = new Int32Array(buffer, dataStart, totalVoxels);
                break;
            case 16: // DT_FLOAT / FLOAT32
                data = new Float32Array(buffer, dataStart, totalVoxels);
                break;
            case 64: // DT_DOUBLE / FLOAT64
                data = new Float64Array(buffer, dataStart, totalVoxels);
                break;
            case 256: // DT_INT8
                data = new Int8Array(buffer, dataStart, totalVoxels);
                break;
            case 512: // DT_UINT16
                data = new Uint16Array(buffer, dataStart, totalVoxels);
                break;
            case 768: // DT_UINT32
                data = new Uint32Array(buffer, dataStart, totalVoxels);
                break;
            default:
                throw new Error(`Unsupported NIFTI data type: ${datatype}`);
        }
        
        // Apply scaling if specified
        if (sclSlope !== 0 && sclSlope !== 1) {
            const scaledData = new Float32Array(data.length);
            for (let i = 0; i < data.length; i++) {
                scaledData[i] = data[i] * sclSlope + sclInter;
            }
            data = scaledData;
        } else if (sclInter !== 0) {
            const scaledData = new Float32Array(data.length);
            for (let i = 0; i < data.length; i++) {
                scaledData[i] = data[i] + sclInter;
            }
            data = scaledData;
        }
        
        // Determine type string for consistency with NRRD parser
        let type;
        switch (datatype) {
            case 2:
            case 256:
                type = 'unsigned char';
                break;
            case 4:
                type = 'short';
                break;
            case 8:
                type = 'int';
                break;
            case 16:
                type = 'float';
                break;
            case 64:
                type = 'double';
                break;
            case 512:
                type = 'unsigned short';
                break;
            case 768:
                type = 'unsigned int';
                break;
            default:
                type = `datatype_${datatype}`;
        }
        
        return { data, sizes, type };
    }
}