class Model {
    constructor(gl, uSteps, vSteps, L, T, B) {
        this.gl = gl;
        this.uSteps = uSteps;
        this.vSteps = vSteps;
        this.L = L; 
        this.T = T;
        this.B = B; 

        this.uMin = 0.0;
        this.uMax = 1.0;
        this.vMin = -0.3;
        this.vMax = 1.0;

        this.uLinesPlus = [];
        this.uLinesMinus = [];
        this.vLinesPlus = [];
        this.vLinesMinus = [];
        this.generateWireframeData();

        let filledData = this.generateFilledSurfaceData();
        this.vertices = filledData.vertices;
        this.indices = filledData.indices;
        this.count = this.indices.length;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        this.textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, filledData.textureCoords, gl.STATIC_DRAW);

    }

    generateWireframeData() {
        for (let j = 0; j <= this.vSteps; j++) {
            let vVal = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
            let oneULinePlus = [];
            let oneULineMinus = [];
            for (let i = 0; i <= this.uSteps; i++) {
                let uVal = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
                let vertPlus = this.calculateVertex(uVal, vVal, +1);
                let vertMinus = this.calculateVertex(uVal, vVal, -1);
                oneULinePlus.push(...vertPlus);
                oneULineMinus.push(...vertMinus);
            }
            this.uLinesPlus.push(oneULinePlus);
            this.uLinesMinus.push(oneULineMinus);
        }

        for (let i = 0; i <= this.uSteps; i++) {
            let uVal = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
            let oneVLinePlus = [];
            let oneVLineMinus = [];
            for (let j = 0; j <= this.vSteps; j++) {
                let vVal = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
                let vertPlus = this.calculateVertex(uVal, vVal, +1);
                let vertMinus = this.calculateVertex(uVal, vVal, -1);
                oneVLinePlus.push(...vertPlus);
                oneVLineMinus.push(...vertMinus);
            }
            this.vLinesPlus.push(oneVLinePlus);
            this.vLinesMinus.push(oneVLineMinus);
        }
    }

    calculateVertex(u, v, sign) {
        const a = 1.0;
        const b = 3.0;
        const c = 2.0;
        const d = 4.0;

        let uRad = u * 2 * Math.PI;
        let vRad = v * 2 * Math.PI;

        const f = (a, b, j) => ((a * b) / (Math.sqrt(a ** 2 * Math.sin(j) ** 2 + b ** 2 * Math.cos(j) ** 2)));

        let commonFactor = f(a, b, vRad);
        let xyFactor = 0.05 * (commonFactor * (1 + Math.cos(uRad) + ((d ** 2 - c ** 2) * ((1 - Math.cos(uRad)) / commonFactor))));
        let zFactor = 0.05 * (commonFactor - (d ** 2 - c ** 2) / commonFactor);

        const X = xyFactor * Math.cos(vRad);
        const Y = xyFactor * Math.sin(vRad);
        const Z = zFactor * Math.sin(uRad);

        return [X, Y, Z];
    }


    generateFilledSurfaceData() {
        let verticesPlus = [];
        let verticesMinus = [];
        let indicesPlus = [];
        let indicesMinus = [];
        let textureCoords = [];

        for (let j = 0; j <= this.vSteps; j++) {
            let v = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
            for (let i = 0; i <= this.uSteps; i++) {
                let u = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
                let vert = this.calculateVertex(u, v, +1);
                verticesPlus.push(...vert);
                textureCoords.push(u, v);
            }
        }

        for (let j = 0; j <= this.vSteps; j++) {
            let v = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
            for (let i = 0; i <= this.uSteps; i++) {
                let u = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
                let vert = this.calculateVertex(u, v, -1);
                verticesMinus.push(...vert);
                textureCoords.push(u, v);
            }
        }

        for (let j = 0; j < this.vSteps; j++) {
            for (let i = 0; i < this.uSteps; i++) {
                let index = j * (this.uSteps + 1) + i;
                indicesPlus.push(index, index + 1, index + this.uSteps + 1);
                indicesPlus.push(index + 1, index + this.uSteps + 2, index + this.uSteps + 1);
            }
        }

        let offset = (this.uSteps + 1) * (this.vSteps + 1);
        for (let j = 0; j < this.vSteps; j++) {
            for (let i = 0; i < this.uSteps; i++) {
                let index = j * (this.uSteps + 1) + i + offset;
                indicesMinus.push(index, index + this.uSteps + 1, index + 1);
                indicesMinus.push(index + 1, index + this.uSteps + 1, index + this.uSteps + 2);
            }
        }

        let vertices = verticesPlus.concat(verticesMinus);
        let indices = indicesPlus.concat(indicesMinus);
        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
             textureCoords: new Float32Array(textureCoords)
        };
    }

    draw() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    drawWireframe(shaderProgram) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.iAttribVertex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(shProgram.iTextureCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iTextureCoords);

        for (let i = 0; i < this.count; i += 3) {
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i * 2);
        }
    }
}