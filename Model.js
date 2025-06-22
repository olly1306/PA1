function createSurfaceData() {
    const uSteps = 50;
    const vSteps = 50;
    const uMin = 0.0;
    const uMax = 1.0;
    const vMin = -0.3;
    const vMax = 1.0;

    let verticesPlus = [];
    let verticesMinus = [];
    let textureCoords = [];
    let indicesPlus = [];
    let indicesMinus = [];

    for (let j = 0; j <= vSteps; j++) {
        let v = vMin + (vMax - vMin) * (j / vSteps);
        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * (i / uSteps);
            let vert = calculateVertex(u, v, 1);
            verticesPlus.push(vert);
            textureCoords.push([u, v]);
        }
    }

    for (let j = 0; j <= vSteps; j++) {
        let v = vMin + (vMax - vMin) * (j / vSteps);
        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * (i / uSteps);
            let vert = calculateVertex(u, v, -1);
            verticesMinus.push(vert);
            textureCoords.push([u, v]);
        }
    }

    for (let j = 0; j < vSteps; j++) {
        for (let i = 0; i < uSteps; i++) {
            let index = j * (uSteps + 1) + i;
            indicesPlus.push([index, index + 1, index + uSteps + 1]);
            indicesPlus.push([index + 1, index + uSteps + 2, index + uSteps + 1]);
        }
    }

    let offset = (uSteps + 1) * (vSteps + 1);
    for (let j = 0; j < vSteps; j++) {
        for (let i = 0; i < uSteps; i++) {
            let index = j * (uSteps + 1) + i + offset;
            indicesMinus.push([index, index + uSteps + 1, index + 1]);
            indicesMinus.push([index + 1, index + uSteps + 1, index + uSteps + 2]);
        }
    }

    let vertices = verticesPlus.concat(verticesMinus);
    let faces = indicesPlus.concat(indicesMinus);

    let objData = "# Surface with UV\n";

    vertices.forEach((v) => {
        objData += `v ${v[0]} ${v[1]} ${v[2]}\n`;
    });

    textureCoords.forEach((uv) => {
        objData += `vt ${uv[0]} ${uv[1]}\n`;
    });

    for (let f of faces) {
        objData += `f ${f[0] + 1}/${f[0] + 1} ${f[1] + 1}/${f[1] + 1} ${f[2] + 1}/${f[2] + 1}\n`;
    }

    return objData;
}

function calculateVertex(u, v, sign) {
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

function loadSurface() {
    const objData = createSurfaceData();
    const objBlob = new Blob([objData], { type: "text/plain" });
    const objURL = URL.createObjectURL(objBlob);

    const loader = new THREE.OBJLoader();
    loader.load(
        objURL,
        (object) => {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('wall.jpg');

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            });

            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });

            object.position.y = 2;
            object.scale.set(0.3, 0.3, 0.3);
            arWorldRoot.add(object);

            URL.revokeObjectURL(objURL);
        },
        undefined,
        (error) => {
            console.error("OBJ loading failed:", error);
        }
    );
}