/**
 * STL File Parser
 */
class STLParser {
    static parse(buffer) {
        const dataView = new DataView(buffer);
        
        // Check if it's ASCII or binary STL
        const header = new TextDecoder().decode(new Uint8Array(buffer, 0, 5));
        
        if (header.toLowerCase() === 'solid') {
            // Try to parse as ASCII first
            try {
                return this.parseASCII(buffer);
            } catch (e) {
                // If ASCII parsing fails, try binary
                return this.parseBinary(buffer);
            }
        } else {
            // Binary STL
            return this.parseBinary(buffer);
        }
    }
    
    static parseASCII(buffer) {
        const text = new TextDecoder().decode(new Uint8Array(buffer));
        const lines = text.split('\n').map(line => line.trim());
        
        const vertices = [];
        const normals = [];
        const faces = [];
        
        let currentFaceVertices = [];
        let currentNormal = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('facet normal')) {
                const parts = line.split(/\s+/);
                currentNormal = [
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                    parseFloat(parts[4])
                ];
            } else if (line.startsWith('vertex')) {
                const parts = line.split(/\s+/);
                const vertex = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ];
                
                const vertexIndex = vertices.length;
                vertices.push(vertex);
                normals.push(currentNormal);
                currentFaceVertices.push(vertexIndex);
                
                if (currentFaceVertices.length === 3) {
                    faces.push([...currentFaceVertices]);
                    currentFaceVertices = [];
                }
            }
        }
        
        const verticesArray = new Float32Array(vertices.flat());
        const normalsArray = new Float32Array(normals.flat());
        const indicesArray = new Uint32Array(faces.flat());
        
        console.log('ASCII STL parsed:', {
            verticesLength: verticesArray.length,
            normalsLength: normalsArray.length,
            indicesLength: indicesArray.length,
            triangleCount: faces.length
        });
        
        // Validate the data
        if (verticesArray.length === 0) {
            throw new Error('No vertices found in STL file');
        }
        
        if (verticesArray.length % 3 !== 0) {
            throw new Error('Invalid vertex data - not divisible by 3');
        }
        
        return {
            vertices: verticesArray,
            normals: normalsArray,
            indices: indicesArray,
            triangleCount: faces.length
        };
    }
    
    static parseBinary(buffer) {
        const dataView = new DataView(buffer);
        
        if (buffer.byteLength < 84) {
            throw new Error('STL file too small - invalid binary STL format');
        }
        
        // Skip 80-byte header
        const triangleCount = dataView.getUint32(80, true);
        
        console.log('Binary STL - Triangle count:', triangleCount);
        
        if (triangleCount === 0) {
            throw new Error('STL file contains no triangles');
        }
        
        // Verify file size matches expected size
        const expectedSize = 84 + (triangleCount * 50); // 50 bytes per triangle
        if (buffer.byteLength < expectedSize) {
            console.warn('STL file size mismatch. Expected:', expectedSize, 'Actual:', buffer.byteLength);
        }
        
        const vertices = [];
        const normals = [];
        const faces = [];
        
        let offset = 84; // Start after header and triangle count
        
        for (let i = 0; i < triangleCount; i++) {
            // Read normal vector (3 floats)
            const normal = [
                dataView.getFloat32(offset, true),
                dataView.getFloat32(offset + 4, true),
                dataView.getFloat32(offset + 8, true)
            ];
            offset += 12;
            
            // Read 3 vertices (9 floats total)
            const faceVertices = [];
            for (let j = 0; j < 3; j++) {
                const vertex = [
                    dataView.getFloat32(offset, true),
                    dataView.getFloat32(offset + 4, true),
                    dataView.getFloat32(offset + 8, true)
                ];
                offset += 12;
                
                const vertexIndex = vertices.length;
                vertices.push(vertex);
                normals.push(normal);
                faceVertices.push(vertexIndex);
            }
            
            faces.push(faceVertices);
            
            // Skip attribute byte count (2 bytes)
            offset += 2;
        }
        
        const verticesArray = new Float32Array(vertices.flat());
        const normalsArray = new Float32Array(normals.flat());
        const indicesArray = new Uint32Array(faces.flat());
        
        console.log('Binary STL parsed:', {
            verticesLength: verticesArray.length,
            normalsLength: normalsArray.length,
            indicesLength: indicesArray.length,
            triangleCount: triangleCount
        });
        
        // Validate the data
        if (verticesArray.length === 0) {
            throw new Error('No vertices found in STL file');
        }
        
        if (verticesArray.length % 3 !== 0) {
            throw new Error('Invalid vertex data - not divisible by 3');
        }
        
        return {
            vertices: verticesArray,
            normals: normalsArray,
            indices: indicesArray,
            triangleCount: triangleCount
        };
    }
    
    static calculateBoundingBox(vertices) {
        if (vertices.length === 0) return null;
        
        let minX = vertices[0], maxX = vertices[0];
        let minY = vertices[1], maxY = vertices[1];
        let minZ = vertices[2], maxZ = vertices[2];
        
        for (let i = 3; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];
            
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
        
        return {
            min: [minX, minY, minZ],
            max: [maxX, maxY, maxZ],
            center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
            size: [maxX - minX, maxY - minY, maxZ - minZ]
        };
    }
}